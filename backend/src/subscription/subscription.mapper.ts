import {
    SubscriptionType,
    PlanType,
    InvoiceType,
    AdminSubscriptionType,
} from './dto/subscription.types';

export function mapPlanToGraphQL(plan: any): PlanType {
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
        trialDays: plan.trialDays || 0,
        sortOrder: plan.sortOrder || 0,
        createdAt: plan.createdAt,
        updatedAt: plan.updatedAt,
    };
}

export function mapSubscriptionToGraphQL(sub: any): SubscriptionType {
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

export function mapInvoiceToGraphQL(invoice: any): InvoiceType {
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
        receiptUrl: invoice.receiptUrl,
        createdAt: invoice.createdAt,
    };
}

export function mapAdminSubscriptionToGraphQL(sub: any): AdminSubscriptionType {
    const user = sub.userId && typeof sub.userId === 'object' ? sub.userId : null;
    return {
        ...mapSubscriptionToGraphQL(sub),
        userName: user?.name,
        userEmail: user?.email,
    };
}
