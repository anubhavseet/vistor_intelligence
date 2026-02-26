import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type WebhookEventDocument = WebhookEvent & Document;

@Schema({ timestamps: true })
export class WebhookEvent {
    @Prop({ required: true, unique: true, index: true })
    eventId: string; // Razorpay's 'x-razorpay-event-id'

    @Prop({ required: true })
    eventType: string; // e.g., 'subscription.charged', 'invoice.paid'

    @Prop({ required: false })
    razorpaySubId?: string;

    @Prop({ type: Object, required: true })
    rawPayload: any;

    @Prop({ required: true, enum: ['processed', 'failed', 'ignored'] })
    status: string;

    @Prop({ required: false })
    errorReason?: string;

    @Prop()
    createdAt?: Date;

    @Prop()
    updatedAt?: Date;
}

export const WebhookEventSchema = SchemaFactory.createForClass(WebhookEvent);
