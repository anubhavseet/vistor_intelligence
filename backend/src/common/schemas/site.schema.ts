import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type SiteDocument = Site & Document;

/**
 * Site Schema
 * 
 * Represents a client website that has installed the tracking script.
 */
@Schema({ timestamps: true, collection: 'sites' })
export class Site {
  @Prop({ required: true, unique: true })
  siteId: string; // Unique identifier for the site

  @Prop({ required: true })
  name: string; // Display name

  @Prop()
  domain?: string; // Primary domain

  @Prop({ type: [String], default: [] })
  allowedDomains: string[]; // Domains where tracking is allowed

  @Prop({ required: true, index: true })
  userId: string; // Owner/creator user ID

  @Prop({ default: true })
  isActive: boolean;

  @Prop({
    type: {
      enableTracking: Boolean,
      enableGeoLocation: Boolean,
      enableBehaviorTracking: Boolean,
      dataRetentionDays: Number,
    },
    default: {
      enableTracking: true,
      enableGeoLocation: true,
      enableBehaviorTracking: true,
      dataRetentionDays: 90,
    },
  })
  settings: {
    enableTracking: boolean;
    enableGeoLocation: boolean;
    enableBehaviorTracking: boolean;
    dataRetentionDays: number;
  };

  @Prop()
  apiKey?: string; // API key for tracking endpoint authentication
  save: any;
}

export const SiteSchema = SchemaFactory.createForClass(Site);

SiteSchema.index({ userId: 1 });
SiteSchema.index({ siteId: 1 });
