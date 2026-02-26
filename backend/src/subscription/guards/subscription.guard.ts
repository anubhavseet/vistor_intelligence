import { Injectable, CanActivate, ExecutionContext, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { GqlExecutionContext } from '@nestjs/graphql';
import { SubscriptionService } from '../subscription.service';
import { REQUIRES_FEATURE_KEY } from '../decorators/requires-feature.decorator';
import { REQUIRES_BOOLEAN_FEATURE_KEY } from '../decorators/requires-boolean-feature.decorator';

@Injectable()
export class SubscriptionGuard implements CanActivate {
    constructor(
        private reflector: Reflector,
        private subscriptionService: SubscriptionService,
    ) { }

    async canActivate(context: ExecutionContext): Promise<boolean> {
        const numericFeature = this.reflector.get<string>(REQUIRES_FEATURE_KEY, context.getHandler());
        const booleanFeature = this.reflector.get<string>(REQUIRES_BOOLEAN_FEATURE_KEY, context.getHandler());

        if (!numericFeature && !booleanFeature) return true; // No feature requirement

        const ctx = GqlExecutionContext.create(context);
        const user = ctx.getContext().req?.user;
        if (!user?.userId) return true; // Let auth guard handle this

        // Admin users bypass subscription limits
        if (user.role === 'admin') return true;

        // Check numeric feature limit (e.g., maxSites, maxSessionsPerMonth)
        if (numericFeature) {
            const check = await this.subscriptionService.checkFeatureLimit(user.userId, numericFeature);
            if (!check.allowed) {
                throw new ForbiddenException(
                    `Subscription limit reached. Your plan allows ${check.limit} ${numericFeature.replace('max', '').replace(/([A-Z])/g, ' $1').trim().toLowerCase()}. ` +
                    `Currently used: ${check.current}. Please upgrade your plan.`,
                );
            }
        }

        // Check boolean feature flag (e.g., enableGeoLocation, enableUiInjection)
        if (booleanFeature) {
            const allowed = await this.subscriptionService.checkBooleanFeature(user.userId, booleanFeature);
            if (!allowed) {
                throw new ForbiddenException(
                    `This feature requires a plan with ${booleanFeature.replace('enable', '').replace(/([A-Z])/g, ' $1').trim().toLowerCase()} enabled. Please upgrade your plan.`,
                );
            }
        }

        return true;
    }
}
