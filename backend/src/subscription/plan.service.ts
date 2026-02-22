import { Injectable, NotFoundException, BadRequestException, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { v4 as uuidv4 } from 'uuid';
import { Plan, PlanDocument } from '../common/schemas/plan.schema';
import { RazorpayService } from './razorpay.service';

@Injectable()
export class PlanService {
    private readonly logger = new Logger(PlanService.name);

    constructor(
        @InjectModel(Plan.name) private planModel: Model<PlanDocument>,
        private razorpayService: RazorpayService,
    ) { }

    async findAll(includeInactive = false): Promise<PlanDocument[]> {
        const filter: any = {};
        if (!includeInactive) filter.isActive = true;
        return this.planModel.find(filter).sort({ sortOrder: 1, amount: 1 }).exec();
    }

    async findPublicPlans(): Promise<PlanDocument[]> {
        return this.planModel
            .find({ isActive: true, isCustom: false })
            .sort({ sortOrder: 1, amount: 1 })
            .exec();
    }

    async findCustomPlansForUser(userId: string): Promise<PlanDocument[]> {
        return this.planModel
            .find({ isActive: true, isCustom: true, assignedUserId: userId })
            .exec();
    }

    async findAvailablePlansForUser(userId: string): Promise<PlanDocument[]> {
        const publicPlans = await this.findPublicPlans();
        const customPlans = await this.findCustomPlansForUser(userId);
        return [...publicPlans, ...customPlans];
    }

    async findById(id: string): Promise<PlanDocument> {
        const plan = await this.planModel.findById(id).exec();
        if (!plan) throw new NotFoundException(`Plan not found`);
        return plan;
    }

    async findByPlanId(planId: string): Promise<PlanDocument> {
        const plan = await this.planModel.findOne({ planId }).exec();
        if (!plan) throw new NotFoundException(`Plan not found`);
        return plan;
    }

    async createPlan(input: {
        name: string;
        description?: string;
        amount: number;
        period?: 'monthly' | 'yearly';
        interval?: number;
        isCustom?: boolean;
        assignedUserId?: string;
        features?: Partial<Plan['features']>;
        sortOrder?: number;
    }): Promise<PlanDocument> {
        const planId = uuidv4();
        let razorpayPlanId: string | undefined;

        // Only create Razorpay plan for paid plans
        if (input.amount > 0) {
            try {
                const rzpPlan = await this.razorpayService.createPlan({
                    period: input.period || 'monthly',
                    interval: input.interval || 1,
                    item: {
                        name: input.name,
                        amount: input.amount,
                        currency: 'INR',
                        description: input.description || input.name,
                    },
                });
                razorpayPlanId = rzpPlan.id;
            } catch (error: any) {
                this.logger.error(`Razorpay plan creation failed: ${error.message}`);
                throw new BadRequestException(`Failed to create plan on Razorpay: ${error.message}`);
            }
        }

        const plan = new this.planModel({
            planId,
            razorpayPlanId,
            name: input.name,
            description: input.description || '',
            amount: input.amount,
            currency: 'INR',
            period: input.period || 'monthly',
            interval: input.interval || 1,
            isActive: true,
            isCustom: input.isCustom || false,
            assignedUserId: new Types.ObjectId(input.assignedUserId) || undefined,
            features: {
                maxSites: 1,
                maxWebhooks: 1,
                maxSessionsPerMonth: 1000,
                maxAiCallsPerMonth: 50,
                maxCrawlPages: 10,
                dataRetentionDays: 7,
                enableBehaviorTracking: false,
                enableGeoLocation: false,
                enableUiInjection: false,
                enableEnrichment: false,
                enableCustomWebhooks: false,
                ...input.features,
            },
            sortOrder: input.sortOrder ?? 0,
        });

        return plan.save();
    }

    async updatePlan(id: string, input: {
        name?: string;
        description?: string;
        isActive?: boolean;
        features?: Partial<Plan['features']>;
        sortOrder?: number;
    }): Promise<PlanDocument> {
        const plan = await this.findById(id);

        if (input.name !== undefined) plan.name = input.name;
        if (input.description !== undefined) plan.description = input.description;
        if (input.isActive !== undefined) plan.isActive = input.isActive;
        if (input.sortOrder !== undefined) plan.sortOrder = input.sortOrder;

        if (input.features) {
            plan.features = { ...plan.features, ...input.features } as any;
            plan.markModified('features');
        }

        return plan.save();
    }

    async deletePlan(id: string): Promise<boolean> {
        const plan = await this.findById(id);
        // Soft delete - just deactivate
        plan.isActive = false;
        await plan.save();
        return true;
    }

    /**
     * Seed default plans if none exist
     */
    async seedDefaultPlans(): Promise<void> {
        const count = await this.planModel.countDocuments().exec();
        if (count > 0) return;

        this.logger.log('Seeding default plans...');

        // Free plan (no Razorpay plan needed)
        await this.planModel.create({
            planId: uuidv4(),
            name: 'Free',
            description: 'Get started with basic visitor intelligence',
            amount: 0,
            currency: 'INR',
            period: 'monthly',
            interval: 1,
            isActive: true,
            isCustom: false,
            sortOrder: 0,
            features: {
                maxSites: 1,
                maxWebhooks: 1,
                maxSessionsPerMonth: 1000,
                maxAiCallsPerMonth: 50,
                maxCrawlPages: 10,
                dataRetentionDays: 7,
                enableBehaviorTracking: false,
                enableGeoLocation: false,
                enableUiInjection: false,
                enableEnrichment: false,
                enableCustomWebhooks: false,
            },
        });

        this.logger.log('Default Free plan seeded');
    }
}
