import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { InjectQueue } from '@nestjs/bull';
import { Queue } from 'bull';
import { VisitorSession, VisitorSessionDocument } from '../common/schemas/visitor-session.schema';
import { PageEvent, PageEventDocument } from '../common/schemas/page-event.schema';
import { hashIP, generateSessionId } from '../common/utils/crypto.util';
import { SitesService } from '../sites/sites.service';
import { IntentService, SignalBatch } from '../intent/intent.service';
import { SubscriptionService } from '../subscription/subscription.service';

import { RawTrackingLog, RawTrackingLogDocument } from '../common/schemas/raw-tracking-log.schema';
import { parseUserAgent } from '../common/utils/user-agent.util';

/**
 * Tracking Service
 * 
 * Handles ingestion of tracking events from client websites.
 * Privacy-compliant: IPs are hashed immediately.
 */
@Injectable()
export class TrackingService {
  private readonly logger = new Logger(TrackingService.name);

  constructor(
    @InjectModel(VisitorSession.name)
    private visitorSessionModel: Model<VisitorSessionDocument>,
    @InjectModel(PageEvent.name)
    private pageEventModel: Model<PageEventDocument>,
    @InjectQueue('enrichment') private enrichmentQueue: Queue,
    @InjectModel(RawTrackingLog.name)
    private rawTrackingLogModel: Model<RawTrackingLogDocument>,
    private sitesService: SitesService,
    private intentService: IntentService,
    private subscriptionService: SubscriptionService,
  ) { }

