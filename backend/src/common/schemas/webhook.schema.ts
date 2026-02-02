import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type WebhookDocument = Webhook & Document;

/**
 * Webhook Schema
 * 
 * Simple webhook configuration for alerts.
 */
@Schema({ timestamps: true, collection: 'webhooks' })
export class Webhook {
  @Prop({ required: true, index: true })
  siteId: string;

  @Prop({ required: true, index: true })
  userId: string;

  @Prop({ required: true })
  url: string; // Webhook URL

  @Prop({ required: true })
  eventType: 'high_intent' | 'traffic_spike' | 'both';

  @Prop({ default: true })
  isActive: boolean;

  @Prop({ default: 0 })
  successCount: number;

  @Prop({ default: 0 })
  failureCount: number;

  @Prop()
  lastTriggeredAt?: Date;
}

export const WebhookSchema = SchemaFactory.createForClass(Webhook);

WebhookSchema.index({ siteId: 1, isActive: 1 });
