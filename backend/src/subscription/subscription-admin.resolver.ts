import { Resolver, Query, Mutation, Args } from '@nestjs/graphql';
import { UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { SubscriptionService } from './subscription.service';
import { AdminSubscriptionType, SubscriptionType, PlanType } from './dto/subscription.types';

function mapPlanToGraphQL(plan: any): PlanType {
    return {
        id: plan._id?.toString() || plan.id,
        planId: plan.planId,
        razorpayPlanId: plan.razorpayPlanId,
        name: plan.name,
        description: plan.description || '',
        amount: plan.amount,
        currency: plan.currency,
        period: plan.period,
        interval: plan.interval,
        isActive: plan.isActive,
        isCustom: plan.isCustom || false,
        assignedUserId: plan.assignedUserId?.toString(),
        features: plan.features || {},
        sortOrder: plan.sortOrder || 0,
        createdAt: plan.createdAt,
        updatedAt: plan.updatedAt,
    };
}

@Resolver(() => AdminSubscriptionType)
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('admin')
export class SubscriptionAdminResolver {
    constructor(private subscriptionService: SubscriptionService) { }

    @Query(() => [AdminSubscriptionType], { name: 'adminGetAllSubscriptions' })
    async getAllSubscriptions(
        @Args('status', { nullable: true }) status?: string,
    ): Promise<AdminSubscriptionType[]> {
        const subs = await this.subscriptionService.getAllSubscriptions({ status });
        return subs.map((sub: any) => {
            const plan = sub.planId && typeof sub.planId === 'object' ? sub.planId : null;
            const user = sub.userId && typeof sub.userId === 'object' ? sub.userId : null;
            return {
                id: sub._id?.toString(),
                subscriptionId: sub.subscriptionId,
                razorpaySubscriptionId: sub.razorpaySubscriptionId,
                userId: sub.userId?._id?.toString() || sub.userId?.toString(),
                plan: plan ? mapPlanToGraphQL(plan) : undefined,
                status: sub.status,
                currentPeriodStart: sub.currentPeriodStart,
                currentPeriodEnd: sub.currentPeriodEnd,
                startedAt: sub.startedAt,
                endedAt: sub.endedAt,
                cancelledAt: sub.cancelledAt,
                cancelAtPeriodEnd: sub.cancelAtPeriodEnd || false,
                paidCount: sub.paidCount || 0,
                shortUrl: sub.shortUrl,
                currentUsage: sub.currentUsage || {
                    sitesCreated: 0, webhooksCreated: 0, sessionsTracked: 0,
                    aiCallsMade: 0, crawlPagesUsed: 0,
                },
                createdAt: sub.createdAt,
                updatedAt: sub.updatedAt,
                userName: user?.name,
                userEmail: user?.email,
            };
        });
    }

    @Mutation(() => SubscriptionType, { name: 'adminCancelSubscription' })
    async adminCancelSubscription(
        @Args('subscriptionId') subscriptionId: string,
        @Args('cancelAtPeriodEnd', { defaultValue: false }) cancelAtPeriodEnd: boolean,
    ): Promise<SubscriptionType> {
        const sub = await this.subscriptionService.cancelSubscription(subscriptionId, undefined, cancelAtPeriodEnd);
        const plan = sub.planId && typeof sub.planId === 'object' ? sub.planId : null;
        return {
            id: sub._id?.toString(),
            subscriptionId: sub.subscriptionId,
            razorpaySubscriptionId: sub.razorpaySubscriptionId,
            userId: sub.userId?.toString(),
            plan: plan ? mapPlanToGraphQL(plan) : undefined,
            status: sub.status,
            currentPeriodStart: sub.currentPeriodStart,
            currentPeriodEnd: sub.currentPeriodEnd,
            startedAt: sub.startedAt,
            endedAt: sub.endedAt,
            cancelledAt: sub.cancelledAt,
            cancelAtPeriodEnd: sub.cancelAtPeriodEnd || false,
            paidCount: sub.paidCount || 0,
            shortUrl: sub.shortUrl,
            currentUsage: sub.currentUsage || {
                sitesCreated: 0, webhooksCreated: 0, sessionsTracked: 0,
                aiCallsMade: 0, crawlPagesUsed: 0,
            },
            createdAt: (sub as any).createdAt,
            updatedAt: (sub as any).updatedAt,
        };
    }
}