  /**
   * Process a batch of signals from the tracker
   */
  async processSignalBatch(
    siteId: string,
    apiKey: string,
    data: {
      userId?: string;
      sessionId: string;

      signals: SignalBatch;
      timestamp: number;
      ipAddress?: string;
      userAgent?: string;
      metadata?: any;
    },
  ) {
    // 1. Validate API key
    // const isValid = await this.sitesService.validateApiKey(siteId, apiKey);
    // if (!isValid) {
    //   throw new BadRequestException('Invalid API key');
    // }

    // 2. Get or Create Session
    let session = await this.visitorSessionModel.findOne({ sessionId: data.sessionId, siteId });

    // Validate Timezone (Proxy Detection)
    // If browser timezone (metadata) differs from IP timezone (geo), it's likely a VPN/Proxy.
    let isLikelyVPN = false;
    if (data.metadata && data.metadata.timezone && session && session.geo && session.geo.timezone) {
      // Simple string check (e.g., 'America/New_York' vs 'Asia/Kolkata')
      // Ideally we check offsets, but string mismatch is a strong indicator of travel or VPN
      if (data.metadata.timezone !== session.geo.timezone) {
        isLikelyVPN = true;
      }
    }

    if (!session) {
      // Feature Limit Check
      // We must check if the site owner has exceeded their sessions bandwidth
      const site = await this.sitesService.getSiteBySiteId(siteId);
      const limitCheck = await this.subscriptionService.checkFeatureLimit(site.userId.toString(), 'maxSessionsPerMonth');

      if (!limitCheck.allowed) {
        // Limit reached: Still log raw data for compliance, but discard actionable session data
        try {
          await this.rawTrackingLogModel.create({
            siteId,
            sessionId: data.sessionId,
            url: data.signals.url || '',
            timestamp: new Date(),
            raw_signals: data.signals,
            ipHash: hashIP(data.ipAddress || '0.0.0.0'),
            userAgent: data.userAgent
          });
        } catch (e) {
          this.logger.error(`Failed to log raw signals for session ${data.sessionId}`, e);
        }

        // Return a dummy intent score so the tracker payload doesn't crash on the frontend
        return {
          intent_category: 'Bouncer',
          current_score: 0,
          suggested_action: null,
          ui_payload: null
        };
      }

      await this.subscriptionService.incrementUsage(site.userId.toString(), 'sessionsTracked');

      const ipHash = hashIP(data.ipAddress || '0.0.0.0');
      const uaInfo = parseUserAgent(data.userAgent || '');

      session = await this.visitorSessionModel.create({
        sessionId: data.sessionId,
        siteId,
        ipHash,
        userAgent: data.userAgent,
        deviceType: uaInfo.deviceType,
        browser: uaInfo.browser,
        os: uaInfo.os,
        deviceFingerprint: data.metadata ? {
          renderer: data.metadata.renderer,
          hardwareConcurrency: data.metadata.hardwareConcurrency,
          deviceMemory: data.metadata.deviceMemory
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
      // If we have high-accuracy geolocation, we can pass it or update it directly.
      // However, enrichment also provides Org data. So we still queue it.
      await this.enrichmentQueue.add({
        sessionId: session._id.toString(),
        ipAddress: data.ipAddress,
      });
    }

    // High-Accuracy Geolocation Overwrite
    if (data.signals.geolocation && data.signals.geolocation.lat) {
      if (!session.geo) session.geo = {};
      session.geo.lat = data.signals.geolocation.lat;
      session.geo.lng = data.signals.geolocation.lng;
      session.geo.accuracy = data.signals.geolocation.accuracy;
      session.geo.source = 'gps';
    } else if (!session.geo || !session.geo.lat) {
      // Ensure source is IP if not overwritten
      if (session.geo) session.geo.source = 'ip';
    }

    // Raw Data Retention (Data Lake)
    try {
      await this.rawTrackingLogModel.create({
        siteId,
        sessionId: data.sessionId,
        url: data.signals.url || '',
        timestamp: new Date(),
        raw_signals: data.signals,
        ipHash: hashIP(data.ipAddress || '0.0.0.0'),
        userAgent: data.userAgent
      });
    } catch (e) {
      this.logger.error(`Failed to log raw signals for session ${data.sessionId}`, e);
    }

    // 3. Calculate Score & AI Analysis
    const currentScore = session.intentScore;
    const intentResult = await this.intentService.analyzeAndGetUi(currentScore, data.signals, siteId);

    // 4. Update Session
    session.intentScore = intentResult.score;
    session.intentCategory = intentResult.category;
    session.lastActivityAt = new Date();

    // Update Pages Visited & Page Views
    if (data.signals.url) {
      if (!session.pagesVisited.includes(data.signals.url)) {
        session.pagesVisited.push(data.signals.url);
        // Only increment if it's a new page in this session
        // (If strictly tracking views, check for page_view event below)
      }
    }

    // Check for explicit page_view events to increment count
    if (data.signals.events && data.signals.events.some(e => e.type === 'page_view')) {
      session.totalPageViews = (session.totalPageViews || 0) + 1;
    } else if (session.totalPageViews === 0 && data.signals.url) {
      // Fallback for initial/legacy sessions
      session.totalPageViews = 1;
    }

    // Update Session Metrics (Time & Scroll)
    // dwell_time values are already in seconds. Multiple elements can be visible simultaneously,
    // so use Math.max to get wall-clock time, not the sum of all element dwell times.
    const dwellValues = Object.values(data.signals.dwell_time || {}) as number[];
    const batchWallClockSeconds = dwellValues.length > 0 ? Math.max(...dwellValues) : 0;
    session.totalTimeSpent = (session.totalTimeSpent || 0) + batchWallClockSeconds;

    if (data.signals.scroll_depth) {
      session.maxScrollDepth = Math.max(session.maxScrollDepth || 0, data.signals.scroll_depth);
    }

    // Update referrer if not set
    if (!session.referrer && data.signals.referrer) {
      session.referrer = data.signals.referrer;
    }

    // Update VPN Flag based on Timezone Mismatch
    if (isLikelyVPN) {
      if (!session.flags) session.flags = {};
      session.flags.isVPN = true; // Flag as suspicious/VPN
    }

    // Parse UTM Parameters if not set
    if (data.signals.url && (!session.utmParams || session.utmParams.length === 0)) {
      try {
        const urlObj = new URL(data.signals.url.startsWith('http') ? data.signals.url : `http://${data.signals.url}`);
        const params: string[] = [];
        urlObj.searchParams.forEach((value, key) => {
          if (key.startsWith('utm_')) {
            params.push(`${key}=${value}`);
          }
        });
        if (params.length > 0) {
          session.utmParams = params;
        }
      } catch (e) {
        // ignore invalid URL
      }
    }

    await session.save();

    // 5. Populate PageEvents
    const eventsToSave = [];

    // Custom Events
    if (data.signals.events) {
      for (const evt of data.signals.events) {
        eventsToSave.push({
          sessionId: data.sessionId,
          siteId,
          pageUrl: data.signals.url || '',
          eventType: evt.type,
          timestamp: new Date(evt.timestamp || Date.now()),
          metadata: (evt as any).payload || {}
        });
      }
    }

    // Top Interactions (Clicks)
    if (data.signals.interactions) {
      for (const [selector, interaction] of Object.entries(data.signals.interactions)) {
        if (interaction.clicks > 0) {
          eventsToSave.push({
            sessionId: data.sessionId,
            siteId,
            pageUrl: data.signals.url || '',
            eventType: 'click', // Standardized click event
            timestamp: new Date(interaction.last_timestamp || Date.now()),
            metadata: {
              selector,
              count: interaction.clicks
            }
          });
        }
      }
    }

    if (eventsToSave.length > 0) {
      try {
        await this.pageEventModel.insertMany(eventsToSave);
      } catch (e) {
        this.logger.error(`Failed to save page events for session ${data.sessionId}`, e);
      }
    }

    // 5. Return Action & AI Payload
    return {
      intent_category: intentResult.category,
      current_score: intentResult.score,
      suggested_action: intentResult.suggestedAction,
      ui_payload: intentResult.uiPayload || null
    };
  }


  /**
   * Ingest a tracking event (Legacy / Single Event Support)
   */
  async ingestEvent(
    siteId: string,
    apiKey: string,
    event: {
      sessionId?: string;
      eventType: 'session_start' | 'page_view' | 'scroll' | 'click' | 'session_end';
      pageUrl?: string;
      referrer?: string;
      utmParams?: Record<string, string>;
      userAgent?: string;
      ipAddress: string;
      metadata?: any;
    },
  ): Promise<{ sessionId: string }> {
    // Validate API key
    // const isValid = await this.sitesService.validateApiKey(siteId, apiKey);
    // if (!isValid) {
    //   throw new BadRequestException('Invalid API key');
    // }

    const ipHash = hashIP(event.ipAddress);
    const uaInfo = parseUserAgent(event.userAgent || '');
    let sessionId = event.sessionId;
    if (!sessionId || event.eventType === 'session_start') {
      sessionId = generateSessionId();
    }

    let session = await this.visitorSessionModel.findOne({ sessionId, siteId });

    if (!session) {
      // Feature Limit Check
      const site = await this.sitesService.getSiteBySiteId(siteId);
      const limitCheck = await this.subscriptionService.checkFeatureLimit(site.userId.toString(), 'maxSessionsPerMonth');

      if (!limitCheck.allowed) {
        // Limit reached: refuse to create session silently
        return { sessionId };
      }

      await this.subscriptionService.incrementUsage(site.userId.toString(), 'sessionsTracked');

      session = await this.visitorSessionModel.create({
        sessionId,
        siteId,
        ipHash,
        userAgent: event.userAgent,
        deviceType: uaInfo.deviceType,
        browser: uaInfo.browser,
        os: uaInfo.os,
        deviceFingerprint: event.metadata ? {
          renderer: event.metadata.renderer,
          hardwareConcurrency: event.metadata.hardwareConcurrency,
          deviceMemory: event.metadata.deviceMemory
        } : undefined,
        referrer: event.referrer,
        utmParams: event.utmParams ? Object.entries(event.utmParams).map(([k, v]) => `${k}=${v}`) : [],
        startedAt: new Date(),
        isActive: true,
        lastActivityAt: new Date(),
      });
      await this.enrichmentQueue.add({
        sessionId: session._id.toString(),
        ipAddress: event.ipAddress,
      });
    } else {
      session.lastActivityAt = new Date();
      if (event.eventType === 'session_end') {
        session.endedAt = new Date();
        session.isActive = false;
      }
      await session.save();
    }

    if (event.pageUrl && ['page_view', 'scroll', 'click'].includes(event.eventType)) {
      await this.pageEventModel.create({
        sessionId,
        siteId,
        pageUrl: event.pageUrl,
        eventType: event.eventType,
        timestamp: new Date(),
        metadata: event.metadata || {},
      });
      if (event.eventType === 'page_view') {
        session.totalPageViews += 1;
        if (!session.pagesVisited.includes(event.pageUrl)) {
          session.pagesVisited.push(event.pageUrl);
        }
      }
      await session.save();
    }

    return { sessionId };
  }

  async getLiveSessions(siteId: string, limit: number = 100): Promise<VisitorSession[]> {
    return this.visitorSessionModel
      .find({ siteId, isActive: true })
      .sort({ lastActivityAt: -1 })
      .limit(limit)
      .exec();
  }

  async getSessionsInRange(
    siteId: string,
    startDate: Date,
    endDate: Date,
  ): Promise<VisitorSession[]> {
    return this.visitorSessionModel
      .find({
        siteId,
        startedAt: { $gte: startDate, $lte: endDate },
      })
      .sort({ startedAt: -1 })
      .exec();
  }

  async getSiteConfig(siteId: string) {
    const site = await this.sitesService.getSiteBySiteId(siteId);
    return {
      settings: site.settings,
      allowedDomains: site.allowedDomains,
      isActive: site.isActive
    };
  }
}
