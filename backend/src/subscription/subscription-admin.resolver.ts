import { Resolver, Query, Mutation, Args } from '@nestjs/graphql';
import { UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { SubscriptionService } from './subscription.service';
import { PlanService } from './plan.service';
import { AdminSubscriptionType, SubscriptionType, PlanType } from './dto/subscription.types';

import {
    mapPlanToGraphQL,
    mapSubscriptionToGraphQL,
    mapAdminSubscriptionToGraphQL,
} from './subscription.mapper';

@Resolver(() => AdminSubscriptionType)
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('admin')
export class SubscriptionAdminResolver {
    constructor(
        private subscriptionService: SubscriptionService,
        private planService: PlanService,
    ) { }

    @Query(() => [AdminSubscriptionType], { name: 'adminGetAllSubscriptions' })
    async getAllSubscriptions(
        @Args('status', { nullable: true }) status?: string,
    ): Promise<AdminSubscriptionType[]> {
        const subs = await this.subscriptionService.getAllSubscriptions({ status });
        return subs.map(mapAdminSubscriptionToGraphQL);
    }

    @Mutation(() => SubscriptionType, { name: 'adminCancelSubscription' })
    async adminCancelSubscription(
        @Args('subscriptionId') subscriptionId: string,
        @Args('cancelAtPeriodEnd', { defaultValue: true }) cancelAtPeriodEnd: boolean,
    ): Promise<SubscriptionType> {
        const sub = await this.subscriptionService.cancelSubscription(subscriptionId, undefined, cancelAtPeriodEnd);
        return mapSubscriptionToGraphQL(sub);
    }

    @Mutation(() => PlanType, { name: 'adminAssignCustomPlan' })
    async adminAssignCustomPlan(
        @Args('planId') planId: string,
        @Args('userId') userId: string,
    ): Promise<PlanType> {
        // Find existing plan
        const existing = await this.planService.findById(planId);

        // Clone it as a custom plan specifically for this user
        const clonedInput = {
            name: `${existing.name} (Custom)`,
            description: existing.description,
            amount: existing.amount,
            period: existing.period as any,
            interval: existing.interval,
            isCustom: true,
            assignedUserId: userId,
            features: existing.features,
            trialDays: existing.trialDays,
            sortOrder: existing.sortOrder,
        };

        const customPlan = await this.planService.createPlan(clonedInput);
        return mapPlanToGraphQL(customPlan);
    }
}
