import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

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

  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  userId: Types.ObjectId;

  @Prop({ default: true })
  isActive: boolean;

  @Prop({
    type: {
      enableTracking: Boolean,
      enableGeoLocation: Boolean,
      enableBehaviorTracking: Boolean,
      dataRetentionDays: Number,
      trackingStartDelay: Number,
      usePreGeneratedIntentUI: Boolean,
    },
    default: {
      enableTracking: true,
      enableGeoLocation: true,
      enableBehaviorTracking: true,
      dataRetentionDays: 90,
      trackingStartDelay: 0,
      usePreGeneratedIntentUI: false,
    },
  })
  settings: {
    enableTracking: boolean;
    enableGeoLocation: boolean;
    enableBehaviorTracking: boolean;
    dataRetentionDays: number;
    trackingStartDelay: number;
    usePreGeneratedIntentUI: boolean;
  };

  @Prop()
  apiKey?: string; // API key for tracking endpoint authentication
  save: any;
}

export const SiteSchema = SchemaFactory.createForClass(Site);

SiteSchema.index({ userId: 1 });
SiteSchema.index({ siteId: 1 });
