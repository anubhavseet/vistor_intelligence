import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type VisitorDocument = Visitor & Document;

/**
 * Visitor Schema
 * 
 * Represents a persistent visitor profile across multiple sessions.
 * Aggregates long-term stats like LTV, total sessions, and average intent.
 */
@Schema({ timestamps: true, collection: 'visitors' })
export class Visitor {
    @Prop({ required: true, unique: true, index: true })
    visitorId: string; // Persistent ID (vi_user_id) from cookie/localStorage

    @Prop({ required: true, index: true })
    siteId: string;

    @Prop()
    firstSeenAt: Date;

    @Prop()
    lastSeenAt: Date;

    @Prop({ default: 0 })
    totalSessions: number;

    @Prop({ default: 0 })
    totalPageViews: number;

    @Prop({ default: 0 })
    totalTimeSpent: number; // In seconds

    @Prop({ default: 0 })
    avgIntentScore: number;

    @Prop({ type: [String], default: [] })
    tags: string[]; // e.g., "Returning", "High Intent", "Whale"

    @Prop({ type: Object })
    deviceStats: {
        mobileCount: number;
        desktopCount: number;
        lastDevice: string;
    };

    @Prop({ type: Object })
    geo: {
        country: string;
        city: string;
        region: string;
    };
}

export const VisitorSchema = SchemaFactory.createForClass(Visitor);

// Indexes
VisitorSchema.index({ siteId: 1, lastSeenAt: -1 });
VisitorSchema.index({ siteId: 1, totalSessions: -1 });
VisitorSchema.index({ siteId: 1, avgIntentScore: -1 });
