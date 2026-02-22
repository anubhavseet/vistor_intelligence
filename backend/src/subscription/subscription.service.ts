import { Injectable, NotFoundException, BadRequestException, ForbiddenException, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { v4 as uuidv4 } from 'uuid';
import { Subscription, SubscriptionDocument } from '../common/schemas/subscription.schema';
import { Invoice, InvoiceDocument } from '../common/schemas/invoice.schema';
import { Plan, PlanDocument } from '../common/schemas/plan.schema';
import { RazorpayService } from './razorpay.service';

@Injectable()
export class SubscriptionService {
    private readonly logger = new Logger(SubscriptionService.name);

    constructor(
        @InjectModel(Subscription.name) private subscriptionModel: Model<SubscriptionDocument>,
        @InjectModel(Invoice.name) private invoiceModel: Model<InvoiceDocument>,
        @InjectModel(Plan.name) private planModel: Model<PlanDocument>,
        private razorpayService: RazorpayService,
    ) { }

    // ============ SUBSCRIPTION QUERIES ============

    async getActiveSubscription(userId: string): Promise<SubscriptionDocument | null> {
        return this.subscriptionModel
            .findOne({
                userId: new Types.ObjectId(userId),
                status: { $in: ['active', 'authenticated', 'created', 'pending'] },
            })
            .populate('planId')
            .sort({ createdAt: -1 })
            .exec();
    }

    async getSubscriptionById(subscriptionId: string): Promise<SubscriptionDocument> {
        const sub = await this.subscriptionModel.findOne({ subscriptionId }).populate('planId').exec();
        if (!sub) throw new NotFoundException('Subscription not found');
        return sub;
    }

    async getAllSubscriptions(filters?: { status?: string }): Promise<SubscriptionDocument[]> {
        const query: any = {};
        if (filters?.status) query.status = filters.status;
        return this.subscriptionModel
            .find(query)
            .populate('planId')
            .populate('userId', 'name email role')
            .sort({ createdAt: -1 })
            .exec();
    }

    async getUserInvoices(userId: string): Promise<InvoiceDocument[]> {
        return this.invoiceModel
            .find({ userId: new Types.ObjectId(userId) })
            .populate('planId', 'name amount')
            .sort({ createdAt: -1 })
            .exec();
    }

    // ============ SUBSCRIPTION LIFECYCLE ============

    async createSubscription(userId: string, planId: string): Promise<SubscriptionDocument> {
        // Validate plan
        const plan = await this.planModel.findById(planId).exec();
        if (!plan || !plan.isActive) throw new BadRequestException('Plan not found or inactive');
        console.log(userId, plan.assignedUserId)
        // Check if plan is custom and assigned to this user
        if (plan.isCustom && String(plan.assignedUserId) !== String(userId)) {
            throw new ForbiddenException('This plan is not available to you');
        }

        // Check for existing active subscription
        const existingSub = await this.getActiveSubscription(userId);
        if (existingSub && ['active', 'authenticated'].includes(existingSub.status)) {
            throw new BadRequestException('You already have an active subscription. Cancel it first or upgrade.');
        }

        // Free plan — activate immediately without Razorpay
        if (plan.amount === 0) {
            const sub = new this.subscriptionModel({
                subscriptionId: uuidv4(),
                userId: new Types.ObjectId(userId),
                planId: plan._id,
                status: 'active',
                currentPeriodStart: new Date(),
                currentPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
                startedAt: new Date(),
                paidCount: 0,
                currentUsage: {
                    sitesCreated: 0,
                    webhooksCreated: 0,
                    sessionsTracked: 0,
                    aiCallsMade: 0,
                    crawlPagesUsed: 0,
                },
            });
            return sub.save();
        }

        // Paid plan — create Razorpay subscription
        if (!plan.razorpayPlanId) {
            throw new BadRequestException('Plan is not configured for payments');
        }

        const rzpSub = await this.razorpayService.createSubscription({
            plan_id: plan.razorpayPlanId,
            total_count: plan.period === 'yearly' ? 10 : 120, // ~10 years
            customer_notify: 1,
            notes: {
                userId,
                planId: String(plan._id),
                planName: plan.name,
            },
        });

        const sub = new this.subscriptionModel({
            subscriptionId: uuidv4(),
            razorpaySubscriptionId: rzpSub.id,
            userId: new Types.ObjectId(userId),
            planId: plan._id,
            status: 'created',
            shortUrl: rzpSub.short_url,
            paidCount: 0,
            currentUsage: {
                sitesCreated: 0,
                webhooksCreated: 0,
                sessionsTracked: 0,
                aiCallsMade: 0,
                crawlPagesUsed: 0,
            },
        });

        return sub.save();
    }

    async cancelSubscription(subscriptionId: string, userId?: string, cancelAtPeriodEnd = true): Promise<SubscriptionDocument> {
        const sub = await this.getSubscriptionById(subscriptionId);

        // Verify ownership if userId provided
        if (userId && String(sub.userId) !== userId) {
            throw new ForbiddenException('Not authorized');
        }

        if (['cancelled', 'completed', 'expired'].includes(sub.status)) {
            throw new BadRequestException('Subscription is already cancelled or expired');
        }

        // Cancel on Razorpay if it's a paid subscription
        if (sub.razorpaySubscriptionId) {
            await this.razorpayService.cancelSubscription(sub.razorpaySubscriptionId, cancelAtPeriodEnd);
        }

        sub.cancelAtPeriodEnd = cancelAtPeriodEnd;
        sub.cancelledAt = new Date();

        if (!cancelAtPeriodEnd) {
            sub.status = 'cancelled';
            sub.endedAt = new Date();
        }

        return sub.save();
    }

    async pauseSubscription(subscriptionId: string, userId: string): Promise<SubscriptionDocument> {
        const sub = await this.getSubscriptionById(subscriptionId);
        if (String(sub.userId) !== userId) throw new ForbiddenException('Not authorized');
        if (sub.status !== 'active') throw new BadRequestException('Only active subscriptions can be paused');

        if (sub.razorpaySubscriptionId) {
            await this.razorpayService.pauseSubscription(sub.razorpaySubscriptionId);
        }

        sub.status = 'paused';
        return sub.save();
    }

    async resumeSubscription(subscriptionId: string, userId: string): Promise<SubscriptionDocument> {
        const sub = await this.getSubscriptionById(subscriptionId);
        if (String(sub.userId) !== userId) throw new ForbiddenException('Not authorized');
        if (sub.status !== 'paused') throw new BadRequestException('Only paused subscriptions can be resumed');

        if (sub.razorpaySubscriptionId) {
            await this.razorpayService.resumeSubscription(sub.razorpaySubscriptionId);
        }

        sub.status = 'active';
        return sub.save();
    }

    // ============ WEBHOOK HANDLERS ============

    async handleSubscriptionAuthenticated(razorpaySubId: string): Promise<void> {
        const sub = await this.subscriptionModel.findOne({ razorpaySubscriptionId: razorpaySubId }).exec();
        if (!sub) {
            this.logger.warn(`Webhook: subscription.authenticated — sub not found: ${razorpaySubId}`);
            return;
        }
        sub.status = 'authenticated';
        await sub.save();
        this.logger.log(`Subscription authenticated: ${sub.subscriptionId}`);
    }

    async handleSubscriptionActivated(razorpaySubId: string, payload: any): Promise<void> {
        const sub = await this.subscriptionModel.findOne({ razorpaySubscriptionId: razorpaySubId }).exec();
        if (!sub) return;

        sub.status = 'active';
        sub.startedAt = new Date();

        if (payload?.current_start) sub.currentPeriodStart = new Date(payload.current_start * 1000);
        if (payload?.current_end) sub.currentPeriodEnd = new Date(payload.current_end * 1000);
        if (payload?.customer_id) sub.razorpayCustomerId = payload.customer_id;

        await sub.save();
        this.logger.log(`Subscription activated: ${sub.subscriptionId}`);
    }

    async handleSubscriptionCharged(razorpaySubId: string, payload: any): Promise<void> {
        const sub = await this.subscriptionModel.findOne({ razorpaySubscriptionId: razorpaySubId }).populate('planId').exec();
        if (!sub) return;

        sub.paidCount += 1;
        if (payload?.current_start) sub.currentPeriodStart = new Date(payload.current_start * 1000);
        if (payload?.current_end) sub.currentPeriodEnd = new Date(payload.current_end * 1000);
        sub.status = 'active';

        // Reset usage counters on new billing cycle
        sub.currentUsage = {
            sitesCreated: sub.currentUsage.sitesCreated, // Sites persist, don't reset
            webhooksCreated: sub.currentUsage.webhooksCreated, // Webhooks persist
            sessionsTracked: 0,
            aiCallsMade: 0,
            crawlPagesUsed: 0,
        } as any;
        sub.markModified('currentUsage');

        await sub.save();

        // Create invoice record
        const plan = sub.planId as any;
        await this.invoiceModel.create({
            invoiceId: uuidv4(),
            razorpayPaymentId: payload?.payment_id,
            subscriptionId: sub._id,
            userId: sub.userId,
            planId: plan._id || sub.planId,
            amount: plan?.amount || payload?.amount || 0,
            currency: 'INR',
            status: 'paid',
            billingPeriodStart: sub.currentPeriodStart,
            billingPeriodEnd: sub.currentPeriodEnd,
            paidAt: new Date(),
        });

        this.logger.log(`Subscription charged: ${sub.subscriptionId}, payment: ${payload?.payment_id}`);
    }

    async handleSubscriptionCancelled(razorpaySubId: string): Promise<void> {
        const sub = await this.subscriptionModel.findOne({ razorpaySubscriptionId: razorpaySubId }).exec();
        if (!sub) return;
        sub.status = 'cancelled';
        sub.endedAt = new Date();
        await sub.save();
        this.logger.log(`Subscription cancelled: ${sub.subscriptionId}`);
    }

    async handleSubscriptionCompleted(razorpaySubId: string): Promise<void> {
        const sub = await this.subscriptionModel.findOne({ razorpaySubscriptionId: razorpaySubId }).exec();
        if (!sub) return;
        sub.status = 'completed';
        sub.endedAt = new Date();
        await sub.save();
        this.logger.log(`Subscription completed: ${sub.subscriptionId}`);
    }

    async handleSubscriptionPaused(razorpaySubId: string): Promise<void> {
        const sub = await this.subscriptionModel.findOne({ razorpaySubscriptionId: razorpaySubId }).exec();
        if (!sub) return;
        sub.status = 'paused';
        await sub.save();
    }

    async handleSubscriptionResumed(razorpaySubId: string): Promise<void> {
        const sub = await this.subscriptionModel.findOne({ razorpaySubscriptionId: razorpaySubId }).exec();
        if (!sub) return;
        sub.status = 'active';
        await sub.save();
    }

    async handleSubscriptionHalted(razorpaySubId: string): Promise<void> {
        const sub = await this.subscriptionModel.findOne({ razorpaySubscriptionId: razorpaySubId }).exec();
        if (!sub) return;
        sub.status = 'halted';
        await sub.save();
        this.logger.warn(`Subscription halted (payment failed): ${sub.subscriptionId}`);
    }

    async handleSubscriptionPending(razorpaySubId: string): Promise<void> {
        const sub = await this.subscriptionModel.findOne({ razorpaySubscriptionId: razorpaySubId }).exec();
        if (!sub) return;
        sub.status = 'pending';
        await sub.save();
    }

    // ============ USAGE TRACKING ============

    async incrementUsage(userId: string, field: keyof Subscription['currentUsage']): Promise<void> {
        await this.subscriptionModel.updateOne(
            { userId: new Types.ObjectId(userId), status: 'active' },
            { $inc: { [`currentUsage.${field}`]: 1 } },
        ).exec();
    }

    async checkFeatureLimit(userId: string, feature: string): Promise<{ allowed: boolean; current: number; limit: number }> {
        const sub = await this.getActiveSubscription(userId);
        if (!sub) {
            return { allowed: false, current: 0, limit: 0 };
        }

        const plan = sub.planId as unknown as PlanDocument;
        if (!plan?.features) {
            return { allowed: false, current: 0, limit: 0 };
        }

        const featureMap: Record<string, { usageKey: string; limitKey: string }> = {
            maxSites: { usageKey: 'sitesCreated', limitKey: 'maxSites' },
            maxWebhooks: { usageKey: 'webhooksCreated', limitKey: 'maxWebhooks' },
            maxSessionsPerMonth: { usageKey: 'sessionsTracked', limitKey: 'maxSessionsPerMonth' },
            maxAiCallsPerMonth: { usageKey: 'aiCallsMade', limitKey: 'maxAiCallsPerMonth' },
            maxCrawlPages: { usageKey: 'crawlPagesUsed', limitKey: 'maxCrawlPages' },
        };

        const mapping = featureMap[feature];
        if (!mapping) return { allowed: true, current: 0, limit: -1 }; // Unknown features are allowed

        const current = (sub.currentUsage as any)[mapping.usageKey] || 0;
        const limit = (plan.features as any)[mapping.limitKey] || 0;

        // -1 means unlimited
        if (limit === -1) return { allowed: true, current, limit };

        return { allowed: current < limit, current, limit };
    }

    async checkBooleanFeature(userId: string, feature: string): Promise<boolean> {
        const sub = await this.getActiveSubscription(userId);
        if (!sub) return false;

        const plan = sub.planId as unknown as PlanDocument;
        if (!plan?.features) return false;

        return (plan.features as any)[feature] === true;
    }

    // ============ CRON HELPERS ============

    async resetMonthlyUsage(): Promise<number> {
        const result = await this.subscriptionModel.updateMany(
            { status: 'active' },
            {
                $set: {
                    'currentUsage.sessionsTracked': 0,
                    'currentUsage.aiCallsMade': 0,
                    'currentUsage.crawlPagesUsed': 0,
                },
            },
        ).exec();
        return result.modifiedCount;
    }

    async cleanupStaleSubscriptions(): Promise<number> {
        const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
        const result = await this.subscriptionModel.updateMany(
            { status: 'created', createdAt: { $lt: oneDayAgo } },
            { $set: { status: 'expired' } },
        ).exec();
        return result.modifiedCount;
    }

    async expireCompletedSubscriptions(): Promise<number> {
        const now = new Date();
        const result = await this.subscriptionModel.updateMany(
            {
                status: 'active',
                cancelAtPeriodEnd: true,
                currentPeriodEnd: { $lt: now },
            },
            { $set: { status: 'cancelled', endedAt: now } },
        ).exec();
        return result.modifiedCount;
    }

    async syncWithRazorpay(): Promise<number> {
        const subs = await this.subscriptionModel
            .find({
                razorpaySubscriptionId: { $exists: true, $ne: null },
                status: { $in: ['active', 'authenticated', 'pending', 'halted'] },
            })
            .exec();

        let synced = 0;
        for (const sub of subs) {
            try {
                const rzpSub = await this.razorpayService.fetchSubscription(sub.razorpaySubscriptionId!);
                if (rzpSub.status !== sub.status) {
                    sub.status = rzpSub.status;
                    if (rzpSub.current_start) sub.currentPeriodStart = new Date(rzpSub.current_start * 1000);
                    if (rzpSub.current_end) sub.currentPeriodEnd = new Date(rzpSub.current_end * 1000);
                    await sub.save();
                    synced++;
                }
            } catch (error: any) {
                this.logger.warn(`Failed to sync subscription ${sub.subscriptionId}: ${error.message}`);
            }
        }
        return synced;
    }
}
