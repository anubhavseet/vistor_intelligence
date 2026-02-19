import { Injectable, Logger, Inject, forwardRef } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { SessionManagerService } from './session-manager.service';
import { RawTrackingLog, RawTrackingLogDocument } from '../common/schemas/raw-tracking-log.schema';
import { PageEvent, PageEventDocument } from '../common/schemas/page-event.schema';
import { VisitorSession, VisitorSessionDocument } from '../common/schemas/visitor-session.schema';
import { InjectQueue } from '@nestjs/bull';
import { Queue } from 'bull';
import { hashIP } from '../common/utils/crypto.util';
import { parseUserAgent } from '../common/utils/user-agent.util';
import { EnrichmentService } from '../enrichment/enrichment.service';
import * as geoip from 'geoip-lite';
import { PubSub } from 'graphql-subscriptions';
import { AdminAlertType } from '../analytics/dto/cohort.types';

export interface StreamEvent {
    sessionId: string;
    eventType: string;
    data: any;
    timestamp: number;
}

/**
 * Processes real-time event streams from WebSocket connections
 * Handles both real-time state updates and persistent storage
 */
@Injectable()
export class StreamProcessingService {
    private readonly logger = new Logger(StreamProcessingService.name);

    constructor(
        private sessionManager: SessionManagerService,
        @InjectModel(RawTrackingLog.name)
        private rawTrackingLogModel: Model<RawTrackingLogDocument>,
        @InjectModel(PageEvent.name)
        private pageEventModel: Model<PageEventDocument>,
        @InjectModel(VisitorSession.name)
        private visitorSessionModel: Model<VisitorSessionDocument>,
        @InjectQueue('enrichment') private enrichmentQueue: Queue,
        private enrichmentService: EnrichmentService,
        @Inject('PUB_SUB') private pubSub: PubSub,
    ) { }

    /**
     * Initialize persistent session in MongoDB (Parity with REST TrackingService)
     */
    async initPersistentSession(
        sessionId: string,
        siteId: string,
        ipAddress: string,
        userAgent: string,
        metadata?: any
    ): Promise<void> {
        let session = await this.visitorSessionModel.findOne({ sessionId, siteId });

        if (!session) {
            const ipHash = hashIP(ipAddress || '0.0.0.0');
            const uaInfo = parseUserAgent(userAgent || '');

            // Quick local GeoIP lookup for immediate geo data
            let initialGeo: any = undefined;
            if (ipAddress && ipAddress !== '0.0.0.0') {
                const geo = geoip.lookup(ipAddress);
                if (geo) {
                    initialGeo = {
                        country: geo.country,
                        region: geo.region,
                        city: geo.city,
                        lat: geo.ll ? geo.ll[0] : 0,
                        lng: geo.ll ? geo.ll[1] : 0,
                        timezone: geo.timezone,
                        source: 'ip',
                    };
                }
            }

            session = await this.visitorSessionModel.create({
                sessionId,
                siteId,
                ipHash,
                userAgent,
                deviceType: uaInfo.deviceType,
                browser: uaInfo.browser,
                os: uaInfo.os,
                geo: initialGeo,
                deviceFingerprint: metadata ? {
                    renderer: metadata.renderer,
                    hardwareConcurrency: metadata.hardwareConcurrency,
                    deviceMemory: metadata.deviceMemory
                } : undefined,
                startedAt: new Date(),
                isActive: true,
                lastActivityAt: new Date(),
                intentScore: 40, // Start as Researcher/Scanner baseline
                intentCategory: 'Bouncer',
                totalPageViews: 0,
                pagesVisited: []
            });

            // Queue enrichment job for enhanced data (organization, VPN flags, etc.)
            await this.enrichmentQueue.add({
                sessionId: session._id.toString(),
                ipAddress: ipAddress,
            }).catch(() => { });
        }
    }

