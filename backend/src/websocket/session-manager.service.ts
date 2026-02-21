import { Injectable, Logger } from '@nestjs/common';
import { Redis } from 'ioredis';

export interface SessionState {
    sessionId: string;
    siteId: string;
    visitorId?: string; // Persistent visitor identity — stored in Redis like sessionId
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
            visitorId: data.visitorId || undefined,
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
        };
    }

    /**
     * Cleanup - close Redis connection
     */
    async onModuleDestroy() {
        await this.redis.quit();
    }
}
