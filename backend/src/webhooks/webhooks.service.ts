import { Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';
import { Webhook, WebhookDocument } from '../common/schemas/webhook.schema';

@Injectable()
export class WebhooksService {
  private readonly logger = new Logger(WebhooksService.name);

  constructor(
    @InjectModel(Webhook.name) private webhookModel: Model<WebhookDocument>,
    private httpService: HttpService,
  ) {}

  async createWebhook(siteId: string, userId: string, url: string, eventType: string) {
    return this.webhookModel.create({
      siteId,
      userId,
      url,
      eventType,
      isActive: true,
    });
  }

  async getWebhooks(siteId: string, userId: string) {
    return this.webhookModel.find({ siteId, userId });
  }

  async deleteWebhook(webhookId: string, userId: string) {
    return this.webhookModel.findOneAndDelete({ _id: webhookId, userId });
  }

  /**
   * Trigger webhooks for an event
   * Simple implementation - just POST to URL
   */
  async triggerWebhooks(siteId: string, eventType: 'high_intent' | 'traffic_spike', data: any) {
    const webhooks = await this.webhookModel.find({
      siteId,
      isActive: true,
      $or: [
        { eventType },
        { eventType: 'both' },
      ],
    });

    for (const webhook of webhooks) {
      try {
        await firstValueFrom(
          this.httpService.post(webhook.url, {
            event: eventType,
            timestamp: new Date().toISOString(),
            data,
          }, {
            timeout: 5000,
          }),
        );

        webhook.successCount += 1;
        webhook.lastTriggeredAt = new Date();
        await webhook.save();
      } catch (error) {
        this.logger.warn(`Webhook failed for ${webhook.url}:`, error.message);
        webhook.failureCount += 1;
        await webhook.save();
      }
    }
  }
}
