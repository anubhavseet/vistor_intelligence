import { Injectable, CanActivate, ExecutionContext, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { GqlExecutionContext } from '@nestjs/graphql';
import { SubscriptionService } from '../subscription.service';
import { REQUIRES_FEATURE_KEY } from '../decorators/requires-feature.decorator';

@Injectable()
export class SubscriptionGuard implements CanActivate {
    constructor(
        private reflector: Reflector,
        private subscriptionService: SubscriptionService,
    ) { }

    async canActivate(context: ExecutionContext): Promise<boolean> {
        const feature = this.reflector.get<string>(REQUIRES_FEATURE_KEY, context.getHandler());
        if (!feature) return true; // No feature requirement

        const ctx = GqlExecutionContext.create(context);
        const user = ctx.getContext().req?.user;
        if (!user?.userId) return true; // Let auth guard handle this

        // Admin users bypass subscription limits
        if (user.role === 'admin') return true;

        const check = await this.subscriptionService.checkFeatureLimit(user.userId, feature);

        if (!check.allowed) {
            throw new ForbiddenException(
                `Subscription limit reached. Your plan allows ${check.limit} ${feature.replace('max', '').replace(/([A-Z])/g, ' $1').trim().toLowerCase()}. ` +
                `Currently used: ${check.current}. Please upgrade your plan.`,
            );
        }

        return true;
    }
}
