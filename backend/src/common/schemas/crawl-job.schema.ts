import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type CrawlJobDocument = CrawlJob & Document;

export enum CrawlJobStatus {
    PENDING = 'PENDING',
    IN_PROGRESS = 'IN_PROGRESS',
    COMPLETED = 'COMPLETED',
    FAILED = 'FAILED',
}

/**
 * CrawlJob Schema
 * 
 * Tracks the status and progress of website crawling jobs
 */
@Schema({ timestamps: true, collection: 'crawl_jobs' })
export class CrawlJob {
    @Prop({ required: true, unique: true })
    jobId: string;

    @Prop({ required: true, index: true })
    siteId: string;

    @Prop({ required: true })
    startUrl: string;

    @Prop({
        type: String,
        enum: Object.values(CrawlJobStatus),
        default: CrawlJobStatus.PENDING,
        index: true,
    })
    status: CrawlJobStatus;

    @Prop({ type: Number, default: 0 })
    pagesDiscovered: number;

    @Prop({ type: Number, default: 0 })
    pagesCrawled: number;

    @Prop({ type: Number, default: 0 })
    pagesFailed: number;

    @Prop({ type: [String], default: [] })
    urlsQueued: string[];

    @Prop({ type: [String], default: [] })
    urlsCrawled: string[];

    @Prop({ type: Number, default: 50 })
    maxPages: number;

    @Prop({ type: Number, default: 3 })
    maxDepth: number;

    @Prop({ type: Boolean, default: true })
    sameDomainOnly: boolean;

    @Prop()
    startedAt?: Date;

    @Prop()
    completedAt?: Date;

    @Prop()
    error?: string;
}

export const CrawlJobSchema = SchemaFactory.createForClass(CrawlJob);

CrawlJobSchema.index({ siteId: 1, status: 1 });
CrawlJobSchema.index({ jobId: 1 });
