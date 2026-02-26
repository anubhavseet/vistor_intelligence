import { Controller, Post, Req, Res, Logger, RawBodyRequest } from '@nestjs/common';
import { Request, Response } from 'express';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { RazorpayService } from './razorpay.service';
import { SubscriptionService } from './subscription.service';
import { WebhookEvent, WebhookEventDocument } from '../common/schemas/webhook-event.schema';

@Controller('razorpay')
export class WebhookController {
    private readonly logger = new Logger(WebhookController.name);

    constructor(
        private razorpayService: RazorpayService,
        private subscriptionService: SubscriptionService,
        @InjectModel(WebhookEvent.name) private webhookEventModel: Model<WebhookEventDocument>,
    ) { }

    @Post('webhook')
    async handleWebhook(
        @Req() req: RawBodyRequest<Request>,
        @Res() res: Response,
    ): Promise<void> {
        const signature = req.headers['x-razorpay-signature'] as string;
        const eventId = req.headers['x-razorpay-event-id'] as string;
        const rawBody = req.rawBody?.toString() || JSON.stringify(req.body);

        // Strict signature verification
        if (!signature || !this.razorpayService.verifyWebhookSignature(rawBody, signature)) {
            this.logger.warn('Invalid or missing webhook signature');
            res.status(400).json({ error: 'Invalid signature' });
            return;
        }

        const payload = req.body;
        const event = payload?.event;
        const subscriptionEntity = payload?.payload?.subscription?.entity;

        if (!event || !eventId) {
            this.logger.warn(`Webhook received with missing event or eventId.`);
            res.status(400).json({ status: 'invalid_payload' });
            return;
        }

        const razorpaySubId = subscriptionEntity?.id;

        // Idempotency check: see if we already processed this exact event
        const existingEvent = await this.webhookEventModel.findOne({ eventId });
        if (existingEvent) {
            this.logger.log(`Webhook event ${eventId} already processed (status: ${existingEvent.status}). Ignoring duplicate.`);
            res.status(200).json({ status: 'duplicate_ignored' });
            return;
        }

        this.logger.log(`Webhook received: ${event} for subscription ${razorpaySubId || 'Unknown'}`);

        try {
            switch (event) {
                case 'subscription.authenticated':
                    await this.subscriptionService.handleSubscriptionAuthenticated(razorpaySubId);
                    break;
                case 'subscription.activated':
                    await this.subscriptionService.handleSubscriptionActivated(razorpaySubId, subscriptionEntity);
                    break;
                case 'subscription.updated':
                    // Dedicated handler for plan changes (separate from activation)
                    await this.subscriptionService.handleSubscriptionUpdated(razorpaySubId, subscriptionEntity);
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
                case 'invoice.paid':
                    // Invoices carry the subscription ID too
                    await this.subscriptionService.handleInvoicePaid(payload?.payload?.invoice?.entity);
                    break;
                default:
                    this.logger.log(`Unhandled webhook event: ${event}`);
            }

            // Write idempotency record BEFORE sending 200 — prevents duplicate processing if
            // the process crashes between response and DB write (Bug 2 fix).
            await this.webhookEventModel.create({
                eventId,
                eventType: event,
                razorpaySubId,
                rawPayload: payload,
                status: 'processed',
            });

            res.status(200).json({ status: 'ok' });
        } catch (error: any) {
            this.logger.error(`Webhook processing error for event ${eventId}: ${error.message}`);

            // Log failed processing (best-effort — do not throw if this write also fails)
            try {
                await this.webhookEventModel.create({
                    eventId,
                    eventType: event,
                    razorpaySubId,
                    rawPayload: payload,
                    status: 'failed',
                    errorReason: error.message,
                });
            } catch (logErr: any) {
                this.logger.error(`Failed to write webhook failure log: ${logErr.message}`);
            }

            // Return 200 to prevent Razorpay retries for logic errors
            res.status(200).json({ status: 'error', message: error.message });
        }
    }
}
