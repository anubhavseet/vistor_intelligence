import { Injectable, Logger } from '@nestjs/common';
import { Redis } from 'ioredis';

export interface SessionState {
    sessionId: string;
    siteId: string;
    socketId?: string; // Optional - can be http-fallback for non-WebSocket connections
    connectedAt: number;
    lastActivityAt: number;
    ipAddress: string;
    userAgent: string;
    currentPage?: string;
    intentScore: number;
    eventCount: number;
    isActive: boolean;
    vipAlertSent?: boolean;
    injectionHistory?: string; // JSON: Array<{ id, type, intent, dismissed, interacted, converted, timestamp }>
    engagementStage?: number;  // 0-3 for progressive engagement
    chatHistory?: string;      // JSON: Array<{ role, text, timestamp }>
    interestProfile?: string;  // JSON: { topics, pagesVisited, textCopied, timeOnPricing, objections }
}

/**
 * Manages real-time session state using Redis
 * Provides fast access to active visitor data for WebSocket operations
 */
@Injectable()
export class SessionManagerService {
    private readonly logger = new Logger(SessionManagerService.name);
    private redis: Redis;

    constructor() {
        // Initialize Redis connection
        this.redis = new Redis({
            host: process.env.REDIS_HOST || 'localhost',
            port: parseInt(process.env.REDIS_PORT || '6379'),
            password: process.env.REDIS_PASSWORD,
            retryStrategy: (times) => {
                const delay = Math.min(times * 50, 2000);
                return delay;
            },
        });

        this.redis.on('connect', () => {
            this.logger.log('✅ Connected to Redis');
        });

        this.redis.on('error', (err) => {
            this.logger.error('❌ Redis connection error:', err);
        });
    }

    /**
     * Initialize a new session
     */
    async initSession(
        sessionId: string,
        siteId: string,
        data: Partial<SessionState>,
    ): Promise<void> {
        const sessionKey = this.getSessionKey(sessionId);

        const sessionData: SessionState = {
            sessionId,
            siteId,
            socketId: data.socketId || 'http-fallback',
            connectedAt: Date.now(),
            lastActivityAt: Date.now(),
            ipAddress: data.ipAddress || '0.0.0.0',
            userAgent: data.userAgent || '',
            intentScore: 0,
            eventCount: 0,
            isActive: true,
            ...data,
        };

        // Store session data
        await this.redis.hmset(sessionKey, this.serializeSession(sessionData));

        // Set expiration (1 hour)
        await this.redis.expire(sessionKey, 3600);

        // Add to active sessions set for this site
        await this.redis.sadd(`site:${siteId}:sessions`, sessionId);

        this.logger.debug(`Session initialized: ${sessionId}`);
    }

    /**
     * Get session data
     */
    async getSession(sessionId: string): Promise<SessionState | null> {
        const sessionKey = this.getSessionKey(sessionId);
        const data = await this.redis.hgetall(sessionKey);

        if (!data || Object.keys(data).length === 0) {
            return null;
        }

        return this.deserializeSession(data);
    }

    /**
     * Update session data
     */
    async updateSession(
        sessionId: string,
        updates: Partial<SessionState>,
    ): Promise<void> {
        const sessionKey = this.getSessionKey(sessionId);

        // Update last activity
        updates.lastActivityAt = Date.now();

        await this.redis.hmset(sessionKey, this.serializeSession(updates));

        // Refresh expiration
        await this.redis.expire(sessionKey, 3600);
    }

    /**
     * Increment event counter
     */
    async incrementEventCount(sessionId: string): Promise<number> {
        const sessionKey = this.getSessionKey(sessionId);
        const count = await this.redis.hincrby(sessionKey, 'eventCount', 1);

        // Update last activity
        await this.redis.hset(sessionKey, 'lastActivityAt', Date.now().toString());

        return count;
    }

    /**
     * Update intent score
     */
    async updateIntentScore(sessionId: string, score: number): Promise<void> {
        const sessionKey = this.getSessionKey(sessionId);
        await this.redis.hset(sessionKey, 'intentScore', score.toString());
        await this.redis.hset(sessionKey, 'lastActivityAt', Date.now().toString());
    }

    /**
     * Get recent events for a session
     */
    async getRecentEvents(
        sessionId: string,
        eventType: string,
        limit: number = 10,
    ): Promise<any[]> {
        const eventsKey = `session:${sessionId}:events:${eventType}`;
        const events = await this.redis.lrange(eventsKey, 0, limit - 1);
        return events.map((e) => JSON.parse(e));
    }

