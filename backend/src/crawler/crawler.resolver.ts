import { Resolver, Query, Mutation, Args } from '@nestjs/graphql';
import { UseGuards } from '@nestjs/common';
import { CrawlerService } from './crawler.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { StartCrawlInput } from './dto/start-crawl.input';
import { CrawlJobStatus } from './dto/crawl-status.type';

@Resolver()
@UseGuards(JwtAuthGuard)
export class CrawlerResolver {
    constructor(private crawlerService: CrawlerService) { }

    @Mutation(() => CrawlJobStatus)
    async startWebsiteCrawl(
        @Args('input') input: StartCrawlInput,
    ): Promise<CrawlJobStatus> {
        const job = await this.crawlerService.startCrawl(input);

        return {
            jobId: job.jobId,
            siteId: job.siteId,
            status: job.status as any,
            pagesDiscovered: job.pagesDiscovered,
            pagesCrawled: job.pagesCrawled,
            pagesFailed: job.pagesFailed,
            startedAt: job.startedAt,
            completedAt: job.completedAt,
            error: job.error,
            urlsQueued: job.urlsQueued,
        };
    }

    @Query(() => CrawlJobStatus)
    async getCrawlJobStatus(
        @Args('jobId') jobId: string,
    ): Promise<CrawlJobStatus> {
        const job = await this.crawlerService.getCrawlStatus(jobId);

        return {
            jobId: job.jobId,
            siteId: job.siteId,
            status: job.status as any,
            pagesDiscovered: job.pagesDiscovered,
            pagesCrawled: job.pagesCrawled,
            pagesFailed: job.pagesFailed,
            startedAt: job.startedAt,
            completedAt: job.completedAt,
            error: job.error,
            urlsQueued: job.urlsQueued,
        };
    }

    @Query(() => [CrawlJobStatus])
    async getSiteCrawlJobs(
        @Args('siteId') siteId: string,
    ): Promise<CrawlJobStatus[]> {
        const jobs = await this.crawlerService.getCrawlJobsBySite(siteId);

        return jobs.map(job => ({
            jobId: job.jobId,
            siteId: job.siteId,
            status: job.status as any,
            pagesDiscovered: job.pagesDiscovered,
            pagesCrawled: job.pagesCrawled,
            pagesFailed: job.pagesFailed,
            startedAt: job.startedAt,
            completedAt: job.completedAt,
            error: job.error,
            urlsQueued: job.urlsQueued,
        }));
    }

    @Query(() => [CrawlJobStatus])
    async getActiveCrawlJobs(
        @Args('siteId') siteId: string,
    ): Promise<CrawlJobStatus[]> {
        const jobs = await this.crawlerService.getActiveCrawlJobs(siteId);

        return jobs.map(job => ({
            jobId: job.jobId,
            siteId: job.siteId,
            status: job.status as any,
            pagesDiscovered: job.pagesDiscovered,
            pagesCrawled: job.pagesCrawled,
            pagesFailed: job.pagesFailed,
            startedAt: job.startedAt,
            completedAt: job.completedAt,
            error: job.error,
            urlsQueued: job.urlsQueued,
        }));
    }

    @Mutation(() => Boolean)
    async cancelCrawlJob(
        @Args('jobId') jobId: string,
    ): Promise<boolean> {
        return this.crawlerService.cancelCrawl(jobId);
    }

    @Mutation(() => CrawlJobStatus)
    async retryCrawlJob(
        @Args('jobId') jobId: string,
    ): Promise<CrawlJobStatus> {
        const job = await this.crawlerService.retryCrawl(jobId);

        return {
            jobId: job.jobId,
            siteId: job.siteId,
            status: job.status as any,
            pagesDiscovered: job.pagesDiscovered,
            pagesCrawled: job.pagesCrawled,
            pagesFailed: job.pagesFailed,
            startedAt: job.startedAt,
            completedAt: job.completedAt,
            error: job.error,
            urlsQueued: job.urlsQueued,
        };
    }
}
