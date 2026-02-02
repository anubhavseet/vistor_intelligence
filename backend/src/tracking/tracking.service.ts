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
    private sitesService: SitesService,
    private intentService: IntentService,
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
    },
  ) {
    // 1. Validate API key
    // const isValid = await this.sitesService.validateApiKey(siteId, apiKey);
    // if (!isValid) {
    //   throw new BadRequestException('Invalid API key');
    // }

    // 2. Get or Create Session
    let session = await this.visitorSessionModel.findOne({ sessionId: data.sessionId, siteId });

    if (!session) {
      const ipHash = hashIP(data.ipAddress || '0.0.0.0');
      session = await this.visitorSessionModel.create({
        sessionId: data.sessionId,
        siteId,
        ipHash,
        userAgent: data.userAgent,
        startedAt: new Date(),
        isActive: true,
        lastActivityAt: new Date(),
        intentScore: 40, // Start as Researcher/Scanner baseline
        intentCategory: 'Bouncer'
      });

      // Queue enrichment job
      await this.enrichmentQueue.add({
        sessionId: session._id.toString(),
        ipAddress: data.ipAddress,
      });
    }

    // 3. Calculate Score & AI Analysis
    const currentScore = session.intentScore;
    const intentResult = await this.intentService.analyzeAndGetUi(currentScore, data.signals, siteId);

    // 4. Update Session
    session.intentScore = intentResult.score;
    session.intentCategory = intentResult.category;
    session.lastActivityAt = new Date();

    await session.save();

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
    let sessionId = event.sessionId;
    if (!sessionId || event.eventType === 'session_start') {
      sessionId = generateSessionId();
    }

    let session = await this.visitorSessionModel.findOne({ sessionId, siteId });

    if (!session) {
      session = await this.visitorSessionModel.create({
        sessionId,
        siteId,
        ipHash,
        userAgent: event.userAgent,
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
}
