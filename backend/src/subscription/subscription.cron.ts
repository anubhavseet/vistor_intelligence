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
     * Reset monthly usage counters on the 1st of every month at 00:05
     */
    @Cron('5 0 1 * *')
    async resetMonthlyUsage(): Promise<void> {
        this.logger.log('Running monthly usage reset...');
        const count = await this.subscriptionService.resetMonthlyUsage();
        this.logger.log(`Monthly usage reset complete. ${count} subscriptions updated.`);
    }

    /**
     * Clean up stale "created" subscriptions and expire completed ones
     * Runs every hour
     */
    @Cron(CronExpression.EVERY_HOUR)
    async cleanupSubscriptions(): Promise<void> {
        const stale = await this.subscriptionService.cleanupStaleSubscriptions();
        const expired = await this.subscriptionService.expireCompletedSubscriptions();
        if (stale > 0 || expired > 0) {
            this.logger.log(`Cleanup: ${stale} stale subs expired, ${expired} period-end cancellations processed.`);
        }
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
