import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type AccountDocument = Account & Document;

/**
 * Account Schema
 * 
 * Represents a company/account that has been identified from visitor sessions.
 * Aggregates multiple sessions from the same organization.
 */
@Schema({ timestamps: true, collection: 'accounts' })
export class Account {
  @Prop({ required: true, unique: true })
  accountId: string; // Unique account identifier

  @Prop({ required: true, index: true })
  siteId: string; // Which client site this account visited

  @Prop()
  organizationName?: string; // Company name (if resolved)

  @Prop()
  domain?: string; // Company domain

  @Prop({ type: [String], default: [] })
  ipHashes: string[]; // Hashed IPs associated with this account

  @Prop({ default: 0 })
  totalSessions: number; // Total number of sessions

  @Prop({ default: 0 })
  totalPageViews: number;

  @Prop({ default: 0 })
  totalTimeSpent: number; // Total time in seconds

  @Prop({ type: [String], default: [] })
  pagesVisited: string[]; // Unique pages visited

  @Prop({ default: 0 })
  engagementScore: number; // 0-100 engagement score

  @Prop({ default: 0 })
  intentScore: number; // 0-100 intent score

  @Prop({
    type: {
      pricingPageVisits: Number,
      docsPageVisits: Number,
      apiPageVisits: Number,
      repeatVisits: Number,
      multiUserActivity: Number,
      avgTimePerSession: Number,
      avgPagesPerSession: Number,
    },
    default: {},
  })
  behaviorMetrics: {
    pricingPageVisits?: number;
    docsPageVisits?: number;
    apiPageVisits?: number;
    repeatVisits?: number;
    multiUserActivity?: number;
    avgTimePerSession?: number;
    avgPagesPerSession?: number;
  };

  @Prop({
    type: String,
    enum: ['Looker', 'Researching', 'High Intent'],
    default: 'Looker',
  })
  category: 'Looker' | 'Researching' | 'High Intent';

  @Prop({ required: true, index: true })
  firstSeenAt: Date;

  @Prop({ required: true, index: true })
  lastSeenAt: Date;

  @Prop({ default: false })
  isHighIntent: boolean; // Flag for high-intent accounts

  @Prop()
  lastIntentUpdateAt?: Date; // When intent score was last calculated
}

export const AccountSchema = SchemaFactory.createForClass(Account);

// Indexes for performance
AccountSchema.index({ siteId: 1, intentScore: -1 });
AccountSchema.index({ siteId: 1, lastSeenAt: -1 });
AccountSchema.index({ isHighIntent: 1, siteId: 1 });
