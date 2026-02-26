import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { Plan, PlanSchema } from '../common/schemas/plan.schema';
import { Subscription, SubscriptionSchema } from '../common/schemas/subscription.schema';
import { Invoice, InvoiceSchema } from '../common/schemas/invoice.schema';
import { Site, SiteSchema } from '../common/schemas/site.schema';
import { Webhook, WebhookSchema } from '../common/schemas/webhook.schema';
import { WebhookEvent, WebhookEventSchema } from '../common/schemas/webhook-event.schema';
import { RazorpayService } from './razorpay.service';
import { PlanService } from './plan.service';
import { SubscriptionService } from './subscription.service';
import { PlanResolver } from './plan.resolver';
import { SubscriptionResolver } from './subscription.resolver';
import { SubscriptionAdminResolver } from './subscription-admin.resolver';
import { WebhookController } from './webhook.controller';
import { SubscriptionCron } from './subscription.cron';
import { SubscriptionGuard } from './guards/subscription.guard';

@Module({
    imports: [
        MongooseModule.forFeature([
            { name: Plan.name, schema: PlanSchema },
            { name: Subscription.name, schema: SubscriptionSchema },
            { name: Invoice.name, schema: InvoiceSchema },
            { name: Site.name, schema: SiteSchema },
            { name: Webhook.name, schema: WebhookSchema },
            { name: WebhookEvent.name, schema: WebhookEventSchema },
        ]),
    ],
    controllers: [WebhookController],
    providers: [
        RazorpayService,
        PlanService,
        SubscriptionService,
        PlanResolver,
        SubscriptionResolver,
        SubscriptionAdminResolver,
        SubscriptionCron,
        SubscriptionGuard,
    ],
    exports: [SubscriptionService, PlanService, SubscriptionGuard, RazorpayService],
})
export class SubscriptionModule { }
