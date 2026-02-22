import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type InvoiceDocument = Invoice & Document;

/**
 * Invoice Schema
 *
 * Stores billing history from Razorpay subscription charges.
 */
@Schema({ timestamps: true, collection: 'invoices' })
export class Invoice {
    @Prop({ required: true, unique: true })
    invoiceId: string; // Internal UUID

    @Prop()
    razorpayInvoiceId?: string;

    @Prop()
    razorpayPaymentId?: string;

    @Prop({ type: Types.ObjectId, ref: 'Subscription', required: true })
    subscriptionId: Types.ObjectId;

    @Prop({ type: Types.ObjectId, ref: 'User', required: true, index: true })
    userId: Types.ObjectId;

    @Prop({ type: Types.ObjectId, ref: 'Plan', required: true })
    planId: Types.ObjectId;

    @Prop({ required: true })
    amount: number; // in paise

    @Prop({ default: 'INR' })
    currency: string;

    @Prop({
        type: String,
        enum: ['issued', 'paid', 'expired', 'cancelled'],
        default: 'issued',
    })
    status: string;

    @Prop()
    billingPeriodStart?: Date;

    @Prop()
    billingPeriodEnd?: Date;

    @Prop()
    paidAt?: Date;

    @Prop()
    receiptUrl?: string;
}

export const InvoiceSchema = SchemaFactory.createForClass(Invoice);

InvoiceSchema.index({ userId: 1, status: 1 });
InvoiceSchema.index({ subscriptionId: 1 });
InvoiceSchema.index({ razorpayPaymentId: 1 });
