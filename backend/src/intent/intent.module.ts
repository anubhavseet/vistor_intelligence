import { Module, forwardRef } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { IntentService } from './intent.service';
import { QdrantModule } from '../qdrant/qdrant.module';
import { AiGenerationModule } from '../ai-generation/ai-generation.module';
import { SitesModule } from '../sites/sites.module';
import { IntentPrompt, IntentPromptSchema } from './schemas/intent-prompt.schema';
import { IntentPromptsService } from './intent-prompts.service';
import { IntentPromptsResolver } from './intent-prompts.resolver';

@Module({
  imports: [
    QdrantModule,
    AiGenerationModule,
    forwardRef(() => SitesModule),
    MongooseModule.forFeature([{ name: IntentPrompt.name, schema: IntentPromptSchema }])
  ],
  providers: [IntentService, IntentPromptsService, IntentPromptsResolver],
  exports: [IntentService, IntentPromptsService],
})
export class IntentModule { }
