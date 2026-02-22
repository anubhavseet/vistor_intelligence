import { Controller, Post, Req, Res, Logger, RawBodyRequest } from '@nestjs/common';
import { Request, Response } from 'express';
import { RazorpayService } from './razorpay.service';
import { SubscriptionService } from './subscription.service';

@Controller('api/razorpay')
export class WebhookController {
    private readonly logger = new Logger(WebhookController.name);

    constructor(
        private razorpayService: RazorpayService,
        private subscriptionService: SubscriptionService,
    ) { }

    @Post('webhook')
    async handleWebhook(
        @Req() req: RawBodyRequest<Request>,
        @Res() res: Response,
    ): Promise<void> {
        const signature = req.headers['x-razorpay-signature'] as string;
        const rawBody = req.rawBody?.toString() || JSON.stringify(req.body);

        // Verify webhook signature
        if (signature && !this.razorpayService.verifyWebhookSignature(rawBody, signature)) {
            this.logger.warn('Invalid webhook signature');
            res.status(400).json({ error: 'Invalid signature' });
            return;
        }

        const payload = req.body;
        const event = payload?.event;
        const subscriptionEntity = payload?.payload?.subscription?.entity;

        if (!event || !subscriptionEntity) {
            this.logger.warn(`Webhook received with missing data. Event: ${event}`);
            res.status(200).json({ status: 'ignored' });
            return;
        }

        const razorpaySubId = subscriptionEntity.id;
        this.logger.log(`Webhook received: ${event} for subscription ${razorpaySubId}`);

        try {
            switch (event) {
                case 'subscription.authenticated':
                    await this.subscriptionService.handleSubscriptionAuthenticated(razorpaySubId);
                    break;
                case 'subscription.activated':
                    await this.subscriptionService.handleSubscriptionActivated(razorpaySubId, subscriptionEntity);
                    break;
                case 'subscription.charged':
                    await this.subscriptionService.handleSubscriptionCharged(razorpaySubId, {
                        ...subscriptionEntity,
                        payment_id: payload?.payload?.payment?.entity?.id,
                        amount: payload?.payload?.payment?.entity?.amount,
                    });
                    break;
                case 'subscription.completed':
                    await this.subscriptionService.handleSubscriptionCompleted(razorpaySubId);
                    break;
                case 'subscription.cancelled':
                    await this.subscriptionService.handleSubscriptionCancelled(razorpaySubId);
                    break;
                case 'subscription.paused':
                    await this.subscriptionService.handleSubscriptionPaused(razorpaySubId);
                    break;
                case 'subscription.resumed':
                    await this.subscriptionService.handleSubscriptionResumed(razorpaySubId);
                    break;
                case 'subscription.halted':
                    await this.subscriptionService.handleSubscriptionHalted(razorpaySubId);
                    break;
                case 'subscription.pending':
                    await this.subscriptionService.handleSubscriptionPending(razorpaySubId);
                    break;
                default:
                    this.logger.log(`Unhandled webhook event: ${event}`);
            }

            res.status(200).json({ status: 'ok' });
        } catch (error: any) {
            this.logger.error(`Webhook processing error: ${error.message}`);
            // Return 200 to prevent Razorpay retries for logic errors
            res.status(200).json({ status: 'error', message: error.message });
        }
    }
}
