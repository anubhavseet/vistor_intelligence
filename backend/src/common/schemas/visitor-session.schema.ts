import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type VisitorSessionDocument = VisitorSession & Document;

/**
 * VisitorSession Schema
 * 
 * Tracks anonymous visitor sessions at the account/company level.
 * Privacy-compliant: No individual identity, only session-level data.
 */
@Schema({ timestamps: true, collection: 'visitor_sessions' })
export class VisitorSession {
  @Prop({ required: true, index: true })
  sessionId: string; // Unique session identifier (UUID)

  @Prop({ required: false, index: true })
  siteId: string; // Client site identifier

  @Prop({ required: true, index: true })
  ipHash: string; // SHA-256 hash of IP address (privacy-safe)

  @Prop({
    type: {
      country: String,
      region: String,
      city: String,
      lat: Number,
      lng: Number,
      timezone: String,
    },
  })
  geo?: {
    country?: string;
    region?: string;
    city?: string;
    lat?: number;
    lng?: number;
    timezone?: string;
  };

  @Prop()
  userAgent?: string; // Browser/device info (anonymized)

  @Prop()
  referrer?: string; // Where visitor came from

  @Prop({ type: [String], default: [] })
  utmParams?: string[]; // UTM campaign parameters

  @Prop({ required: true, index: true })
  startedAt: Date;

  @Prop({ index: true })
  endedAt?: Date;

  @Prop({ type: [String], default: [] })
  pagesVisited: string[]; // Array of page URLs

  @Prop({ default: 0 })
  totalPageViews: number;

  @Prop({ default: 0 })
  totalTimeSpent: number; // Total time in seconds

  @Prop({ default: 0 })
  maxScrollDepth: number; // Maximum scroll depth (0-100)

  @Prop()
  accountId?: string; // Resolved company/account ID (if corporate IP detected)

  @Prop()
  organizationName?: string; // Company name (if resolved)

  @Prop({
    type: {
      isVPN: Boolean,
      isMobile: Boolean,
      isDataCenter: Boolean,
      isProxy: Boolean,
    },
    default: {},
  })
  flags?: {
    isVPN?: boolean;
    isMobile?: boolean;
    isDataCenter?: boolean;
    isProxy?: boolean;
  };

  @Prop({ default: 0 })
  intentScore: number;

  @Prop({ default: 'Bouncer' })
  intentCategory: string;

  @Prop({ default: false })
  isActive: boolean; // Whether session is currently active

  @Prop({ default: Date.now })
  lastActivityAt: Date;

  // Data retention: auto-delete after 90 days
  @Prop({ default: () => new Date(Date.now() + 90 * 24 * 60 * 60 * 1000) })
  expiresAt: Date;
}

export const VisitorSessionSchema = SchemaFactory.createForClass(VisitorSession);

// Indexes for performance
VisitorSessionSchema.index({ siteId: 1, startedAt: -1 });
VisitorSessionSchema.index({ accountId: 1, startedAt: -1 });
VisitorSessionSchema.index({ 'geo.country': 1 });
VisitorSessionSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });
