import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { HttpModule } from '@nestjs/axios';
import { WebhooksService } from './webhooks.service';
import { WebhooksResolver } from './webhooks.resolver';
import { Webhook, WebhookSchema } from '../common/schemas/webhook.schema';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: Webhook.name, schema: WebhookSchema }]),
    HttpModule.register({ timeout: 5000 }),
  ],
  providers: [WebhooksService, WebhooksResolver],
  exports: [WebhooksService],
})
export class WebhooksModule {}
