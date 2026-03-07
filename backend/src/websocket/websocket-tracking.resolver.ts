import { Resolver, Subscription, Mutation, Query, Args, Context } from '@nestjs/graphql';
import { Inject, Logger } from '@nestjs/common';
import { PubSub } from 'graphql-subscriptions';
import { SessionManagerService } from './session-manager.service';
import { StreamProcessingService } from './stream-processing.service';
import { IntentService } from '../intent/intent.service';
import { TrackingEventInput, TrackingEventResponse, LiveSessionUpdate, IntentUpdate, UIInjectionPayload, ChatMessageInput, ChatResponse } from './dto/websocket.types';
import { AdminAlertType } from '../analytics/dto/cohort.types';
import { GeminiService } from '../ai-generation/gemini.service';
import { QdrantService } from '../qdrant/qdrant.service';
import { SitesService } from '../sites/sites.service';

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
        private geminiService: GeminiService,
        private qdrantService: QdrantService,
        private sitesService: SitesService,
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
            const previousScore = session?.intentScore || 0;
            let uiPayload = null;

            if (this.shouldUpdateIntent(eventType)) {
                const intentResult = await this.updateIntentScore(sessionId, eventType, data);
                intentScore = intentResult.score;

                // Only propagate server-side UI payload for concierge chat
                // (all other injections are handled client-side from prefetched payloads)
                if (intentResult.uiPayload && intentResult.uiPayload.type === 'concierge') {
                    uiPayload = intentResult.uiPayload;
                }

                // Phase 2: Accumulate interest profile on every signals_batch
                if (eventType === 'signals_batch' && data) {
                    await this.sessionManager.updateInterestProfile(sessionId, {
                        url: data.url,
                        text_selections: data.text_selections,
                        copy_text: data.copy_text,
                        dwell_time: data.dwell_time,
                    });
                }

                // Publish intent update to subscriptions
                await this.pubSub.publish('intentUpdate', {
                    intentUpdate: {
                        sessionId,
                        score: intentScore,
                        category: intentResult.category,
                        timestamp: Date.now(),
                    },
                });

                // If server-side UI payload generated (concierge only), publish it
                if (uiPayload) {
                    const payloadString = typeof uiPayload === 'string' ? uiPayload : JSON.stringify(uiPayload);
                    await this.pubSub.publish(`uiInjection:${sessionId}`, {
                        uiInjection: {
                            sessionId,
                            payload: payloadString,
                            timestamp: Date.now(),
                        },
                    });

                    // Record injection in session history
                    const parsedPayload = typeof uiPayload === 'string' ? JSON.parse(uiPayload) : uiPayload;
                    if (parsedPayload.id) {
                        await this.sessionManager.addInjectionRecord(sessionId, {
                            id: parsedPayload.id,
                            type: parsedPayload.type || 'inject',
                            intent: parsedPayload.intent || 'general',
                            timestamp: Date.now(),
                        });
                        // Persist as an active injection so page-load restoration can query it
                        if (parsedPayload.injection_target_selector || parsedPayload.targetSelector) {
                            await this.sessionManager.persistActiveInjection(sessionId, {
                                id: parsedPayload.id,
                                intent: parsedPayload.intent || 'general',
                                targetSelector: parsedPayload.injection_target_selector || parsedPayload.targetSelector || 'body',
                                position: parsedPayload.injection_position || parsedPayload.injectionPosition || 'afterend',
                                htmlPayload: parsedPayload.html_payload || parsedPayload.html || '',
                                scopedCss: parsedPayload.scoped_css || parsedPayload.css || '',
                                jsPayload: parsedPayload.javascript_payload || parsedPayload.js || '',
                            });
                        }
                    }
                }

                // Auto-trigger VIP alert when score crosses 70 threshold
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

            // Handle injection lifecycle events (Phase 5)
            if (eventType === 'injection_interaction') {
                if (data?.injection_id) {
                    await this.sessionManager.updateInjectionRecord(sessionId, data.injection_id, { interacted: true });
                    // Escalate engagement stage on positive interaction
                    const currentSession = await this.sessionManager.getSession(sessionId);
                    const currentStage = currentSession?.engagementStage || 0;
                    if (currentStage < 3) {
                        await this.sessionManager.updateEngagementStage(sessionId, currentStage + 1);
                    }
                }
            } else if (eventType === 'injection_dismissed') {
                if (data?.injection_id) {
                    await this.sessionManager.updateInjectionRecord(sessionId, data.injection_id, { dismissed: true });
                    // Remove from active injections so it won't be offered again on page load
                    await this.sessionManager.removeActiveInjection(sessionId, data.injection_id);
                }
            } else if (eventType === 'conversion') {
                if (data?.lastInjectionId) {
                    await this.sessionManager.updateInjectionRecord(sessionId, data.lastInjectionId, { converted: true });
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
     * Query: Get active injections currently rendering for a visitor session.
     * The tracker calls this on page load as a secondary restoration path
     * (e.g. when localStorage was cleared but Redis session is still alive).
     */
    @Query(() => String)
    async getActiveInjections(@Args('sessionId') sessionId: string): Promise<string> {
        const injections = await this.sessionManager.getActiveInjections(sessionId);
        return JSON.stringify(injections);
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

    /**
     * Check if event type is an injection lifecycle event
     */
    private isInjectionEvent(eventType: string): boolean {
        return ['injection_interaction', 'injection_dismissed', 'conversion'].includes(eventType);
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

        // Build engagement context for progressive engagement
        const injectionHistory = await this.sessionManager.getInjectionHistory(sessionId);
        const engagementContext = {
            stage: session.engagementStage || 0,
            injectionHistory,
        };

        // Calculate intent score using existing intent service (now with engagement context)
        const result = await this.intentService.analyzeAndGetUi(
            session.intentScore,
            signals,
            session.siteId,
            engagementContext,
        );

        // Update session with new score
        await this.sessionManager.updateIntentScore(sessionId, result.score);

        // Auto-escalate engagement stage based on score thresholds
        const currentStage = session.engagementStage || 0;
        let newStage = currentStage;
        if (result.score >= 70 && currentStage < 3) newStage = 3;
        else if (result.score >= 50 && currentStage < 2) newStage = 2;
        else if (result.score >= 30 && currentStage < 1) newStage = 1;
        if (newStage !== currentStage) {
            await this.sessionManager.updateEngagementStage(sessionId, newStage);
        }

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

    /**
     * Mutation: AI Concierge Chat Message
     * Receives visitor message, queries Qdrant for context, generates AI response
     */
    @Mutation(() => ChatResponse)
    async chatMessage(
        @Args('input') input: ChatMessageInput,
    ): Promise<ChatResponse> {
        const { sessionId, siteId, message } = input;
        this.logger.log(`[Chat] Message from ${sessionId}: ${message.substring(0, 50)}...`);

        try {
            // 1. Store the user's message
            await this.sessionManager.addChatMessage(sessionId, 'user', message);

            // 2. Get conversation history
            const chatHistory = await this.sessionManager.getChatHistory(sessionId);

            // 3. Get site info
            const site = await this.sitesService.getSiteBySiteId(siteId);
            const siteName = site?.domain || 'this website';

            // 4. Get visitor's interest profile
            const interestProfile = await this.sessionManager.getInterestProfile(sessionId);

            // 5. Get session for current page
            const session = await this.sessionManager.getSession(sessionId);
            const pageUrl = session?.currentPage || '';

            // 6. Query Qdrant for relevant site content using the visitor's message
            let siteContext = '';
            try {
                const embedding = await this.geminiService.generateEmbedding(message);
                const filters = { must: [{ key: 'siteId', match: { value: siteId } }] };
                const results = await this.qdrantService.search(embedding, filters, 3);
                if (results.length > 0) {
                    siteContext = results
                        .map(r => r.payload?.raw_html || r.payload?.description || '')
                        .filter(Boolean)
                        .join('\n\n---\n\n');
                }
            } catch (e) {
                this.logger.warn('[Chat] Qdrant search failed, proceeding without context', e.message);
            }

            // 7. Generate AI response
            const aiResponse = await this.geminiService.generateChatResponse(
                message,
                chatHistory,
                siteContext,
                interestProfile,
                siteName,
                pageUrl,
            );

            // 8. Store the AI's response
            await this.sessionManager.addChatMessage(sessionId, 'assistant', aiResponse.message);

            const response: ChatResponse = {
                sessionId,
                message: aiResponse.message,
                suggestedActions: JSON.stringify(aiResponse.suggestedActions),
                timestamp: Date.now(),
                shouldEscalate: aiResponse.shouldEscalate,
            };

            // 9. Publish chat response for subscription listeners
            await this.pubSub.publish(`chatResponse:${sessionId}`, { chatResponse: response });

            return response;
        } catch (error) {
            this.logger.error('[Chat] Error processing message', error);
            return {
                sessionId,
                message: "I apologize, I'm having trouble right now. Could you try again in a moment?",
                timestamp: Date.now(),
            };
        }
    }

    /**
     * Subscription: Real-time chat responses
     */
    @Subscription(() => ChatResponse, {
        filter: (payload, variables) =>
            payload.chatResponse.sessionId === variables.sessionId,
    })
    chatResponse(
        @Args('sessionId') sessionId: string,
    ) {
        return this.pubSub.asyncIterator(`chatResponse:${sessionId}`);
    }
}
