import { Module } from '@nestjs/common';
import { IntentService } from './intent.service';
import { QdrantModule } from '../qdrant/qdrant.module';
import { AiGenerationModule } from '../ai-generation/ai-generation.module';

@Module({
  imports: [QdrantModule, AiGenerationModule],
  providers: [IntentService],
  exports: [IntentService],
})
export class IntentModule { }
