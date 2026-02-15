import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type PageEventDocument = PageEvent & Document;

/**
 * PageEvent Schema
 * 
 * Individual page-level events within a session.
 * Tracks views, scrolls, clicks (non-PII only).
 */
@Schema({ timestamps: true, collection: 'page_events' })
export class PageEvent {
  @Prop({ required: true, index: true })
  sessionId: string;

  @Prop({ required: true, index: true })
  siteId: string;

  @Prop({ required: true })
  pageUrl: string; // Full URL of the page

  @Prop({ required: true, index: true })
  eventType: string;

  @Prop({ required: true, index: true })
  timestamp: Date;

  @Prop({ type: Object })
  metadata?: any;

  // Data retention: auto-delete after 90 days
  @Prop({ default: () => new Date(Date.now() + 90 * 24 * 60 * 60 * 1000) })
  expiresAt: Date;
}

export const PageEventSchema = SchemaFactory.createForClass(PageEvent);

// Indexes for performance
PageEventSchema.index({ sessionId: 1, timestamp: -1 });
PageEventSchema.index({ siteId: 1, timestamp: -1 });
PageEventSchema.index({ eventType: 1, timestamp: -1 });
PageEventSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });
