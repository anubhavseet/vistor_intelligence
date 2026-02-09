import { Processor, Process, OnQueueActive, OnQueueCompleted, OnQueueFailed } from '@nestjs/bull';
import { Logger, Inject } from '@nestjs/common';
import { Job } from 'bull';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { chromium, Browser } from 'playwright';
import { PubSub } from 'graphql-subscriptions';
import { CrawlJob, CrawlJobDocument, CrawlJobStatus } from '../../common/schemas/crawl-job.schema';
import { QdrantService } from '../../qdrant/qdrant.service';
import { GeminiService } from '../../ai-generation/gemini.service';
import { v4 as uuidv4 } from 'uuid';
import { Site, SiteDocument } from '../../common/schemas/site.schema';

interface CrawlJobData {
    jobId: string;
    siteId: string;
    startUrl: string;
    maxPages: number;
    maxDepth: number;
    sameDomainOnly: boolean;
}

interface PageToCrawl {
    url: string;
    depth: number;
}

@Processor('website-crawler')
export class WebsiteCrawlerProcessor {
    private readonly logger = new Logger(WebsiteCrawlerProcessor.name);

    constructor(
        @InjectModel(CrawlJob.name) private crawlJobModel: Model<CrawlJobDocument>,
        @InjectModel(Site.name) private siteModel: Model<SiteDocument>,
        private qdrantService: QdrantService,
        private geminiService: GeminiService,
        @Inject('PUB_SUB') private pubSub: PubSub,
    ) { }

    @OnQueueActive()
    onActive(job: Job<CrawlJobData>) {
        this.logger.log(`Processing crawl job ${job.data.jobId} for site ${job.data.siteId}`);
    }

    @OnQueueCompleted()
    async onCompleted(job: Job<CrawlJobData>) {
        this.logger.log(`Crawl job ${job.data.jobId} completed successfully`);
    }

    @OnQueueFailed()
    async onFailed(job: Job<CrawlJobData>, error: Error) {
        this.logger.error(`Crawl job ${job.data.jobId} failed: ${error.message}`, error.stack);

        const updatedJob = await this.crawlJobModel.findOneAndUpdate(
            { jobId: job.data.jobId },
            {
                status: CrawlJobStatus.FAILED,
                error: error.message,
                completedAt: new Date(),
            },
            { new: true }
        );

        this.pubSub.publish('crawlJobUpdated', { crawlJobUpdated: updatedJob });
    }

