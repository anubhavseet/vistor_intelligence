import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
// eslint-disable-next-line @typescript-eslint/no-var-requires
const Razorpay = require('razorpay');
import * as crypto from 'crypto';

@Injectable()
export class RazorpayService {
    private readonly logger = new Logger(RazorpayService.name);
    private razorpayInstance: any = null;
    private readonly webhookSecret: string;

    constructor(private configService: ConfigService) {
        this.webhookSecret = this.configService.get<string>('RAZORPAY_WEBHOOK_SECRET', '');
        const keyId = this.configService.get<string>('RAZORPAY_KEY_ID', '');
        if (keyId) {
            this.logger.log('Razorpay keys configured ✅');
        } else {
            this.logger.warn('Razorpay keys NOT configured — subscription payments will not work until RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET are set in .env');
        }
    }

    private get razorpay(): any {
        if (!this.razorpayInstance) {
            const keyId = this.configService.get<string>('RAZORPAY_KEY_ID', '');
            const keySecret = this.configService.get<string>('RAZORPAY_KEY_SECRET', '');
            if (!keyId || !keySecret) {
                throw new Error('Razorpay is not configured. Add RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET to your .env file.');
            }
            this.razorpayInstance = new Razorpay({ key_id: keyId, key_secret: keySecret });
        }
        return this.razorpayInstance;
    }

    getKeyId(): string {
        return this.configService.get<string>('RAZORPAY_KEY_ID', '');
    }

    // ============ PLANS ============

    async createPlan(params: {
        period: string;
        interval: number;
        item: { name: string; amount: number; currency: string; description?: string };
    }): Promise<any> {
        try {
            const plan = await this.razorpay.plans.create(params as any);
            this.logger.log(`Created Razorpay plan: ${plan.id}`);
            return plan;
        } catch (error: any) {
            this.logger.error(`Failed to create Razorpay plan: ${error.message}`);
            throw error;
        }
    }

    async fetchPlan(planId: string): Promise<any> {
        return this.razorpay.plans.fetch(planId);
    }

    async fetchAllPlans(): Promise<any> {
        return this.razorpay.plans.all();
    }

    // ============ SUBSCRIPTIONS ============

    async createSubscription(params: {
        plan_id: string;
        total_count: number;
        quantity?: number;
        customer_notify?: 0 | 1;
        start_at?: number;
        notes?: Record<string, string>;
    }): Promise<any> {
        try {
            const subscription = await this.razorpay.subscriptions.create(params);
            this.logger.log(`Created Razorpay subscription: ${subscription.id}`);
            return subscription;
        } catch (error: any) {
            this.logger.error(`Failed to create Razorpay subscription: ${error.message}`);
            throw error;
        }
    }

    async fetchSubscription(subscriptionId: string): Promise<any> {
        return this.razorpay.subscriptions.fetch(subscriptionId);
    }

    async updateSubscription(subscriptionId: string, params: {
        plan_id?: string;
        quantity?: number;
        offer_id?: string;
    }): Promise<any> {
        try {
            const result = await this.razorpay.subscriptions.update(subscriptionId, params);
            this.logger.log(`Updated Razorpay subscription: ${subscriptionId}`);
            return result;
        } catch (error: any) {
            this.logger.error(`Failed to update Razorpay subscription: ${error.message}`);
            throw error;
        }
    }

    async cancelSubscription(subscriptionId: string, cancelAtCycleEnd: boolean = false): Promise<any> {
        try {
            const result = await this.razorpay.subscriptions.cancel(subscriptionId, { cancel_at_cycle_end: cancelAtCycleEnd ? 1 : 0 });
            this.logger.log(`Cancelled Razorpay subscription: ${subscriptionId}`);
            return result;
        } catch (error: any) {
            this.logger.error(`Failed to cancel Razorpay subscription: ${error.message}`);
            throw error;
        }
    }

    async pauseSubscription(subscriptionId: string): Promise<any> {
        try {
            const result = await (this.razorpay.subscriptions as any).pause(subscriptionId, { pause_initiated_by: 'customer' });
            this.logger.log(`Paused Razorpay subscription: ${subscriptionId}`);
            return result;
        } catch (error: any) {
            this.logger.error(`Failed to pause Razorpay subscription: ${error.message}`);
            throw error;
        }
    }

    async resumeSubscription(subscriptionId: string): Promise<any> {
        try {
            const result = await (this.razorpay.subscriptions as any).resume(subscriptionId, { resume_initiated_by: 'customer' });
            this.logger.log(`Resumed Razorpay subscription: ${subscriptionId}`);
            return result;
        } catch (error: any) {
            this.logger.error(`Failed to resume Razorpay subscription: ${error.message}`);
            throw error;
        }
    }

    async fetchInvoice(invoiceId: string): Promise<any> {
        return this.razorpay.invoices.fetch(invoiceId);
    }

    async fetchSubscriptionInvoices(subscriptionId: string): Promise<any> {
        return this.razorpay.invoices.all({ subscription_id: subscriptionId });
    }

    // ============ WEBHOOK VERIFICATION ============

    verifyWebhookSignature(body: string, signature: string): boolean {
        try {
            const expectedSignature = crypto
                .createHmac('sha256', this.webhookSecret)
                .update(body)
                .digest('hex');
            return expectedSignature === signature;
        } catch (error) {
            this.logger.error('Webhook signature verification failed');
            return false;
        }
    }
}
