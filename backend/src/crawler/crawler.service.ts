import { Injectable, Logger } from '@nestjs/common';
import { chromium, Browser, Page } from 'playwright';
import { GeminiService } from '../ai-generation/gemini.service';
import { QdrantService } from '../qdrant/qdrant.service';
import { v4 as uuidv4 } from 'uuid';

@Injectable()
export class CrawlerService {
    private readonly logger = new Logger(CrawlerService.name);

    constructor(
        private geminiService: GeminiService,
        private qdrantService: QdrantService,
    ) { }

    async crawlAndIndex(url: string, siteId: string) {
        this.logger.log(`Starting crawl for ${url}`);

        let browser: Browser;
        try {
            browser = await chromium.launch();
            const page = await browser.newPage();
            await page.goto(url, { waitUntil: 'networkidle' });

            // Extract meaningful sections
            // Logic: get sections, articles, or divs with IDs that contain significant text
            const elements = await page.evaluate(() => {
                const candidates = Array.from(document.querySelectorAll('section, article, div[id], main'));

                return candidates.map(el => {
                    // simple cleaning
                    const text = (el as HTMLElement).innerText.trim();
                    if (text.length < 50) return null; // skip small chunks

                    let selector = el.tagName.toLowerCase();
                    if (el.id) selector += `#${el.id}`;
                    else if (el.className) selector += `.${el.className.split(' ').join('.')}`;

                    return {
                        tagName: el.tagName.toLowerCase(),
                        id: el.id,
                        className: el.className,
                        selector: selector,
                        html: el.outerHTML,
                        text: text,
                    };
                }).filter(Boolean);
            });

            this.logger.log(`Found ${elements.length} chunks on ${url}`);

            // Process in batches or sequence
            for (const chunk of elements) {
                if (!chunk) continue;

                try {
                    // 1. Generate Description
                    const description = await this.geminiService.generateUiDescription(chunk.html.substring(0, 1000));

                    // 2. Generate Embedding (use text content + description for better semantic match)
                    const embeddingText = `Context: ${chunk.selector}. Content: ${chunk.text.substring(0, 500)}. Description: ${description}`;
                    const embedding = await this.geminiService.generateEmbedding(embeddingText);

                    // 3. Upsert to Qdrant
                    const pointId = uuidv4();
                    await this.qdrantService.upsertPoint(pointId, embedding, {
                        url: url,
                        selector: chunk.selector,
                        raw_html: chunk.html, // Watch out for limits, maybe truncate if massive
                        description: description,
                        siteId: siteId
                    });

                } catch (err) {
                    this.logger.error(`Error processing chunk ${chunk.selector}`, err);
                }
            }

            this.logger.log(`Finished crawling ${url}`);

        } catch (error) {
            this.logger.error(`Crawling failed for ${url}`, error);
            throw error;
        } finally {
            if (browser) await browser.close();
        }
    }
}
