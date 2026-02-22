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

function mapSubscriptionToGraphQL(sub: any): SubscriptionType {
    const plan = sub.planId && typeof sub.planId === 'object' ? sub.planId : null;
    return {
        id: sub._id?.toString() || sub.id,
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
            sitesCreated: 0,
            webhooksCreated: 0,
            sessionsTracked: 0,
            aiCallsMade: 0,
            crawlPagesUsed: 0,
        },
        createdAt: sub.createdAt,
        updatedAt: sub.updatedAt,
    };
}

function mapInvoiceToGraphQL(invoice: any): InvoiceType {
    const plan = invoice.planId && typeof invoice.planId === 'object' ? invoice.planId : null;
    return {
        id: invoice._id?.toString() || invoice.id,
        invoiceId: invoice.invoiceId,
        razorpayPaymentId: invoice.razorpayPaymentId,
        userId: invoice.userId?.toString(),
        plan: plan ? mapPlanToGraphQL(plan) : undefined,
        amount: invoice.amount,
        currency: invoice.currency,
        status: invoice.status,
        billingPeriodStart: invoice.billingPeriodStart,
        billingPeriodEnd: invoice.billingPeriodEnd,
        paidAt: invoice.paidAt,
        createdAt: invoice.createdAt,
    };
}

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
}
