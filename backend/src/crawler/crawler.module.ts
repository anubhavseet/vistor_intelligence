import { Module } from '@nestjs/common';
import { CrawlerService } from './crawler.service';
import { AiGenerationModule } from '../ai-generation/ai-generation.module';
import { QdrantModule } from '../qdrant/qdrant.module';

@Module({
    imports: [AiGenerationModule, QdrantModule],
    providers: [CrawlerService],
    exports: [CrawlerService],
})
export class CrawlerModule { }
