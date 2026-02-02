import { Controller, Post, Body, Headers, BadRequestException, Get, Param } from '@nestjs/common';
import { TrackingService } from './tracking.service';

/**
 * Tracking Controller
 * 
 * REST endpoint for client tracking script to send events.
 * Handles both legacy single-event tracking and new batch signal tracking.
 */
@Controller('track')
export class TrackingController {
  constructor(private trackingService: TrackingService) { }

  @Post()
  async track(
    @Body() body: any,
    @Headers('x-site-id') siteId: string,
    @Headers('x-api-key') apiKey: string,
  ) {
    if (!siteId) {
      // Allow siteId to be passed in body if not in header (legacy support)
      siteId = body.siteId;
    }

    // Extract IP
    const ipAddress =
      (body.ipAddress as string) ||
      (body.headers?.['x-forwarded-for'] as string)?.split(',')[0] ||
      '0.0.0.0';

    // New Signal Batch Logic
    if (body.signals) {
      return await this.trackingService.processSignalBatch(siteId, apiKey, {
        ...body,
        ipAddress
      });
    }

    // Legacy Single Event Logic
    return await this.trackingService.ingestEvent(siteId, apiKey, {
      sessionId: body.sessionId,
      eventType: body.eventType,
      pageUrl: body.pageUrl,
      referrer: body.referrer,
      utmParams: body.utmParams,
      userAgent: body.userAgent,
      ipAddress,
      metadata: body.metadata,
    });
  }

  @Get('live/:siteId')
  async getLiveSessions(@Param('siteId') siteId: string) {
    return await this.trackingService.getLiveSessions(siteId);
  }
}
