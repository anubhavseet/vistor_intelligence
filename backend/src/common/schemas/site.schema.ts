import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import { IntentCategory } from '../enums/intent.enum';

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
      isUiInjectionEnabled: Boolean,
      maxInjectionsPerIntent: [{ intent: { type: String, enum: Object.values(IntentCategory) }, limit: Number }],
    },
    default: {
      enableTracking: true,
      enableGeoLocation: true,
      enableBehaviorTracking: true,
      dataRetentionDays: 90,
      trackingStartDelay: 0,
      usePreGeneratedIntentUI: false,
      isUiInjectionEnabled: true,
      maxInjectionsPerIntent: [
        { intent: IntentCategory.HIGH_INTENT, limit: 3 },
        { intent: IntentCategory.HESITATION, limit: 2 },
        { intent: IntentCategory.BOUNCE_RISK, limit: 1 },
        { intent: IntentCategory.RESEARCHER, limit: 2 }
      ],
    },
  })
  settings: {
    enableTracking: boolean;
    enableGeoLocation: boolean;
    enableBehaviorTracking: boolean;
    dataRetentionDays: number;
    trackingStartDelay: number;
    usePreGeneratedIntentUI: boolean;
    isUiInjectionEnabled: boolean;
    maxInjectionsPerIntent: { intent: IntentCategory | string; limit: number }[];
  };

  @Prop()
  apiKey?: string; // API key for tracking endpoint authentication

  @Prop({
    type: Object,
    default: {}
  })
  designSystem?: {
    primaryColor?: string;
    secondaryColor?: string;
    fontFamily?: string;
    borderRadius?: string;
    buttonBackground?: string;
    buttonTextColor?: string;
    logoUrl?: string;
  };
  @Prop({ type: Object, default: {} })
  intentSelectorMap?: Record<string, { selectors: string[]; confidence: number }>;

  @Prop({ type: Date })
  intentSelectorMapBuiltAt?: Date;

  save: any;
}

export const SiteSchema = SchemaFactory.createForClass(Site);

SiteSchema.index({ userId: 1 });
SiteSchema.index({ siteId: 1 });
