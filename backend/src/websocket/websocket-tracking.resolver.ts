import { Resolver, Subscription, Mutation, Args, Context } from '@nestjs/graphql';
import { Inject, Logger } from '@nestjs/common';
import { PubSub } from 'graphql-subscriptions';
import { SessionManagerService } from './session-manager.service';
import { StreamProcessingService } from './stream-processing.service';
import { IntentService } from '../intent/intent.service';
import { TrackingEventInput, TrackingEventResponse, LiveSessionUpdate, IntentUpdate, UIInjectionPayload } from './dto/websocket.types';
import { AdminAlertType } from '../analytics/dto/cohort.types';

/**
 * GraphQL WebSocket Resolver for real-time tracking
 * Uses GraphQL Subscriptions for bi-directional communication
 */
@Resolver()
export class WebSocketTrackingResolver {
    private readonly logger = new Logger(WebSocketTrackingResolver.name);

    constructor(
        @Inject('PUB_SUB') private pubSub: PubSub,
        private sessionManager: SessionManagerService,
        private streamProcessor: StreamProcessingService,
        private intentService: IntentService,
    ) { }

    /**
     * Mutation: Track real-time event (replaces REST endpoint)
     */
    @Mutation(() => TrackingEventResponse)
    async trackEvent(
        @Args('input') input: TrackingEventInput,
        @Context() context: any,
    ): Promise<TrackingEventResponse> {
        try {
            const { siteId, sessionId, eventType, timestamp } = input;

            // Parse data if it's a JSON string to ensure proper storage format in MongoDB
            let data: any = input.data;
            try {
                if (typeof data === 'string') {
                    data = JSON.parse(data);
                }
            } catch (e) {
                this.logger.warn(`Failed to parse event data json: ${e.message}`);
            }

            this.logger.log(`[WebSocket] Received event: ${eventType} for site: ${siteId}, session: ${sessionId}`);

            // Get or create session
            let session = await this.sessionManager.getSession(sessionId);
            if (!session) {
                const ipAddress = this.getClientIP(context.req);
                let userAgent = context.req?.headers?.['user-agent'] || '';

                // Prefer userAgent from payload if available (sent by socketTracker)
                if (data && data.userAgent) {
                    userAgent = data.userAgent;
                }

                // Initialize new session (Redis)
                await this.sessionManager.initSession(sessionId, siteId, {
                    socketId: context.req?.headers?.['x-socket-id'] || 'http-fallback',
                    ipAddress,
                    userAgent,
                });

                // Initialize Persistent Session (MongoDB)
                // Try to extract metadata from data if possible (e.g. from pageview or signals)
                let metadata = null;
                if (data && data.metadata) metadata = data.metadata;

                await this.streamProcessor.initPersistentSession(
                    sessionId,
                    siteId,
                    ipAddress,
                    userAgent,
                    metadata
                );

                session = await this.sessionManager.getSession(sessionId);
            }

            // Process event through stream processor
            await this.streamProcessor.processEvent({
                sessionId,
                eventType,
                data,
                timestamp: timestamp || Date.now(),
            });

            // Update intent score if applicable
            let intentScore = session?.intentScore || 0;
            const previousScore = session?.intentScore || 0; // Capture before update
            let uiPayload = null;

            if (this.shouldUpdateIntent(eventType)) {
                const intentResult = await this.updateIntentScore(sessionId, eventType, data);
                intentScore = intentResult.score;
                uiPayload = intentResult.uiPayload;

                // Publish intent update to subscriptions
                await this.pubSub.publish('intentUpdate', {
                    intentUpdate: {
                        sessionId,
                        score: intentScore,
                        category: intentResult.category,
                        timestamp: Date.now(),
                    },
                });

                // If UI payload generated, publish it
                if (uiPayload) {
                    const payloadString = typeof uiPayload === 'string' ? uiPayload : JSON.stringify(uiPayload);
                    await this.pubSub.publish(`uiInjection:${sessionId}`, {
                        uiInjection: {
                            sessionId,
                            payload: payloadString,
                            timestamp: Date.now(),
                        },
                    });
                }

                // Bug #13 fix: Auto-trigger VIP alert when score crosses 70 threshold.
                // Uses vipAlertSent flag to prevent duplicate alerts per session.
                const freshSession = await this.sessionManager.getSession(sessionId);
                if (
                    intentResult.score >= 70 &&
                    previousScore < 70 &&
                    !freshSession?.vipAlertSent
                ) {
                    await this.publishVIPAlert(siteId, sessionId, intentResult.score);
                    await this.sessionManager.updateSession(sessionId, { vipAlertSent: true });
                    this.logger.log(`🌟 VIP alert fired for session ${sessionId} (score: ${intentResult.score})`);
                }

                // Persist intent score + session metrics to MongoDB VisitorSession
                if (eventType === 'signals_batch') {
                    await this.streamProcessor.updatePersistentSession(
                        siteId,
                        sessionId,
                        data,
                        { score: intentResult.score, category: intentResult.category },
                    );
                } else {
                    await this.streamProcessor.updatePersistentSession(
                        siteId,
                        sessionId,
                        { url: data?.url },
                        { score: intentResult.score, category: intentResult.category },
                    );
                }
            }

            // Publish live session update for admin dashboard
            await this.pubSub.publish(`liveSession:${siteId}`, {
                liveSessionUpdate: {
                    sessionId,
                    siteId,
                    eventType,
                    intentScore,
                    lastActivity: Date.now(),
                    currentPage: session?.currentPage || '',
                },
            });

            return {
                success: true,
                sessionId,
                intentScore,
                uiPayload: uiPayload ? (typeof uiPayload === 'string' ? uiPayload : JSON.stringify(uiPayload)) : null,
            };

        } catch (error) {
            this.logger.error(`Error tracking event: ${error.message}`, error.stack);
            return {
                success: false,
                sessionId: input.sessionId,
                intentScore: 0,
                error: error.message,
            };
        }
    }

