import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { SubscriptionService } from './subscription.service';
import { PlanService } from './plan.service';

@Injectable()
export class SubscriptionCron implements OnModuleInit {
    private readonly logger = new Logger(SubscriptionCron.name);

    constructor(
        private subscriptionService: SubscriptionService,
        private planService: PlanService,
    ) { }

    /**
     * Seed default plans immediately when the module is ready (NTH 4 fix).
     * Also runs at midnight as a safety net (see ensureDefaultPlans below).
     */
    async onModuleInit(): Promise<void> {
        await this.planService.seedDefaultPlans();
    }

    /**
     * Reset consumption metrics for subscriptions whose billing period has ended.
     * This is a safety net for missed subscription.charged webhooks.
     * Runs every hour to catch expired billing cycles promptly.
     */
    @Cron(CronExpression.EVERY_HOUR)
    async resetExpiredBillingCycleUsage(): Promise<void> {
        const count = await this.subscriptionService.resetExpiredBillingCycleUsage();
        if (count > 0) {
            this.logger.log(`Billing cycle usage reset: ${count} subscriptions had consumption metrics reset.`);
        }
    }

    /**
     * Clean up stale "created" subscriptions and expire completed ones
     * Runs every hour
     */
    @Cron('30 * * * *') // Offset by 30 min from the reset cron
    async cleanupSubscriptions(): Promise<void> {
        const stale = await this.subscriptionService.cleanupStaleSubscriptions();
        const expired = await this.subscriptionService.expireCompletedSubscriptions();
        if (stale > 0 || expired > 0) {
            this.logger.log(`Cleanup: ${stale} stale subs expired, ${expired} period-end cancellations processed.`);
        }
    }

    /**
     * Renew free plan subscriptions whose currentPeriodEnd has lapsed (Bug 6 fix).
     * Free plans are perpetual — this extends them back to 100 years from now.
     * Runs every 6 hours so the UI never shows a past renewal date.
     */
    @Cron('0 */6 * * *')
    async renewFreePlans(): Promise<void> {
        const count = await this.subscriptionService.renewFreePlanSubscriptions();
        if (count > 0) {
            this.logger.log(`Renewed ${count} free plan subscription(s) with a fresh period end.`);
        }
    }

    /**
     * Daily recalculation of resource-type usage (sites, webhooks) as an integrity check.
     * Runs at 03:00 to avoid peak hours.
     */
    @Cron('0 3 * * *')
    async recalculateUsage(): Promise<void> {
        this.logger.log('Running daily usage recalculation...');
        const count = await this.subscriptionService.recalculateAllUsage();
        this.logger.log(`Usage recalculation complete. ${count} subscriptions reconciled.`);
    }

    /**
     * Sync subscription status with Razorpay API (safety net)
     * Runs every 6 hours
     */
    @Cron('30 */6 * * *') // Offset 30min from renewFreePlans to spread DB load
    async syncWithRazorpay(): Promise<void> {
        this.logger.log('Running Razorpay sync...');
        const synced = await this.subscriptionService.syncWithRazorpay();
        if (synced > 0) {
            this.logger.log(`Razorpay sync complete. ${synced} subscriptions updated.`);
        }
    }

    /**
     * Seed default plans at midnight as a daily safety net.
     * The primary seeding now happens via onModuleInit() on startup.
     */
    @Cron(CronExpression.EVERY_DAY_AT_MIDNIGHT)
    async ensureDefaultPlans(): Promise<void> {
        await this.planService.seedDefaultPlans();
    }
}