    /**
     * Process incoming event from WebSocket stream
     */
    async processEvent(event: StreamEvent): Promise<void> {
        try {
            // 1. Update real-time state in Redis
            await this.updateRealTimeState(event);

            // 2. Persist to MongoDB (async, don't block)
            this.persistEvent(event).catch((err) => {
                this.logger.error(`Failed to persist event: ${err.message}`);
            });

            // 3. Run real-time analytics
            await this.runStreamAnalytics(event);

            // 4. Increment event counter
            await this.sessionManager.incrementEventCount(event.sessionId);

        } catch (error) {
            this.logger.error(`Error processing event: ${error.message}`, error.stack);
        }
    }

    /**
     * Update Redis with latest event data
     */
    private async updateRealTimeState(event: StreamEvent): Promise<void> {
        // Add to recent events list
        await this.sessionManager.addEvent(
            event.sessionId,
            event.eventType,
            event.data,
        );

        // Update session metadata based on event type
        if (event.eventType === 'pageview') {
            await this.sessionManager.updateSession(event.sessionId, {
                currentPage: event.data.url,
            });
        }
    }

    /**
     * Persist event to MongoDB for long-term storage
     */
    private async persistEvent(event: StreamEvent): Promise<void> {
        const session = await this.sessionManager.getSession(event.sessionId);
        if (!session) return;

        // Store in PageEvents collection
        if (['click', 'scroll', 'mousemove', 'form_focus', 'form_blur'].includes(event.eventType)) {
            await this.pageEventModel.create({
                sessionId: event.sessionId,
                siteId: session.siteId,
                pageUrl: session.currentPage || '',
                eventType: event.eventType,
                timestamp: new Date(event.timestamp),
                metadata: event.data,
            });
        }

        // For complex signal data, store in RawTrackingLog (Aggregated Session Document)
        // Note: VisitorSession update is handled by the resolver's call to updatePersistentSession
        if (event.eventType === 'signals_batch') {
            const batch = event.data;

            // Construct update operation
            const updateOps: any = {
                $set: {
                    timestamp: new Date(event.timestamp),
                    url: batch.url || session.currentPage,
                    "raw_signals.scroll_depth": batch.scroll_depth,
                    "raw_signals.scroll_velocity": batch.scroll_velocity,
                    "raw_signals.performance": batch.performance,
                    "raw_signals.geolocation": batch.geolocation,

                    // These fields are accumulated on the client-side, so we can overwrite them with the latest state
                    "raw_signals.dwell_time": batch.dwell_time,
                    "raw_signals.interactions": batch.interactions,
                    "raw_signals.forms": batch.forms,
                },
                $inc: {
                    "raw_signals.rage_clicks": batch.rage_clicks || 0,
                },
                $push: {
                    // Append stream data
                    events: { $each: batch.events || [] },
                    "raw_signals.copy_text": { $each: batch.copy_text || [] },
                    "raw_signals.text_selections": { $each: batch.text_selections || [] },
                    "raw_signals.dead_clicks": { $each: batch.dead_clicks || [] },
                    "raw_signals.errors": { $each: batch.errors || [] },
                    "raw_signals.mouse_trace": { $each: batch.mouse_trace || [] },
                },
                $setOnInsert: {
                    siteId: session.siteId,
                    sessionId: event.sessionId,
                    ipHash: session.ipAddress,
                    userAgent: session.userAgent,
                    createdAt: new Date(),
                }
            };

            // Persist hesitation flag if true (don't overwrite with false if previously true)
            if (batch.hesitation_event) {
                updateOps.$set["raw_signals.hesitation_event"] = true;
            }

            await this.rawTrackingLogModel.findOneAndUpdate(
                { sessionId: event.sessionId, siteId: session.siteId },
                updateOps,
                { upsert: true, new: true }
            );
        }
    }

