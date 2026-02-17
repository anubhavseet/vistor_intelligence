import { Injectable, Logger } from '@nestjs/common';
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

            session = await this.visitorSessionModel.create({
                sessionId,
                siteId,
                ipHash,
                userAgent,
                deviceType: uaInfo.deviceType,
                browser: uaInfo.browser,
                os: uaInfo.os,
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

            // Queue enrichment job
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
        if (event.eventType === 'signals_batch') {
            await this.updatePersistentSession(session.siteId, event.sessionId, event.data);
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
        // Detect anomalies (e.g., bot behavior)
        await this.detectAnomalies(event);

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
     * Update Persistent Session Document (Parity with REST)
     */
    private async updatePersistentSession(siteId: string, sessionId: string, batch: any) {
        const session = await this.visitorSessionModel.findOne({ sessionId, siteId });
        if (!session) return;

        session.lastActivityAt = new Date();

        // Update Metrics
        if (batch.url && !session.pagesVisited.includes(batch.url)) {
            session.pagesVisited.push(batch.url);
        }

        const validDwellTimes = Object.values(batch.dwell_time || {}) as number[];
        const totalDwellSeconds = validDwellTimes.reduce((a, b) => a + b, 0);

        if (totalDwellSeconds > (session.totalTimeSpent || 0)) {
            session.totalTimeSpent = totalDwellSeconds;
        }

        if (batch.scroll_depth) {
            session.maxScrollDepth = Math.max(session.maxScrollDepth || 0, batch.scroll_depth);
        }

        if (batch.referrer && !session.referrer) {
            session.referrer = batch.referrer;
        }

        // UTM Parsing
        if (batch.url && (!session.utmParams || session.utmParams.length === 0)) {
            try {
                const urlObj = new URL(batch.url.startsWith('http') ? batch.url : `http://${batch.url}`);
                const params: string[] = [];
                urlObj.searchParams.forEach((value, keys) => {
                    if (keys.startsWith('utm_')) params.push(`${keys}=${value}`);
                });
                if (params.length > 0) session.utmParams = params;
            } catch (e) { }
        }

        session.lastActivityAt = new Date();
        await session.save();
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
