import { Module } from '@nestjs/common';
import { PubSub } from 'graphql-subscriptions';
import { BullModule } from '@nestjs/bull';
import { MongooseModule } from '@nestjs/mongoose';
import { CrawlerService } from './crawler.service';
import { CrawlerResolver } from './crawler.resolver';
import { WebsiteCrawlerProcessor } from './processors/website-crawler.processor';
import { AiGenerationModule } from '../ai-generation/ai-generation.module';
import { QdrantModule } from '../qdrant/qdrant.module';
import { CrawlJob, CrawlJobSchema } from '../common/schemas/crawl-job.schema';

@Module({
    imports: [
        BullModule.registerQueue({
            name: 'website-crawler',
        }),
        MongooseModule.forFeature([
            { name: CrawlJob.name, schema: CrawlJobSchema },
        ]),
        AiGenerationModule,
        QdrantModule,
    ],
    providers: [
        CrawlerService,
        CrawlerResolver,
        WebsiteCrawlerProcessor,
        {
            provide: 'PUB_SUB',
            useValue: new PubSub(),
        }
    ],
    exports: [CrawlerService],
})
export class CrawlerModule { }