    /**
     * Run real-time analytics on event stream
     */
    private async runStreamAnalytics(event: StreamEvent): Promise<void> {
        // Detect anomalies (e.g., bot behavior, rage clicks) and publish alerts
        const anomaly = await this.detectAnomalies(event);
        if (anomaly) {
            const session = await this.sessionManager.getSession(event.sessionId);
            if (session) {
                await this.pubSub.publish(`alerts:${session.siteId}`, {
                    adminAlerts: {
                        type: anomaly.type || 'anomaly',
                        sessionId: anomaly.sessionId,
                        score: anomaly.metric,
                        timestamp: Date.now(),
                        message: anomaly.type === 'rage_click'
                            ? `Rage click on ${anomaly.selector}`
                            : `Anomaly: ${anomaly.type} (${anomaly.severity})`,
                        severity: anomaly.severity || 'warning',
                    } satisfies Partial<AdminAlertType>,
                });
            }
        }

        // Update aggregated metrics
        await this.updateMetrics(event);
    }

    /**
     * Detect anomalous behavior patterns
     */
    private async detectAnomalies(event: StreamEvent): Promise<any> {
        const session = await this.sessionManager.getSession(event.sessionId);
        if (!session) return null;

        const eventsPerMinute = session.eventCount / ((Date.now() - session.connectedAt) / 60000);

        // Anomaly: Too many events (potential bot)
        if (eventsPerMinute > 100) {
            this.logger.warn(`⚠️ High event rate detected: ${event.sessionId} (${eventsPerMinute.toFixed(0)} events/min)`);
            return {
                type: 'high_event_rate',
                severity: 'warning',
                sessionId: event.sessionId,
                metric: eventsPerMinute,
            };
        }

        // Anomaly: Rage clicks
        if (event.eventType === 'click') {
            const recentClicks = await this.sessionManager.getRecentEvents(
                event.sessionId,
                'click',
                5,
            );

            if (this.isRageClick(recentClicks)) {
                this.logger.warn(`⚠️ Rage click detected: ${event.sessionId}`);
                return {
                    type: 'rage_click',
                    severity: 'warning',
                    sessionId: event.sessionId,
                    selector: event.data.selector,
                };
            }
        }

        return null;
    }