    /**
     * Subscription: Live session updates for admin dashboard
     * Admins subscribe to see real-time visitor activity
     */
    @Subscription(() => LiveSessionUpdate, {
        filter: (payload, variables) => {
            // Filter by siteId
            return payload.liveSessionUpdate.siteId === variables.siteId;
        },
    })
    liveSessionUpdate(@Args('siteId') siteId: string) {
        return this.pubSub.asyncIterator(`liveSession:${siteId}`);
    }

    /**
     * Subscription: Intent score updates
     * Visitor receives intent score updates in real-time
     */
    @Subscription(() => IntentUpdate, {
        filter: (payload, variables) => {
            return payload.intentUpdate.sessionId === variables.sessionId;
        },
    })
    intentUpdate(@Args('sessionId') sessionId: string) {
        return this.pubSub.asyncIterator('intentUpdate');
    }

    /**
     * Subscription: UI injection payloads
     * Visitor receives personalized UI to inject into their page
     */
    @Subscription(() => UIInjectionPayload, {
        filter: (payload, variables) => {
            return payload.uiInjection.sessionId === variables.sessionId;
        },
    })
    uiInjection(@Args('sessionId') sessionId: string) {
        return this.pubSub.asyncIterator(`uiInjection:${sessionId}`);
    }

    /**
     * Subscription: Admin alerts (VIP visitors, anomalies, etc.)
     */
    // Bug #14 fix: adminAlerts now returns a typed AdminAlertType instead of raw JSON string.
    @Subscription(() => AdminAlertType)
    adminAlerts(@Args('siteId') siteId: string) {
        return this.pubSub.asyncIterator(`alerts:${siteId}`);
    }

    // Helper methods

    private shouldUpdateIntent(eventType: string): boolean {
        return ['click', 'scroll', 'exit_intent', 'form_focus', 'pageview', 'signals_batch', 'rage_click'].includes(eventType);
    }

    private async updateIntentScore(
        sessionId: string,
        eventType: string,
        data: any,
    ): Promise<{ score: number; category: string; uiPayload?: any }> {
        const session = await this.sessionManager.getSession(sessionId);
        if (!session) {
            return { score: 0, category: 'Bouncer' };
        }

        // Build signals object from event data
        let signals: any = {
            dwell_time: {},
            scroll_velocity: 0,
            scroll_depth: 0,
            hesitation_event: false,
            rage_clicks: 0,
            copy_text: [],
            text_selections: [],
            events: [],
            url: session.currentPage || '',
        };

        // Populate signals based on event type
        if (eventType === 'signals_batch') {
            // Use the full batch data from tracker
            signals = { ...signals, ...data };
        } else if (eventType === 'scroll') {
            signals.scroll_depth = data.depth || 0;
            signals.scroll_velocity = data.velocity || 0;
        } else if (eventType === 'click') {
            signals.events.push({ type: 'click', timestamp: Date.now(), payload: data });
        } else if (eventType === 'exit_intent') {
            signals.events.push({ type: 'exit_intent', timestamp: Date.now() });
        }

        // Calculate intent score using existing intent service
        const result = await this.intentService.analyzeAndGetUi(
            session.intentScore,
            signals,
            session.siteId,
        );

        // Update session with new score
        await this.sessionManager.updateIntentScore(sessionId, result.score);

        return {
            score: result.score,
            category: result.category,
            uiPayload: result.uiPayload,
        };
    }

    private getClientIP(req: any): string {
        if (!req) return '0.0.0.0';

        // Check for common proxy headers
        const forwardedFor = req.headers?.['x-forwarded-for'];
        let ipAddress = forwardedFor || req.socket?.remoteAddress || '0.0.0.0';

        if (Array.isArray(ipAddress)) {
            ipAddress = ipAddress[0];
        } else if (typeof ipAddress === 'string' && ipAddress.includes(',')) {
            ipAddress = ipAddress.split(',')[0].trim();
        }

        return ipAddress;
    }

    /**
     * Publish VIP visitor alert to admins.
     * Bug #14 fix: publishes typed AdminAlertType object, not a JSON string.
     */
    async publishVIPAlert(siteId: string, sessionId: string, score: number): Promise<void> {
        await this.pubSub.publish(`alerts:${siteId}`, {
            adminAlerts: {
                type: 'vip_visitor',
                sessionId,
                score,
                timestamp: Date.now(),
                message: `High-intent visitor detected (score: ${score})`,
                severity: 'info',
            },
        });
    }

    /**
     * Publish anomaly alert to admins.
     * Bug #14 fix: publishes typed AdminAlertType object, not a JSON string.
     */
    async publishAnomalyAlert(siteId: string, anomaly: any): Promise<void> {
        await this.pubSub.publish(`alerts:${siteId}`, {
            adminAlerts: {
                type: anomaly.type || 'anomaly',
                sessionId: anomaly.sessionId,
                score: anomaly.metric,
                timestamp: Date.now(),
                message: anomaly.type === 'rage_click'
                    ? `Rage click detected on ${anomaly.selector}`
                    : `Anomaly: ${anomaly.type}`,
                severity: 'warning',
            },
        });
    }
}
