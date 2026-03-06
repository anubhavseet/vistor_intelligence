import { Resolver, Query, Mutation, Args } from '@nestjs/graphql';
import { IntentCategory } from '../common/enums/intent.enum';
import { UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { IntentPromptsService } from './intent-prompts.service';
import { IntentPrompt, IntentPreview, IntentPagePreview } from './dto/intent-prompt.object';
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

    /**
     * Generate a preview of the AI-generated UI component (returns HTML/CSS/JS fragments).
     * injectionMode controls whether to generate a popup or inline component.
     * If promptId is provided, the generated result is persisted back to that document.
     */
    @Mutation(() => IntentPreview)
    async generatePromptPreview(
        @Args('siteId') siteId: string,
        @Args('intent', { type: () => IntentCategory }) intent: IntentCategory,
        @Args('prompt') prompt: string,
        @Args('injectionMode', { nullable: true, defaultValue: 'popup' }) injectionMode: string,
        @Args('promptId', { nullable: true }) promptId?: string,
    ) {
        return this.intentPromptsService.generatePreview(siteId, intent, prompt, injectionMode, promptId);
    }

    /**
     * Fetch the full crawled site HTML from Qdrant with the generated component already injected.
     * Returns self-contained HTML safe for use as an iframe srcdoc.
     */
    @Query(() => IntentPagePreview)
    async getIntentPromptPagePreview(
        @Args('siteId') siteId: string,
        @Args('promptId') promptId: string,
    ) {
        return this.intentPromptsService.getPagePreview(siteId, promptId);
    }
}