    /**
     * Update Persistent Session Document (Full Parity with REST TrackingService)
     * Called from resolver with intent result after score calculation
     */
    async updatePersistentSession(
        siteId: string,
        sessionId: string,
        batch: any,
        intentResult?: { score: number; category: string },
    ) {
        const session = await this.visitorSessionModel.findOne({ sessionId, siteId });
        if (!session) {
            this.logger.warn(`[updatePersistentSession] Session not found: ${sessionId}`);
            return;
        }

        session.lastActivityAt = new Date();

        // --- Intent Score & Category ---
        if (intentResult) {
            session.intentScore = intentResult.score;
            session.intentCategory = intentResult.category;
        }

        // --- Pages Visited & Page Views ---
        let isNewPage = false;
        if (batch.url && !session.pagesVisited.includes(batch.url)) {
            session.pagesVisited.push(batch.url);
            isNewPage = true;
        }

        // Check for explicit page_view events to increment count
        if (batch.events && batch.events.some((e: any) => e.type === 'page_view')) {
            session.totalPageViews = (session.totalPageViews || 0) + 1;
        } else if (isNewPage) {
            // Implicit increment for new unique page if explicit event missing
            session.totalPageViews = (session.totalPageViews || 0) + 1;
        } else if (session.totalPageViews === 0 && batch.url) {
            // Fallback for initial sessions
            session.totalPageViews = 1;
        }

        // Safety: totalPageViews should be at least the number of unique pages visited
        if (session.totalPageViews < session.pagesVisited.length) {
            session.totalPageViews = session.pagesVisited.length;
        }

        // --- Total Time Spent (use max dwell = actual wall-clock time) ---
        // dwell_time values from tracker are already in seconds (e.g., {heroSection: 5.2, pricingSection: 5.2})
        // Multiple elements can be visible simultaneously, so summing them inflates the time.
        // Use Math.max to get the actual wall-clock time the user was active during this batch.
        const validDwellTimes = Object.values(batch.dwell_time || {}) as number[];
        const batchWallClockSeconds = validDwellTimes.length > 0 ? Math.max(...validDwellTimes) : 0;
        session.totalTimeSpent = (session.totalTimeSpent || 0) + batchWallClockSeconds;

        // --- Max Scroll Depth ---
        if (batch.scroll_depth) {
            session.maxScrollDepth = Math.max(session.maxScrollDepth || 0, batch.scroll_depth);
        }

        // --- Referrer ---
        if (batch.referrer && !session.referrer) {
            session.referrer = batch.referrer;
        }

        // --- Geolocation GPS Overwrite ---
        if (batch.geolocation && batch.geolocation.lat) {
            if (!session.geo) session.geo = {};
            session.geo.lat = batch.geolocation.lat;
            session.geo.lng = batch.geolocation.lng;
            session.geo.accuracy = batch.geolocation.accuracy;
            session.geo.source = 'gps';
        } else if (!session.geo || !session.geo.lat) {
            if (session.geo) session.geo.source = 'ip';
        }

        // --- UTM Parsing ---
        if (batch.url && (!session.utmParams || session.utmParams.length === 0)) {
            try {
                const urlObj = new URL(batch.url.startsWith('http') ? batch.url : `http://${batch.url}`);
                const params: string[] = [];
                urlObj.searchParams.forEach((value, key) => {
                    if (key.startsWith('utm_')) params.push(`${key}=${value}`);
                });
                if (params.length > 0) session.utmParams = params;
            } catch (e) { }
        }

        await session.save();

        // --- Create PageEvents from batch (parity with REST) ---
        const eventsToSave: any[] = [];

        // Custom events (exit_intent, etc.)
        if (batch.events && Array.isArray(batch.events)) {
            for (const evt of batch.events) {
                eventsToSave.push({
                    sessionId,
                    siteId,
                    pageUrl: batch.url || '',
                    eventType: evt.type,
                    timestamp: new Date(evt.timestamp || Date.now()),
                    metadata: evt.payload || {},
                });
            }
        }

        // Top interactions (clicks, hovers, inputs)
        if (batch.interactions) {
            for (const [selector, interaction] of Object.entries(batch.interactions) as any[]) {
                if (interaction.clicks > 0) {
                    eventsToSave.push({
                        sessionId,
                        siteId,
                        pageUrl: batch.url || '',
                        eventType: 'click',
                        timestamp: new Date(interaction.last_timestamp || Date.now()),
                        metadata: { selector, count: interaction.clicks },
                    });
                }
            }
        }

        if (eventsToSave.length > 0) {
            try {
                await this.pageEventModel.insertMany(eventsToSave);
            } catch (e) {
                this.logger.error(`Failed to save page events for session ${sessionId}`, e);
            }
        }
    }

    /**
     * Check if recent clicks constitute a rage click pattern
     */
    private isRageClick(clicks: any[]): boolean {
        if (clicks.length < 4) return false;

        const timeWindow = 2000; // 2 seconds
        const firstClick = clicks[clicks.length - 1].timestamp;
        const lastClick = clicks[0].timestamp;

        return (lastClick - firstClick) < timeWindow;
    }

    /**
     * Update aggregated metrics
     */
    private async updateMetrics(event: StreamEvent): Promise<void> {
        // This would update time-windowed aggregations
        // For example: events per second, clicks per minute, etc.
        // Implementation depends on specific metrics needed
    }

    /**
     * Calculate scroll velocity from consecutive scroll events
     */
    async calculateScrollVelocity(sessionId: string): Promise<number> {
        const recentScrolls = await this.sessionManager.getRecentEvents(
            sessionId,
            'scroll',
            2,
        );

        if (recentScrolls.length < 2) return 0;

        const [scroll1, scroll2] = recentScrolls;
        const depthDelta = Math.abs(scroll1.data.depth - scroll2.data.depth);
        const timeDelta = (scroll1.timestamp - scroll2.timestamp) / 1000; // seconds

        return timeDelta > 0 ? depthDelta / timeDelta : 0;
    }
}
