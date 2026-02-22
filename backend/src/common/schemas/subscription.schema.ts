import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type SubscriptionDocument = Subscription & Document;

@Schema({ _id: false })
export class SubscriptionUsage {
    @Prop({ default: 0 })
    sitesCreated: number;

    @Prop({ default: 0 })
    webhooksCreated: number;

    @Prop({ default: 0 })
    sessionsTracked: number;

    @Prop({ default: 0 })
    aiCallsMade: number;

    @Prop({ default: 0 })
    crawlPagesUsed: number;
}

export const SubscriptionUsageSchema = SchemaFactory.createForClass(SubscriptionUsage);

/**
 * Subscription Schema
 *
 * Tracks each user's active subscription with Razorpay.
 */
@Schema({ timestamps: true, collection: 'subscriptions' })
export class Subscription {
    @Prop({ required: true, unique: true })
    subscriptionId: string; // Internal UUID

    @Prop()
    razorpaySubscriptionId?: string; // Razorpay sub_xxx ID

    @Prop()
    razorpayCustomerId?: string; // Razorpay cust_xxx ID

    @Prop({ type: Types.ObjectId, ref: 'User', required: true, index: true })
    userId: Types.ObjectId;

    @Prop({ type: Types.ObjectId, ref: 'Plan', required: true })
    planId: Types.ObjectId;

    @Prop({
        type: String,
        enum: ['created', 'authenticated', 'active', 'pending', 'halted', 'cancelled', 'completed', 'expired', 'paused'],
        default: 'created',
    })
    status: string;

    @Prop()
    currentPeriodStart?: Date;

    @Prop()
    currentPeriodEnd?: Date;

    @Prop()
    startedAt?: Date;

    @Prop()
    endedAt?: Date;

    @Prop()
    cancelledAt?: Date;

    @Prop({ default: false })
    cancelAtPeriodEnd: boolean;

    @Prop()
    totalBillingCycles?: number;

    @Prop({ default: 0 })
    paidCount: number;

    @Prop()
    remainingCount?: number;

    @Prop()
    shortUrl?: string; // Razorpay payment link

    @Prop({ type: SubscriptionUsageSchema, default: () => ({}) })
    currentUsage: SubscriptionUsage;

    @Prop({ type: Object, default: {} })
    metadata?: Record<string, any>;
}

export const SubscriptionSchema = SchemaFactory.createForClass(Subscription);

SubscriptionSchema.index({ userId: 1, status: 1 });
SubscriptionSchema.index({ razorpaySubscriptionId: 1 });
SubscriptionSchema.index({ status: 1 });
SubscriptionSchema.index({ currentPeriodEnd: 1 });
