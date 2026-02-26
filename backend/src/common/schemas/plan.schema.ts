import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type PlanDocument = Plan & Document;

@Schema({ _id: false })
export class PlanFeatures {
    @Prop({ default: 1 })
    maxSites: number;

    @Prop({ default: 1 })
    maxWebhooks: number;

    @Prop({ default: 1000 })
    maxSessionsPerMonth: number;

    @Prop({ default: 50 })
    maxAiCallsPerMonth: number;

    @Prop({ default: 10 })
    maxCrawlPages: number;

    @Prop({ default: 7 })
    dataRetentionDays: number;

    @Prop({ default: false })
    enableBehaviorTracking: boolean;

    @Prop({ default: false })
    enableGeoLocation: boolean;

    @Prop({ default: false })
    enableUiInjection: boolean;

    @Prop({ default: false })
    enableEnrichment: boolean;

    @Prop({ default: false })
    enableCustomWebhooks: boolean;
}

export const PlanFeaturesSchema = SchemaFactory.createForClass(PlanFeatures);

/**
 * Plan Schema
 *
 * Represents a subscription plan (Free, Starter, Pro, Enterprise, Custom).
 * Synced with Razorpay Plans API.
 */
@Schema({ timestamps: true, collection: 'plans' })
export class Plan {
    @Prop({ required: true, unique: true })
    planId: string; // Internal UUID

    @Prop()
    razorpayPlanId?: string; // Razorpay plan_xxx ID (null for free tier)

    @Prop({ required: true })
    name: string;

    @Prop({ default: '' })
    description: string;

    @Prop({ required: true, default: 0 })
    amount: number; // Price in paise (49900 = ₹499)

    @Prop({ default: 'INR' })
    currency: string;

    @Prop({ type: String, enum: ['monthly', 'yearly'], default: 'monthly' })
    period: 'monthly' | 'yearly';

    @Prop({ default: 1 })
    interval: number;

    @Prop({ default: true })
    isActive: boolean;

    @Prop({ default: false })
    isCustom: boolean; // Custom plan tied to specific user

    @Prop({ type: Types.ObjectId, ref: 'User' })
    assignedUserId?: Types.ObjectId; // Only for custom plans

    @Prop({ type: PlanFeaturesSchema, default: () => ({}) })
    features: PlanFeatures;

    @Prop({ type: Object, default: {} })
    metadata?: Record<string, any>;

    @Prop({ default: 0 })
    trialDays: number;

    @Prop({ default: 0 })
    sortOrder: number; // For display ordering
}

export const PlanSchema = SchemaFactory.createForClass(Plan);

PlanSchema.index({ planId: 1 });
PlanSchema.index({ isActive: 1 });
PlanSchema.index({ isCustom: 1, assignedUserId: 1 });
PlanSchema.index({ razorpayPlanId: 1 });
