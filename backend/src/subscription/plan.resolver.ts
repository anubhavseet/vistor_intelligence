import { Resolver, Query, Mutation, Args, ID } from '@nestjs/graphql';
import { UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { Public } from '../auth/decorators/public.decorator';
import { PlanService } from './plan.service';
import { PlanType, CreatePlanInput, UpdatePlanInput } from './dto/subscription.types';

import { mapPlanToGraphQL } from './subscription.mapper';

@Resolver(() => PlanType)
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('admin')
export class PlanResolver {
    constructor(private planService: PlanService) { }

    @Public()
    @Query(() => [PlanType], { name: 'getPublicPlans' })
    async getPublicPlans(): Promise<PlanType[]> {
        const plans = await this.planService.findPublicPlans(); // Fetch only public, non-custom, active plans
        return plans.map(mapPlanToGraphQL);
    }

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
            trialDays: input.trialDays,
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
            trialDays: input.trialDays,
            sortOrder: input.sortOrder,
        });
        return mapPlanToGraphQL(plan);
    }

    @Mutation(() => Boolean, { name: 'adminDeletePlan' })
    async deletePlan(@Args('id', { type: () => ID }) id: string): Promise<boolean> {
        return this.planService.deletePlan(id);
    }
}
