import { Injectable, NotFoundException, BadRequestException, ForbiddenException, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { v4 as uuidv4 } from 'uuid';
import { Subscription, SubscriptionDocument } from '../common/schemas/subscription.schema';
import { Invoice, InvoiceDocument } from '../common/schemas/invoice.schema';
import { Plan, PlanDocument } from '../common/schemas/plan.schema';
import { Site, SiteDocument } from '../common/schemas/site.schema';
import { Webhook, WebhookDocument } from '../common/schemas/webhook.schema';
import { RazorpayService } from './razorpay.service';

@Injectable()
export class SubscriptionService {
    private readonly logger = new Logger(SubscriptionService.name);

    constructor(
        @InjectModel(Subscription.name) private subscriptionModel: Model<SubscriptionDocument>,
        @InjectModel(Invoice.name) private invoiceModel: Model<InvoiceDocument>,
        @InjectModel(Plan.name) private planModel: Model<PlanDocument>,
        @InjectModel(Site.name) private siteModel: Model<SiteDocument>,
        @InjectModel(Webhook.name) private webhookModel: Model<WebhookDocument>,
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

    async getInvoiceDownloadUrl(userId: string, invoiceId: string): Promise<string> {
        const invoice = await this.invoiceModel.findOne({
            invoiceId,
            userId: new Types.ObjectId(userId),
        }).exec();

        if (!invoice) {
            throw new NotFoundException('Invoice not found');
        }

        if (invoice.receiptUrl) {
            return invoice.receiptUrl;
        }

        // If no receipt URL, try to fetch it from Razorpay if we have an invoice ID
        if (invoice.razorpayInvoiceId) {
            try {
                const rzpInvoice = await this.razorpayService.fetchInvoice(invoice.razorpayInvoiceId);
                if (rzpInvoice?.short_url) {
                    invoice.receiptUrl = rzpInvoice.short_url;
                    await invoice.save();
                    return invoice.receiptUrl;
                }
            } catch (error: any) {
                this.logger.warn(`Failed to fetch invoice from Razorpay: ${error.message}`);
            }
        }

        // Alternative: If we have a subscription, we can look through its invoices
        const sub = await this.subscriptionModel.findById(invoice.subscriptionId).exec();
        if (sub?.razorpaySubscriptionId) {
            try {
                const rzpInvoices = await this.razorpayService.fetchSubscriptionInvoices(sub.razorpaySubscriptionId);
                const match = rzpInvoices.items.find((i: any) => i.payment_id === invoice.razorpayPaymentId || i.id === invoice.razorpayInvoiceId);
                if (match?.short_url) {
                    invoice.receiptUrl = match.short_url;
                    if (match.id) invoice.razorpayInvoiceId = match.id;
                    await invoice.save();
                    return invoice.receiptUrl;
                }
            } catch (error: any) {
                this.logger.warn(`Failed to fetch subscription invoices from Razorpay: ${error.message}`);
            }
        }

        throw new BadRequestException('Download URL not available for this invoice yet. Please try again in a few minutes.');
    }

    // ============ SUBSCRIPTION LIFECYCLE ============

    async createSubscription(userId: string, planId: string): Promise<SubscriptionDocument> {
        // Validate plan
        const plan = await this.planModel.findById(planId).exec();
        if (!plan || !plan.isActive) throw new BadRequestException('Plan not found or inactive');

        // Check if plan is custom and assigned to this user
        if (plan.isCustom && String(plan.assignedUserId) !== String(userId)) {
            throw new ForbiddenException('This plan is not available to you');
        }

        // Check for existing active subscription
        const existingSub = await this.getActiveSubscription(userId);
        let currentUsage = {
            sitesCreated: 0,
            webhooksCreated: 0,
            sessionsTracked: 0,
            aiCallsMade: 0,
            crawlPagesUsed: 0,
        };

        if (existingSub && ['active', 'authenticated'].includes(existingSub.status)) {
            // Prevent subscribing to the exact same plan they already have
            if (String(existingSub.planId._id || existingSub.planId) === String(plan._id)) {
                throw new BadRequestException('You are already subscribed to this plan.');
            }

            // Carry over current ongoing usage
            if (existingSub.currentUsage) {
                currentUsage = { ...existingSub.currentUsage } as any;
            }

            // Immediately cancel the old subscription
            await this.cancelSubscription(existingSub.subscriptionId, userId, false);
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
                currentUsage,
            });
            return sub.save();
        }

        // Paid plan — create Razorpay subscription
        if (!plan.razorpayPlanId) {
            throw new BadRequestException('Plan is not configured for payments');
        }

        const subscriptionParams: any = {
            plan_id: plan.razorpayPlanId,
            total_count: plan.period === 'yearly' ? 10 : 120, // ~10 years
            customer_notify: 1,
            notes: {
                userId,
                planId: String(plan._id),
                planName: plan.name,
            },
        };

        // Handle dynamic trial period
        if (plan.trialDays && plan.trialDays > 0) {
            const startAt = Math.floor((Date.now() + plan.trialDays * 24 * 60 * 60 * 1000) / 1000);
            subscriptionParams.start_at = startAt;
        }

        const rzpSub = await this.razorpayService.createSubscription(subscriptionParams);

        const sub = new this.subscriptionModel({
            subscriptionId: uuidv4(),
            razorpaySubscriptionId: rzpSub.id,
            userId: new Types.ObjectId(userId),
            planId: plan._id,
            status: 'created',
            shortUrl: rzpSub.short_url,
            paidCount: 0,
            currentUsage,
        });

        return sub.save();
    }

    async cancelSubscription(subscriptionId: string, userId?: string, cancelAtPeriodEnd = true): Promise<SubscriptionDocument> {
        // Enforce period-end cancellation to avoid refund issues, as requested.
        // Even if passed as false, we force it true unless it's a critical override.
        const forcedCancelAtPeriodEnd = true;
        const sub = await this.getSubscriptionById(subscriptionId);

        // Verify ownership if userId provided
        if (userId && String(sub.userId) !== String(userId)) {
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

        await sub.save();

        if (!cancelAtPeriodEnd) {
            await this.downgradeUsageLimits(sub.userId.toString());
        }

        return sub;
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

    async handleInvoicePaid(payload: any): Promise<void> {
        if (!payload || !payload.id) return;

        // Find existing invoice or create new one if it hasn't been created yet by the subscription.charged event
        let invoice = await this.invoiceModel.findOne({ razorpayInvoiceId: payload.id }).exec();

        if (!invoice && payload.payment_id) {
            // Try matching by payment ID first since subscription.charged fires earlier and saves it
            invoice = await this.invoiceModel.findOne({ razorpayPaymentId: payload.payment_id }).exec();
        }

        if (invoice) {
            // Update existing invoice with new PDF receipt URL
            invoice.status = 'paid';
            if (payload.payment_id) invoice.razorpayPaymentId = payload.payment_id;
            invoice.razorpayInvoiceId = payload.id;
            invoice.receiptUrl = payload.short_url;
            await invoice.save();
            this.logger.log(`Invoice updated with receipt URL: ${invoice.invoiceId}`);
        } else {
            // Fallback: If subscription.charged missed it, create it here
            const sub = await this.subscriptionModel.findOne({ razorpaySubscriptionId: payload.subscription_id }).exec();
            if (sub) {
                const plan = sub.planId as any;
                await this.invoiceModel.create({
                    invoiceId: uuidv4(),
                    razorpayInvoiceId: payload.id,
                    razorpayPaymentId: payload.payment_id,
                    subscriptionId: sub._id,
                    userId: sub.userId,
                    planId: plan._id || sub.planId,
                    amount: payload.amount || 0,
                    currency: payload.currency || 'INR',
                    status: 'paid',
                    receiptUrl: payload.short_url,
                    paidAt: new Date(),
                });
                this.logger.log(`Invoice created from invoice.paid webhook: ${payload.id}`);
            }
        }
    }

    // ============ USAGE TRACKING ============

    async incrementUsage(userId: string, field: keyof Subscription['currentUsage']): Promise<void> {
        const sub = await this.getActiveSubscription(userId);
        if (sub) {
            await this.subscriptionModel.updateOne(
                { _id: sub._id },
                { $inc: { [`currentUsage.${field}`]: 1 } },
            ).exec();
        }
    }

    async decrementUsage(userId: string, field: keyof Subscription['currentUsage']): Promise<void> {
        const sub = await this.getActiveSubscription(userId);
        if (sub) {
            await this.subscriptionModel.updateOne(
                { _id: sub._id, [`currentUsage.${field}`]: { $gt: 0 } },
                { $inc: { [`currentUsage.${field}`]: -1 } },
            ).exec();
        }
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

    /**
     * Recalculate resource-type usage (sites, webhooks) from actual DB counts.
     * This reconciles any drift between the counter and reality.
     */
    async recalculateUsage(userId: string): Promise<void> {
        const sub = await this.getActiveSubscription(userId);
        if (!sub) return;

        const [actualSites, actualWebhooks] = await Promise.all([
            this.siteModel.countDocuments({ userId: new Types.ObjectId(userId), isActive: true }).exec(),
            this.webhookModel.countDocuments({ userId: new Types.ObjectId(userId), isActive: true }).exec(),
        ]);

        sub.currentUsage.sitesCreated = actualSites;
        sub.currentUsage.webhooksCreated = actualWebhooks;
        sub.markModified('currentUsage');
        await sub.save();
        this.logger.debug(`Recalculated usage for user ${userId}: sites=${actualSites}, webhooks=${actualWebhooks}`);
    }

    /**
     * Change a user's subscription plan (upgrade or downgrade).
     * Cancels the current subscription and creates a new one.
     */
    async changePlan(userId: string, newPlanId: string): Promise<SubscriptionDocument> {
        const newPlan = await this.planModel.findById(newPlanId).exec();
        if (!newPlan || !newPlan.isActive) throw new BadRequestException('Plan not found or inactive');

        if (newPlan.isCustom && String(newPlan.assignedUserId) !== String(userId)) {
            throw new ForbiddenException('This plan is not available to you');
        }

        const existingSub = await this.getActiveSubscription(userId);
        if (!existingSub) throw new BadRequestException('No active subscription to change from');

        const existingPlan = existingSub.planId as unknown as PlanDocument;
        if (String(existingPlan._id) === String(newPlan._id)) {
            throw new BadRequestException('You are already subscribed to this plan.');
        }

        // If both are paid plans, use Razorpay's update API for pro-rata upgrade/downgrade
        if (existingSub.razorpaySubscriptionId && newPlan.razorpayPlanId) {
            await this.razorpayService.updateSubscription(existingSub.razorpaySubscriptionId, {
                plan_id: newPlan.razorpayPlanId,
            });

            existingSub.planId = newPlan._id;
            // Note: status remains 'active', and Razorpay will handle prorated billing.
            // We'll catch status updates via webhooks if they happen.

            // Enforce limits immediately for downgrades
            if (newPlan.amount < existingPlan.amount) {
                await this.downgradeUsageLimits(userId);
                await this.recalculateUsage(userId);
            }

            return existingSub.save();
        }

        // Fallback: If one of them is Free, use the old cancel/create flow
        // The current createSubscription already handles carrying over usage and cancelling old subs.
        return this.createSubscription(userId, newPlanId);
    }

    // ============ CRON HELPERS ============

    /**
     * Reset consumption-only metrics for subscriptions whose billing period has ended.
     * This is a safety-net for cases where the Razorpay subscription.charged webhook was missed.
     * Resource metrics (sites, webhooks) are NOT reset as they persist across billing cycles.
     */
    async resetExpiredBillingCycleUsage(): Promise<number> {
        const now = new Date();
        const result = await this.subscriptionModel.updateMany(
            {
                status: 'active',
                currentPeriodEnd: { $lt: now },
                // Only reset if consumption metrics are non-zero (avoid unnecessary writes)
                $or: [
                    { 'currentUsage.sessionsTracked': { $gt: 0 } },
                    { 'currentUsage.aiCallsMade': { $gt: 0 } },
                    { 'currentUsage.crawlPagesUsed': { $gt: 0 } },
                ],
            },
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

    /**
     * Recalculate usage for all active subscriptions (daily integrity check).
     */
    async recalculateAllUsage(): Promise<number> {
        const subs = await this.subscriptionModel.find({ status: 'active' }).exec();
        let updated = 0;
        for (const sub of subs) {
            try {
                await this.recalculateUsage(sub.userId.toString());
                updated++;
            } catch (error: any) {
                this.logger.warn(`Failed to recalculate usage for user ${sub.userId}: ${error.message}`);
            }
        }
        return updated;
    }

    async cleanupStaleSubscriptions(): Promise<number> {
        const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
        const result = await this.subscriptionModel.updateMany(
            { status: 'created', createdAt: { $lt: oneDayAgo } },
            { $set: { status: 'expired' } },
        ).exec();
        return result.modifiedCount;
    }

    private async downgradeUsageLimits(userId: string): Promise<void> {
        try {
            const sub = await this.getActiveSubscription(userId);
            // If they have no active subscription at all (e.g., free tier was deleted), disable everything
            const plan = sub ? (sub.planId as unknown as PlanDocument) : null;
            const maxSites = plan?.features ? (plan.features as any).maxSites || 0 : 0;
            const maxWebhooks = plan?.features ? (plan.features as any).maxWebhooks || 0 : 0;

            // Enforce Sites Limit
            // Unlimited is -1
            if (maxSites !== -1) {
                const activeSites = await this.siteModel.find({ userId: new Types.ObjectId(userId), isActive: true }).sort({ createdAt: 1 }).exec();
                if (activeSites.length > maxSites) {
                    const sitesToDisable = activeSites.slice(maxSites); // Keep only the oldest `maxSites`
                    for (const site of sitesToDisable) {
                        site.isActive = false;
                        await site.save();
                    }
                    this.logger.log(`Downgraded ${sitesToDisable.length} sites for user ${userId}`);
                }
            }

            // Enforce Webhooks Limit
            if (maxWebhooks !== -1) {
                const activeWebhooks = await this.webhookModel.find({ userId: new Types.ObjectId(userId), isActive: true }).sort({ createdAt: 1 }).exec();
                if (activeWebhooks.length > maxWebhooks) {
                    const webhooksToDisable = activeWebhooks.slice(maxWebhooks); // Keep only the oldest `maxWebhooks`
                    for (const webhook of webhooksToDisable) {
                        webhook.isActive = false;
                        await webhook.save();
                    }
                    this.logger.log(`Downgraded ${webhooksToDisable.length} webhooks for user ${userId}`);
                }
            }

        } catch (error: any) {
            this.logger.error(`Failed to apply downgrade limits for user ${userId}: ${error.message}`);
        }
    }

    async expireCompletedSubscriptions(): Promise<number> {
        const now = new Date();

        // Find them first so we can downgrade their usage limits
        const expiringSubs = await this.subscriptionModel.find({
            status: 'active',
            cancelAtPeriodEnd: true,
            currentPeriodEnd: { $lt: now },
        }).exec();

        if (expiringSubs.length === 0) return 0;

        const result = await this.subscriptionModel.updateMany(
            { _id: { $in: expiringSubs.map(s => s._id) } },
            { $set: { status: 'cancelled', endedAt: now } },
        ).exec();

        // After updating the status to cancelled, enforce downgrades
        for (const sub of expiringSubs) {
            await this.downgradeUsageLimits(sub.userId.toString());
        }

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
