import { Resolver, Query, Mutation, Args, ID } from '@nestjs/graphql';
import { UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { PlanService } from './plan.service';
import { PlanType, CreatePlanInput, UpdatePlanInput } from './dto/subscription.types';

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

@Resolver(() => PlanType)
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('admin')
export class PlanResolver {
    constructor(private planService: PlanService) { }

    @Query(() => [PlanType], { name: 'adminGetAllPlans' })
    async getAllPlans(): Promise<PlanType[]> {
        const plans = await this.planService.findAll(true);
        return plans.map(mapPlanToGraphQL);
    }

    @Mutation(() => PlanType, { name: 'adminCreatePlan' })
    async createPlan(@Args('input') input: CreatePlanInput): Promise<PlanType> {
        const plan = await this.planService.createPlan({
            name: input.name,
            description: input.description,
            amount: input.amount,
            period: input.period,
            interval: input.interval,
            isCustom: input.isCustom,
            assignedUserId: input.assignedUserId,
            features: input.features as any,
            sortOrder: input.sortOrder,
        });
        return mapPlanToGraphQL(plan);
    }

    @Mutation(() => PlanType, { name: 'adminUpdatePlan' })
    async updatePlan(
        @Args('id', { type: () => ID }) id: string,
        @Args('input') input: UpdatePlanInput,
    ): Promise<PlanType> {
        const plan = await this.planService.updatePlan(id, {
            name: input.name,
            description: input.description,
            isActive: input.isActive,
            features: input.features as any,
            sortOrder: input.sortOrder,
        });
        return mapPlanToGraphQL(plan);
    }

    @Mutation(() => Boolean, { name: 'adminDeletePlan' })
    async deletePlan(@Args('id', { type: () => ID }) id: string): Promise<boolean> {
        return this.planService.deletePlan(id);
    }
}