    /**
     * Add event to recent events list
     */
    async addEvent(sessionId: string, eventType: string, data: any): Promise<void> {
        const eventsKey = `session:${sessionId}:events:${eventType}`;

        await this.redis.lpush(
            eventsKey,
            JSON.stringify({
                type: eventType,
                data,
                timestamp: Date.now(),
            }),
        );

        // Keep only last 100 events
        await this.redis.ltrim(eventsKey, 0, 99);

        // Set expiration
        await this.redis.expire(eventsKey, 3600);
    }

    /**
     * Get all active sessions for a site
     */
    async getActiveSessions(siteId: string): Promise<SessionState[]> {
        const sessionIds = await this.redis.smembers(`site:${siteId}:sessions`);

        const sessions: SessionState[] = [];
        for (const sessionId of sessionIds) {
            const session = await this.getSession(sessionId);
            if (session && session.isActive) {
                sessions.push(session);
            }
        }

        return sessions;
    }

    /**
     * Mark session as ended
     */
    async endSession(sessionId: string): Promise<void> {
        const session = await this.getSession(sessionId);
        if (!session) return;

        await this.updateSession(sessionId, { isActive: false });

        // Remove from active sessions set
        await this.redis.srem(`site:${session.siteId}:sessions`, sessionId);

        this.logger.debug(`Session ended: ${sessionId}`);
    }

    /**
     * Get live visitor count for a site
     */
    async getLiveVisitorCount(siteId: string): Promise<number> {
        return await this.redis.scard(`site:${siteId}:sessions`);
    }

    /**
     * Add an injection record to the session's history
     */
    async addInjectionRecord(
        sessionId: string,
        record: { id: string; type: string; intent: string; timestamp: number },
    ): Promise<void> {
        const session = await this.getSession(sessionId);
        if (!session) return;

        let history: any[] = [];
        try {
            history = session.injectionHistory ? JSON.parse(session.injectionHistory) : [];
        } catch (e) {
            history = [];
        }

        history.push({
            ...record,
            dismissed: false,
            interacted: false,
            converted: false,
        });

        // Keep last 20 injection records
        if (history.length > 20) history = history.slice(-20);

        await this.updateSession(sessionId, {
            injectionHistory: JSON.stringify(history),
        });
    }

    /**
     * Get injection history for a session
     */
    async getInjectionHistory(sessionId: string): Promise<any[]> {
        const session = await this.getSession(sessionId);
        if (!session || !session.injectionHistory) return [];
        try {
            return JSON.parse(session.injectionHistory);
        } catch (e) {
            return [];
        }
    }

    /**
     * Update a specific injection record (e.g., mark as dismissed/interacted/converted)
     */
    async updateInjectionRecord(
        sessionId: string,
        injectionId: string,
        updates: { dismissed?: boolean; interacted?: boolean; converted?: boolean },
    ): Promise<void> {
        const history = await this.getInjectionHistory(sessionId);
        const record = history.find((r) => r.id === injectionId);
        if (record) {
            Object.assign(record, updates);
            await this.updateSession(sessionId, {
                injectionHistory: JSON.stringify(history),
            });
        }
    }

    /**
     * Update engagement stage for progressive engagement
     */
    async updateEngagementStage(sessionId: string, stage: number): Promise<void> {
        await this.updateSession(sessionId, { engagementStage: stage });
    }

    /**
     * Add a chat message to the session's conversation history
     */
    async addChatMessage(
        sessionId: string,
        role: 'user' | 'assistant',
        text: string,
    ): Promise<void> {
        const session = await this.getSession(sessionId);
        if (!session) return;

        let history: any[] = [];
        try {
            history = session.chatHistory ? JSON.parse(session.chatHistory) : [];
        } catch (e) {
            history = [];
        }

        history.push({ role, text, timestamp: Date.now() });

        // Keep last 30 messages
        if (history.length > 30) history = history.slice(-30);

        await this.updateSession(sessionId, {
            chatHistory: JSON.stringify(history),
        });
    }

    /**
     * Get chat history for a session
     */
    async getChatHistory(sessionId: string): Promise<Array<{ role: string; text: string; timestamp: number }>> {
        const session = await this.getSession(sessionId);
        if (!session || !session.chatHistory) return [];
        try {
            return JSON.parse(session.chatHistory);
        } catch (e) {
            return [];
        }
    }