    @Process('crawl-website')
    async handleCrawl(job: Job<CrawlJobData>) {
        const { jobId, siteId, startUrl, maxPages, maxDepth, sameDomainOnly } = job.data;

        this.logger.log(`Starting crawl for ${startUrl} (Job: ${jobId})`);

        // Update job status to IN_PROGRESS
        let currentJob = await this.crawlJobModel.findOneAndUpdate(
            { jobId },
            {
                status: CrawlJobStatus.IN_PROGRESS,
                startedAt: new Date(),
            },
            { new: true }
        );
        this.pubSub.publish('crawlJobUpdated', { crawlJobUpdated: currentJob });

        let browser: Browser | null = null;
        const visited = new Set<string>();
        const queue: PageToCrawl[] = [{ url: startUrl, depth: 0 }];
        const startDomain = new URL(startUrl).hostname;

        let pagesCrawled = 0;
        let pagesFailed = 0;

        try {
            browser = await chromium.launch({
                headless: true,
                args: ['--no-sandbox', '--disable-setuid-sandbox'],
            });

            while (queue.length > 0 && pagesCrawled < maxPages) {
                const current = queue.shift()!;
                const { url, depth } = current;

                // Skip if already visited
                if (visited.has(url)) continue;
                visited.add(url);

                // Skip if exceeds max depth
                if (depth > maxDepth) continue;

                // Skip if different domain (when sameDomainOnly is true)
                if (sameDomainOnly) {
                    try {
                        const currentDomain = new URL(url).hostname;
                        if (currentDomain !== startDomain) continue;
                    } catch {
                        continue;
                    }
                }

                this.logger.log(`Crawling: ${url} (depth: ${depth})`);

                try {
                    const page = await browser.newPage();

                    // Set timeout and navigate
                    await page.goto(url, {
                        waitUntil: 'networkidle',
                        timeout: 30000,
                    });

                    // Extract design tokens if this is the start URL
                    if (url === startUrl) {
                        try {
                            const designSystem = await page.evaluate(() => {
                                const getStyle = (el: Element, prop: string) => window.getComputedStyle(el).getPropertyValue(prop);

                                const body = document.body;
                                const fontFamily = getStyle(body, 'font-family');
                                const backgroundColor = getStyle(body, 'background-color');
                                const textColor = getStyle(body, 'color');

                                // Find primary button candidates
                                const buttons = Array.from(document.querySelectorAll('button, a[class*="btn"], a[class*="button"], input[type="submit"]'));

                                // Heuristic: Find button with "primary" in class, or largest/most colorful
                                let primaryButton = buttons.find(b => b.className.toLowerCase().includes('primary')) || buttons[0];

                                let primaryColor = '#000000';
                                let secondaryColor = '#ffffff';
                                let borderRadius = '4px';
                                let buttonContext = 'primary-button';

                                if (primaryButton) {
                                    try {
                                        const style = window.getComputedStyle(primaryButton);
                                        primaryColor = style.backgroundColor;
                                        secondaryColor = style.color;
                                        borderRadius = style.borderRadius;
                                    } catch (e) { }
                                }

                                return {
                                    fontFamily,
                                    backgroundColor,
                                    textColor,
                                    primaryColor,
                                    secondaryColor,
                                    borderRadius,
                                };
                            });

                            if (designSystem) {
                                await this.siteModel.updateOne(
                                    { siteId },
                                    { $set: { designSystem } }
                                );
                                this.logger.log(`Extracted and saved design system for site ${siteId}`);
                            }
                        } catch (e) {
                            this.logger.warn(`Failed to extract design tokens: ${e.message}`);
                        }
                    }

                    // Extract page content and links
                    const pageData = await page.evaluate(() => {
                        // Extract meaningful content sections
                        const sections = Array.from(
                            document.querySelectorAll('section, article, div[id], main, header, footer')
                        )
                            .map((el) => {
                                const text = (el as HTMLElement).innerText?.trim() || '';
                                if (text.length < 50) return null;

                                let selector = el.tagName.toLowerCase();
                                if (el.id) selector += `#${el.id}`;
                                else if (el.className) {
                                    const classes = el.className.split(' ').filter(c => c).slice(0, 3).join('.');
                                    if (classes) selector += `.${classes}`;
                                }

                                return {
                                    selector,
                                    html: el.outerHTML.substring(0, 5000), // Limit size
                                    text: text.substring(0, 2000),
                                };
                            })
                            .filter(Boolean);

                        // Extract links
                        const links = Array.from(document.querySelectorAll('a[href]'))
                            .map((a) => (a as HTMLAnchorElement).href)
                            .filter((href) => href && (href.startsWith('http://') || href.startsWith('https://')));

                        return {
                            title: document.title || '',
                            sections,
                            links: [...new Set(links)], // Deduplicate
                        };
                    });

                    // Process and index content sections
                    for (const section of pageData.sections) {
                        if (!section) continue;

                        try {
                            // Generate description using AI
                            const description = await this.geminiService.generateUiDescription(
                                section.html.substring(0, 1000)
                            );

                            // Generate embedding
                            const embeddingText = `Page: ${pageData.title}. URL: ${url}. Selector: ${section.selector}. Content: ${section.text}. Description: ${description}`;
                            const embedding = await this.geminiService.generateEmbedding(embeddingText);

                            // Store in Qdrant
                            const pointId = uuidv4();
                            await this.qdrantService.upsertPoint(pointId, embedding, {
                                url,
                                pageTitle: pageData.title,
                                selector: section.selector,
                                raw_html: section.html,
                                description,
                                siteId,
                                crawlJobId: jobId,
                                crawledAt: new Date().toISOString(),
                            });

                            this.logger.debug(`Indexed section ${section.selector} from ${url}`);

                            // Add a delay to avoid API rate limits (2 seconds)
                            await new Promise(resolve => setTimeout(resolve, 2000));
                        } catch (err) {
                            this.logger.error(`Error indexing section from ${url}:`, err);
                        }
                    }

                    // Add discovered links to queue
                    if (depth < maxDepth) {
                        for (const link of pageData.links) {
                            if (!visited.has(link) && !queue.find(p => p.url === link)) {
                                queue.push({ url: link, depth: depth + 1 });
                            }
                        }
                    }

                    await page.close();
                    pagesCrawled++;

                    // Update progress
                    currentJob = await this.crawlJobModel.findOneAndUpdate(
                        { jobId },
                        {
                            pagesCrawled,
                            pagesDiscovered: visited.size + queue.length,
                            urlsCrawled: Array.from(visited),
                            urlsQueued: queue.map(p => p.url),
                        },
                        { new: true }
                    );
                    this.pubSub.publish('crawlJobUpdated', { crawlJobUpdated: currentJob });

                    // Update job progress
                    const progress = Math.min((pagesCrawled / maxPages) * 100, 100);
                    await job.progress(progress);

                    // Small delay to avoid overwhelming the target server
                    await new Promise(resolve => setTimeout(resolve, 1000));

                } catch (err) {
                    pagesFailed++;
                    this.logger.error(`Failed to crawl ${url}:`, err);

                    currentJob = await this.crawlJobModel.findOneAndUpdate(
                        { jobId },
                        { pagesFailed },
                        { new: true }
                    );
                    this.pubSub.publish('crawlJobUpdated', { crawlJobUpdated: currentJob });
                }
            }

            // Mark job as completed
            currentJob = await this.crawlJobModel.findOneAndUpdate(
                { jobId },
                {
                    status: CrawlJobStatus.COMPLETED,
                    completedAt: new Date(),
                    pagesCrawled,
                    pagesFailed,
                    pagesDiscovered: visited.size,
                },
                { new: true }
            );
            this.pubSub.publish('crawlJobUpdated', { crawlJobUpdated: currentJob });

            this.logger.log(
                `Crawl completed for ${startUrl}. Pages crawled: ${pagesCrawled}, Failed: ${pagesFailed}`
            );

            return {
                success: true,
                pagesCrawled,
                pagesFailed,
            };

        } catch (error) {
            this.logger.error(`Critical error during crawl job ${jobId}:`, error);

            const failedJob = await this.crawlJobModel.findOneAndUpdate(
                { jobId },
                {
                    status: CrawlJobStatus.FAILED,
                    error: error.message,
                    completedAt: new Date(),
                },
                { new: true }
            );
            this.pubSub.publish('crawlJobUpdated', { crawlJobUpdated: failedJob });

            throw error;
        } finally {
            if (browser) {
                await browser.close();
            }
        }
    }
}
