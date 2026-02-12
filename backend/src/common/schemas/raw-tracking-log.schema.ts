import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Schema as MongooseSchema } from 'mongoose';

export type RawTrackingLogDocument = RawTrackingLog & Document;

@Schema({ timestamps: true, collection: 'raw_tracking_logs' })
export class RawTrackingLog {
    @Prop({ required: true, index: true })
    siteId: string;

    @Prop({ required: true, index: true })
    sessionId: string;

    @Prop()
    url: string;

    @Prop()
    timestamp: Date;

    @Prop({ type: MongooseSchema.Types.Mixed })
    raw_signals: any; // The full JSON payload

    @Prop()
    ipHash: string;

    @Prop()
    userAgent: string;
}

export const RawTrackingLogSchema = SchemaFactory.createForClass(RawTrackingLog);

// Index for efficient querying by site/session
RawTrackingLogSchema.index({ siteId: 1, timestamp: -1 });
RawTrackingLogSchema.index({ sessionId: 1 });
