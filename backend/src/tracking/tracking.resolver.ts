import { Resolver, Mutation, Args } from '@nestjs/graphql';
import { UseGuards } from '@nestjs/common';
import { TrackingService } from './tracking.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { TrackingEventInput } from './dto/tracking-event.input';

@Resolver()
@UseGuards(JwtAuthGuard)
export class TrackingResolver {
  constructor(private trackingService: TrackingService) {}

  @Mutation(() => String)
  async ingestTrackingEvent(
    @Args('siteId') siteId: string,
    @Args('input') input: TrackingEventInput,
    @CurrentUser() user: any,
  ): Promise<string> {
    // In production, get API key from site
    // For now, using a placeholder
    const apiKey = 'placeholder'; // Should fetch from site
    
    // Parse metadata if it's a JSON string
    let metadata: any = undefined;
    if (input.metadata) {
      try {
        metadata = JSON.parse(input.metadata);
      } catch (e) {
        // If parsing fails, ignore metadata
      }
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
    
    return result.sessionId;
  }
}