    /**
     * Update the accumulated interest profile for a session
     * Called after each signal batch to build a rich visitor profile
     */
    async updateInterestProfile(
        sessionId: string,
        signals: {
            url?: string;
            text_selections?: string[];
            copy_text?: string[];
            dwell_time?: Record<string, number>;
        },
    ): Promise<void> {
        const session = await this.getSession(sessionId);
        if (!session) return;

        let profile: any = { topics: [], pagesVisited: [], textCopied: [], timeOnPricing: 0, objections: [] };
        try {
            profile = session.interestProfile ? JSON.parse(session.interestProfile) : profile;
        } catch (e) { }

        // Accumulate pages
        if (signals.url && !profile.pagesVisited.includes(signals.url)) {
            profile.pagesVisited.push(signals.url);
            if (profile.pagesVisited.length > 20) profile.pagesVisited = profile.pagesVisited.slice(-20);
        }

        // Accumulate text selections as topics
        if (signals.text_selections) {
            for (const sel of signals.text_selections) {
                if (sel.length > 3 && sel.length < 100 && !profile.topics.includes(sel)) {
                    profile.topics.push(sel);
                }
            }
            if (profile.topics.length > 15) profile.topics = profile.topics.slice(-15);
        }

        // Accumulate copied text
        if (signals.copy_text) {
            for (const txt of signals.copy_text) {
                if (!profile.textCopied.includes(txt)) {
                    profile.textCopied.push(txt);
                }
            }
            if (profile.textCopied.length > 10) profile.textCopied = profile.textCopied.slice(-10);
        }

        // Accumulate pricing dwell
        if (signals.dwell_time) {
            for (const [id, duration] of Object.entries(signals.dwell_time)) {
                if (id.toLowerCase().includes('pricing') || id.toLowerCase().includes('price')) {
                    profile.timeOnPricing += duration;
                }
            }
        }

        // Detect objections from behavioral patterns
        if (signals.url) {
            const urlLower = signals.url.toLowerCase();
            if (urlLower.includes('competitor') || urlLower.includes('alternative') || urlLower.includes('vs')) {
                if (!profile.objections.includes('comparing_alternatives')) {
                    profile.objections.push('comparing_alternatives');
                }
            }
            if (urlLower.includes('refund') || urlLower.includes('cancel')) {
                if (!profile.objections.includes('risk_concerned')) {
                    profile.objections.push('risk_concerned');
                }
            }
        }

        await this.updateSession(sessionId, {
            interestProfile: JSON.stringify(profile),
        });
    }

    /**
     * Get interest profile for a session
     */
    async getInterestProfile(sessionId: string): Promise<any> {
        const session = await this.getSession(sessionId);
        if (!session || !session.interestProfile) return null;
        try {
            return JSON.parse(session.interestProfile);
        } catch (e) {
            return null;
        }
    }

    // Helper methods
    private getSessionKey(sessionId: string): string {
        return `session:${sessionId}:state`;
    }

    private serializeSession(data: Partial<SessionState>): Record<string, string> {
        const serialized: Record<string, string> = {};
        for (const [key, value] of Object.entries(data)) {
            if (value !== undefined && value !== null) {
                serialized[key] = typeof value === 'object' ? JSON.stringify(value) : value.toString();
            }
        }
        return serialized;
    }

    private deserializeSession(data: Record<string, string>): SessionState {
        return {
            sessionId: data.sessionId,
            siteId: data.siteId,
            socketId: data.socketId,
            connectedAt: parseInt(data.connectedAt),
            lastActivityAt: parseInt(data.lastActivityAt),
            ipAddress: data.ipAddress,
            userAgent: data.userAgent,
            currentPage: data.currentPage,
            intentScore: parseFloat(data.intentScore || '0'),
            eventCount: parseInt(data.eventCount || '0'),
            isActive: data.isActive === 'true',
            vipAlertSent: data.vipAlertSent === 'true',
            injectionHistory: data.injectionHistory || null,
            engagementStage: parseInt(data.engagementStage || '0'),
            chatHistory: data.chatHistory || null,
            interestProfile: data.interestProfile || null,
        };
    }

    /**
     * Cleanup - close Redis connection
     */
    async onModuleDestroy() {
        await this.redis.quit();
    }
}
