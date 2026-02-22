import { ObjectType, Field, ID, Float, Int, InputType, registerEnumType } from '@nestjs/graphql';

// ============ ENUMS ============

export enum PlanPeriod {
    MONTHLY = 'monthly',
    YEARLY = 'yearly',
}
registerEnumType(PlanPeriod, { name: 'PlanPeriod' });

export enum SubscriptionStatus {
    CREATED = 'created',
    AUTHENTICATED = 'authenticated',
    ACTIVE = 'active',
    PENDING = 'pending',
    HALTED = 'halted',
    CANCELLED = 'cancelled',
    COMPLETED = 'completed',
    EXPIRED = 'expired',
    PAUSED = 'paused',
}
registerEnumType(SubscriptionStatus, { name: 'SubscriptionStatus' });

// ============ OUTPUT TYPES ============

@ObjectType()
export class PlanFeaturesType {
    @Field(() => Int) maxSites: number;
    @Field(() => Int) maxWebhooks: number;
    @Field(() => Int) maxSessionsPerMonth: number;
    @Field(() => Int) maxAiCallsPerMonth: number;
    @Field(() => Int) maxCrawlPages: number;
    @Field(() => Int) dataRetentionDays: number;
    @Field() enableBehaviorTracking: boolean;
    @Field() enableGeoLocation: boolean;
    @Field() enableUiInjection: boolean;
    @Field() enableEnrichment: boolean;
    @Field() enableCustomWebhooks: boolean;
}

@ObjectType()
export class PlanType {
    @Field(() => ID) id: string;
    @Field() planId: string;
    @Field({ nullable: true }) razorpayPlanId?: string;
    @Field() name: string;
    @Field() description: string;
    @Field(() => Float) amount: number;
    @Field() currency: string;
    @Field(() => PlanPeriod) period: string;
    @Field(() => Int) interval: number;
    @Field() isActive: boolean;
    @Field() isCustom: boolean;
    @Field({ nullable: true }) assignedUserId?: string;
    @Field(() => PlanFeaturesType) features: PlanFeaturesType;
    @Field(() => Int) sortOrder: number;
    @Field() createdAt: Date;
    @Field() updatedAt: Date;
}

@ObjectType()
export class SubscriptionUsageType {
    @Field(() => Int) sitesCreated: number;
    @Field(() => Int) webhooksCreated: number;
    @Field(() => Int) sessionsTracked: number;
    @Field(() => Int) aiCallsMade: number;
    @Field(() => Int) crawlPagesUsed: number;
}

@ObjectType()
export class SubscriptionType {
    @Field(() => ID) id: string;
    @Field() subscriptionId: string;
    @Field({ nullable: true }) razorpaySubscriptionId?: string;
    @Field() userId: string;
    @Field(() => PlanType, { nullable: true }) plan?: PlanType;
    @Field() status: string;
    @Field({ nullable: true }) currentPeriodStart?: Date;
    @Field({ nullable: true }) currentPeriodEnd?: Date;
    @Field({ nullable: true }) startedAt?: Date;
    @Field({ nullable: true }) endedAt?: Date;
    @Field({ nullable: true }) cancelledAt?: Date;
    @Field() cancelAtPeriodEnd: boolean;
    @Field(() => Int) paidCount: number;
    @Field({ nullable: true }) shortUrl?: string;
    @Field(() => SubscriptionUsageType) currentUsage: SubscriptionUsageType;
    @Field() createdAt: Date;
    @Field() updatedAt: Date;
}

@ObjectType()
export class InvoiceType {
    @Field(() => ID) id: string;
    @Field() invoiceId: string;
    @Field({ nullable: true }) razorpayPaymentId?: string;
    @Field() userId: string;
    @Field(() => PlanType, { nullable: true }) plan?: PlanType;
    @Field(() => Float) amount: number;
    @Field() currency: string;
    @Field() status: string;
    @Field({ nullable: true }) billingPeriodStart?: Date;
    @Field({ nullable: true }) billingPeriodEnd?: Date;
    @Field({ nullable: true }) paidAt?: Date;
    @Field() createdAt: Date;
}

@ObjectType()
export class CreateSubscriptionResponse {
    @Field() subscriptionId: string;
    @Field({ nullable: true }) razorpaySubscriptionId?: string;
    @Field({ nullable: true }) shortUrl?: string;
    @Field() razorpayKeyId: string;
    @Field() status: string;
}

@ObjectType()
export class FeatureLimitCheckResponse {
    @Field() allowed: boolean;
    @Field(() => Int) current: number;
    @Field(() => Int) limit: number;
}

@ObjectType()
export class AdminSubscriptionType extends SubscriptionType {
    @Field({ nullable: true }) userName?: string;
    @Field({ nullable: true }) userEmail?: string;
}

// ============ INPUT TYPES ============

@InputType()
export class PlanFeaturesInput {
    @Field(() => Int, { nullable: true }) maxSites?: number;
    @Field(() => Int, { nullable: true }) maxWebhooks?: number;
    @Field(() => Int, { nullable: true }) maxSessionsPerMonth?: number;
    @Field(() => Int, { nullable: true }) maxAiCallsPerMonth?: number;
    @Field(() => Int, { nullable: true }) maxCrawlPages?: number;
    @Field(() => Int, { nullable: true }) dataRetentionDays?: number;
    @Field({ nullable: true }) enableBehaviorTracking?: boolean;
    @Field({ nullable: true }) enableGeoLocation?: boolean;
    @Field({ nullable: true }) enableUiInjection?: boolean;
    @Field({ nullable: true }) enableEnrichment?: boolean;
    @Field({ nullable: true }) enableCustomWebhooks?: boolean;
}

@InputType()
export class CreatePlanInput {
    @Field() name: string;
    @Field({ nullable: true }) description?: string;
    @Field(() => Float) amount: number;
    @Field(() => PlanPeriod, { nullable: true }) period?: PlanPeriod;
    @Field(() => Int, { nullable: true }) interval?: number;
    @Field({ nullable: true }) isCustom?: boolean;
    @Field({ nullable: true }) assignedUserId?: string;
    @Field(() => PlanFeaturesInput, { nullable: true }) features?: PlanFeaturesInput;
    @Field(() => Int, { nullable: true }) sortOrder?: number;
}

@InputType()
export class UpdatePlanInput {
    @Field({ nullable: true }) name?: string;
    @Field({ nullable: true }) description?: string;
    @Field({ nullable: true }) isActive?: boolean;
    @Field(() => PlanFeaturesInput, { nullable: true }) features?: PlanFeaturesInput;
    @Field(() => Int, { nullable: true }) sortOrder?: number;
}
