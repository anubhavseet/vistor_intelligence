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
  async track() {
    return { message: 'Use GraphQL endpoint /graphql for tracking' };
  }
}
