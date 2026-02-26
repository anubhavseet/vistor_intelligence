import { Resolver, Query, Mutation, Args } from '@nestjs/graphql';
import { UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { SubscriptionService } from './subscription.service';
import { PlanService } from './plan.service';
import { RazorpayService } from './razorpay.service';
import {
    SubscriptionType,
    PlanType,
    InvoiceType,
    CreateSubscriptionResponse,
    FeatureLimitCheckResponse,
} from './dto/subscription.types';

import {
    mapPlanToGraphQL,
    mapSubscriptionToGraphQL,
    mapInvoiceToGraphQL,
} from './subscription.mapper';

@Resolver(() => SubscriptionType)
@UseGuards(JwtAuthGuard)
export class SubscriptionResolver {
    constructor(
        private subscriptionService: SubscriptionService,
        private planService: PlanService,
        private razorpayService: RazorpayService,
    ) { }

    @Query(() => SubscriptionType, { name: 'getMySubscription', nullable: true })
    async getMySubscription(@CurrentUser() user: any): Promise<SubscriptionType | null> {
        const sub = await this.subscriptionService.getActiveSubscription(user.userId);
        if (!sub) return null;
        return mapSubscriptionToGraphQL(sub);
    }

    @Query(() => [PlanType], { name: 'getAvailablePlans' })
    async getAvailablePlans(@CurrentUser() user: any): Promise<PlanType[]> {
        const plans = await this.planService.findAvailablePlansForUser(user.userId);
        return plans.map(mapPlanToGraphQL);
    }

    @Query(() => [InvoiceType], { name: 'getMyInvoices' })
    async getMyInvoices(@CurrentUser() user: any): Promise<InvoiceType[]> {
        const invoices = await this.subscriptionService.getUserInvoices(user.userId);
        return invoices.map(mapInvoiceToGraphQL);
    }

    @Query(() => FeatureLimitCheckResponse, { name: 'checkFeatureLimit' })
    async checkFeatureLimit(
        @CurrentUser() user: any,
        @Args('feature') feature: string,
    ): Promise<FeatureLimitCheckResponse> {
        return this.subscriptionService.checkFeatureLimit(user.userId, feature);
    }

    @Query(() => String, { name: 'getInvoiceDownloadUrl' })
    async getInvoiceDownloadUrl(
        @CurrentUser() user: any,
        @Args('invoiceId') invoiceId: string,
    ): Promise<string> {
        return this.subscriptionService.getInvoiceDownloadUrl(user.userId, invoiceId);
    }

    @Mutation(() => CreateSubscriptionResponse, { name: 'createSubscription' })
    async createSubscription(
        @CurrentUser() user: any,
        @Args('planId') planId: string,
    ): Promise<CreateSubscriptionResponse> {
        const sub = await this.subscriptionService.createSubscription(user.userId, planId);
        return {
            subscriptionId: sub.subscriptionId,
            razorpaySubscriptionId: sub.razorpaySubscriptionId,
            shortUrl: sub.shortUrl,
            razorpayKeyId: this.razorpayService.getKeyId(),
            status: sub.status,
        };
    }

    @Mutation(() => SubscriptionType, { name: 'cancelSubscription' })
    async cancelSubscription(
        @CurrentUser() user: any,
        @Args('subscriptionId') subscriptionId: string,
        @Args('cancelAtPeriodEnd', { defaultValue: true }) cancelAtPeriodEnd: boolean,
    ): Promise<SubscriptionType> {
        const sub = await this.subscriptionService.cancelSubscription(subscriptionId, user.userId, cancelAtPeriodEnd);
        return mapSubscriptionToGraphQL(sub);
    }

    @Mutation(() => SubscriptionType, { name: 'cancelMySubscription' })
    async cancelMySubscription(
        @CurrentUser() user: any,
    ): Promise<SubscriptionType> {
        const activeSub = await this.subscriptionService.getActiveSubscription(user.userId);
        if (!activeSub) {
            throw new Error('No active subscription found');
        }

        // Always cancel at period end for user-initiated cancellations to allow graceful downgrade
        const sub = await this.subscriptionService.cancelSubscription(activeSub.subscriptionId, user.userId, true);
        return mapSubscriptionToGraphQL(sub);
    }

    @Mutation(() => SubscriptionType, { name: 'pauseSubscription' })
    async pauseSubscription(
        @CurrentUser() user: any,
        @Args('subscriptionId') subscriptionId: string,
    ): Promise<SubscriptionType> {
        const sub = await this.subscriptionService.pauseSubscription(subscriptionId, user.userId);
        return mapSubscriptionToGraphQL(sub);
    }

    @Mutation(() => SubscriptionType, { name: 'resumeSubscription' })
    async resumeSubscription(
        @CurrentUser() user: any,
        @Args('subscriptionId') subscriptionId: string,
    ): Promise<SubscriptionType> {
        const sub = await this.subscriptionService.resumeSubscription(subscriptionId, user.userId);
        return mapSubscriptionToGraphQL(sub);
    }

    @Mutation(() => CreateSubscriptionResponse, { name: 'changePlan' })
    async changePlan(
        @CurrentUser() user: any,
        @Args('newPlanId') newPlanId: string,
    ): Promise<CreateSubscriptionResponse> {
        const sub = await this.subscriptionService.changePlan(user.userId, newPlanId);
        return {
            subscriptionId: sub.subscriptionId,
            razorpaySubscriptionId: sub.razorpaySubscriptionId,
            shortUrl: sub.shortUrl,
            razorpayKeyId: this.razorpayService.getKeyId(),
            status: sub.status,
        };
    }
}
