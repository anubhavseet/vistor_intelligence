import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { SubscriptionService } from './subscription.service';
import { PlanService } from './plan.service';

@Injectable()
export class SubscriptionCron {
    private readonly logger = new Logger(SubscriptionCron.name);

    constructor(
        private subscriptionService: SubscriptionService,
        private planService: PlanService,
    ) { }

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
    @Cron('0 */6 * * *')
    async syncWithRazorpay(): Promise<void> {
        this.logger.log('Running Razorpay sync...');
        const synced = await this.subscriptionService.syncWithRazorpay();
        if (synced > 0) {
            this.logger.log(`Razorpay sync complete. ${synced} subscriptions updated.`);
        }
    }

    /**
     * Seed default plans on application start
     */
    @Cron(CronExpression.EVERY_DAY_AT_MIDNIGHT)
    async ensureDefaultPlans(): Promise<void> {
        await this.planService.seedDefaultPlans();
    }
}
