import { Resolver, Mutation, Args, Query } from '@nestjs/graphql';
import { TrackingService } from './tracking.service';
import { TrackInput, TrackResponse, VisitorSessionType, SiteConfigType } from './dto/tracking.types';
import { SignalBatch } from '../intent/intent.service';

@Resolver()
export class TrackingResolver {
  constructor(private trackingService: TrackingService) { }

  @Mutation(() => TrackResponse)
  async track(
    @Args('siteId') siteId: string,
    @Args('apiKey') apiKey: string,
    @Args('input') input: TrackInput,
  ): Promise<TrackResponse> {
    // Parse metadata if it's a JSON string
    let metadata: any = undefined;
    if (input.metadata) {
      try {
        metadata = JSON.parse(input.metadata);
      } catch (e) {
        // If parsing fails, ignore metadata
      }
    }

    if (input.signals) {
      // Map SignalBatchInput to SignalBatch
      const signals: SignalBatch = {
        dwell_time: input.signals.dwell_time ? JSON.parse(input.signals.dwell_time) : {},
        scroll_velocity: input.signals.scroll_velocity || 0,
        scroll_depth: input.signals.scroll_depth,
        hesitation_event: input.signals.hesitation_event || false,
        rage_clicks: input.signals.rage_clicks || 0,
        copy_text: input.signals.copy_text || [],
        text_selections: input.signals.text_selections || [],
        events: input.signals.events ? JSON.parse(input.signals.events) : [],
        interactions: input.signals.interactions ? JSON.parse(input.signals.interactions) : {},
        url: input.signals.url || input.pageUrl,
        referrer: input.signals.referrer || input.referrer,
      };

      const result = await this.trackingService.processSignalBatch(siteId, apiKey, {
        sessionId: input.sessionId,
        signals,
        timestamp: input.timestamp || Date.now(),
        ipAddress: input.ipAddress,
        userAgent: input.userAgent,
      });

      return {
        ...result,
        ui_payload: result.ui_payload ? JSON.stringify(result.ui_payload) : null,
      };
    }

    const result = await this.trackingService.ingestEvent(siteId, apiKey, {
      sessionId: input.sessionId,
      eventType: input.eventType as any,
      pageUrl: input.pageUrl,
      referrer: input.referrer,
      userAgent: input.userAgent,
      ipAddress: input.ipAddress || '0.0.0.0',
      metadata,
    });

    return {
      sessionId: result.sessionId,
    };
  }

  @Query(() => [VisitorSessionType])
  async getLiveSessions(
    @Args('siteId') siteId: string,
  ): Promise<any[]> {
    return this.trackingService.getLiveSessions(siteId);
  }

  @Query(() => SiteConfigType)
  async getSiteConfig(
    @Args('siteId') siteId: string,
  ): Promise<any> {
    const config = await this.trackingService.getSiteConfig(siteId);
    return {
      ...config,
      settings: config.settings ? JSON.stringify(config.settings) : null,
    };
  }
}
