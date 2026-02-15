import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bull';
import { InjectModel } from '@nestjs/mongoose';
import { Queue } from 'bull';
import { Model } from 'mongoose';
import { v4 as uuidv4 } from 'uuid';
import { CrawlJob, CrawlJobDocument, CrawlJobStatus } from '../common/schemas/crawl-job.schema';
import { StartCrawlInput } from './dto/start-crawl.input';
import { CrawlJobStatus as CrawlStatusType } from './dto/crawl-status.type';
import { QdrantService } from '../qdrant/qdrant.service';

@Injectable()
export class CrawlerService {
    private readonly logger = new Logger(CrawlerService.name);

    constructor(
        @InjectQueue('website-crawler') private crawlQueue: Queue,
        @InjectModel(CrawlJob.name) private crawlJobModel: Model<CrawlJobDocument>,
        private qdrantService: QdrantService,
    ) { }

    /**
     * Start a new website crawl job
     */
    async startCrawl(input: StartCrawlInput): Promise<CrawlJob> {
        const jobId = `crawl_${uuidv4()}`;

        this.logger.log(`Creating new crawl job ${jobId} for ${input.startUrl}`);

        // Create job record in database
        const crawlJob = await this.crawlJobModel.create({
            jobId,
            siteId: input.siteId,
            startUrl: input.startUrl,
            status: CrawlJobStatus.PENDING,
            maxPages: input.maxPages || 50,
            maxDepth: input.maxDepth || 3,
            sameDomainOnly: input.sameDomainOnly !== false,
            pagesDiscovered: 0,
            pagesCrawled: 0,
            pagesFailed: 0,
            urlsQueued: [input.startUrl],
            urlsCrawled: [],
        });

        // Add job to BullMQ queue (non-blocking)
        await this.crawlQueue.add('crawl-website', {
            jobId,
            siteId: input.siteId,
            startUrl: input.startUrl,
            maxPages: input.maxPages || 50,
            maxDepth: input.maxDepth || 3,
            sameDomainOnly: input.sameDomainOnly !== false,
        }, {
            jobId,
            attempts: 3,
            backoff: {
                type: 'exponential',
                delay: 5000,
            },
            removeOnComplete: false,
            removeOnFail: false,
        });

        this.logger.log(`Crawl job ${jobId} queued successfully`);

        return crawlJob;
    }

    /**
     * Get crawl job status by jobId
     */
    async getCrawlStatus(jobId: string): Promise<CrawlJob> {
        const job = await this.crawlJobModel.findOne({ jobId });

        if (!job) {
            throw new NotFoundException(`Crawl job ${jobId} not found`);
        }

        return job;
    }

    /**
     * Get all crawl jobs for a site
     */
    async getCrawlJobsBySite(siteId: string): Promise<CrawlJob[]> {
        return this.crawlJobModel
            .find({ siteId })
            .sort({ createdAt: -1 })
            .limit(50)
            .exec();
    }

    /**
     * Get active/pending crawl jobs for a site
     */
    async getActiveCrawlJobs(siteId: string): Promise<CrawlJob[]> {
        return this.crawlJobModel
            .find({
                siteId,
                status: { $in: [CrawlJobStatus.PENDING, CrawlJobStatus.IN_PROGRESS] },
            })
            .sort({ createdAt: -1 })
            .exec();
    }

    /**
     * Cancel a crawl job
     */
    async cancelCrawl(jobId: string): Promise<boolean> {
        // Remove from queue
        const bullJob = await this.crawlQueue.getJob(jobId);
        if (bullJob) {
            await bullJob.remove();
        }

        // Update database record
        await this.crawlJobModel.findOneAndUpdate(
            { jobId },
            {
                status: CrawlJobStatus.FAILED,
                error: 'Cancelled by user',
                completedAt: new Date(),
            },
        );

        this.logger.log(`Crawl job ${jobId} cancelled`);

        return true;
    }

    /**
     * Retry a failed crawl job
     */
    async retryCrawl(jobId: string): Promise<CrawlJob> {
        const existingJob = await this.getCrawlStatus(jobId);

        if (existingJob.status !== CrawlJobStatus.FAILED) {
            throw new Error('Can only retry failed jobs');
        }

        // Create new job with same parameters
        return this.startCrawl({
            siteId: existingJob.siteId,
            startUrl: existingJob.startUrl,
            maxPages: existingJob.maxPages,
            maxDepth: existingJob.maxDepth,
            sameDomainOnly: existingJob.sameDomainOnly,
        });
    }

    /**
     * Get queue statistics
     */
    async getQueueStats() {
        const [waiting, active, completed, failed] = await Promise.all([
            this.crawlQueue.getWaitingCount(),
            this.crawlQueue.getActiveCount(),
            this.crawlQueue.getCompletedCount(),
            this.crawlQueue.getFailedCount(),
        ]);

        return {
            waiting,
            active,
            completed,
            failed,
            total: waiting + active,
        };
    }

    /**
     * Delete a crawl job and its associated data
     */
    async deleteCrawlJob(jobId: string): Promise<boolean> {
        const job = await this.getCrawlStatus(jobId);

        // 1. Remove from queue if pending
        if (job.status === CrawlJobStatus.PENDING || job.status === CrawlJobStatus.IN_PROGRESS) {
            await this.cancelCrawl(jobId);
        }

        // 2. Delete from Qdrant
        await this.qdrantService.deletePoints({
            must: [
                {
                    key: "crawlJobId",
                    match: {
                        value: jobId
                    }
                }
            ]
        });

        // 3. Delete from DB
        await this.crawlJobModel.deleteOne({ jobId });

        this.logger.log(`Deleted crawl job ${jobId} and associated entries`);
        return true;
    }
    async getCrawledPages(siteId: string): Promise<string[]> {
        const points = await this.qdrantService.scroll({
            must: [
                { key: "siteId", match: { value: siteId } }
            ]
        }, 100);

        // Extract unique URLs
        const urls = new Set<string>();
        points.forEach(p => {
            if (p.payload?.url) {
                urls.add(p.payload.url as string);
            }
        });

        return Array.from(urls);
    }
}
