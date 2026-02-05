import { Resolver, Query, Mutation, Args } from '@nestjs/graphql';
import { UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { IntentPromptsService } from './intent-prompts.service';
import { IntentPrompt, IntentPreview } from './dto/intent-prompt.object';
import { CreateIntentPromptInput, UpdateIntentPromptInput } from './dto/intent-prompt.input';

@Resolver(() => IntentPrompt)
@UseGuards(JwtAuthGuard)
export class IntentPromptsResolver {
    constructor(private readonly intentPromptsService: IntentPromptsService) { }

    @Query(() => [IntentPrompt])
    async getIntentPrompts(@Args('siteId') siteId: string) {
        return this.intentPromptsService.findAllBySite(siteId);
    }

    @Mutation(() => IntentPrompt)
    async createIntentPrompt(@Args('input') input: CreateIntentPromptInput) {
        return this.intentPromptsService.create(input);
    }

    @Mutation(() => IntentPrompt)
    async updateIntentPrompt(@Args('input') input: UpdateIntentPromptInput) {
        return this.intentPromptsService.update(input);
    }

    @Mutation(() => Boolean)
    async deleteIntentPrompt(@Args('id') id: string) {
        return this.intentPromptsService.remove(id);
    }

    @Mutation(() => IntentPreview)
    async generatePromptPreview(
        @Args('siteId') siteId: string,
        @Args('intent') intent: string,
        @Args('prompt') prompt: string
    ) {
        return this.intentPromptsService.generatePreview(siteId, intent, prompt);
    }
}
