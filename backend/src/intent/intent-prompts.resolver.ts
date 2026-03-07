import { Resolver, Query, Mutation, Args } from '@nestjs/graphql';
import { IntentCategory } from '../common/enums/intent.enum';
import { UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { IntentPromptsService } from './intent-prompts.service';
import { IntentService } from './intent.service';
import { IntentPrompt, IntentPreview, IntentPagePreview, IntentPayloadPublic, IntentSelectorEntry } from './dto/intent-prompt.object';
import { CreateIntentPromptInput, UpdateIntentPromptInput } from './dto/intent-prompt.input';

@Resolver(() => IntentPrompt)
export class IntentPromptsResolver {
    constructor(
        private readonly intentPromptsService: IntentPromptsService,
        private readonly intentService: IntentService,
    ) { }

    // ─── AUTHENTICATED QUERIES (admin dashboard) ──────────────────────────────

    @UseGuards(JwtAuthGuard)
    @Query(() => [IntentPrompt])
    async getIntentPrompts(@Args('siteId') siteId: string) {
        return this.intentPromptsService.findAllBySite(siteId);
    }

    @UseGuards(JwtAuthGuard)
    @Mutation(() => IntentPrompt)
    async createIntentPrompt(@Args('input') input: CreateIntentPromptInput) {
        return this.intentPromptsService.create(input);
    }

    @UseGuards(JwtAuthGuard)
    @Mutation(() => IntentPrompt)
    async updateIntentPrompt(@Args('input') input: UpdateIntentPromptInput) {
        return this.intentPromptsService.update(input);
    }

    @UseGuards(JwtAuthGuard)
    @Mutation(() => Boolean)
    async deleteIntentPrompt(@Args('id') id: string) {
        return this.intentPromptsService.remove(id);
    }

    /**
     * Generate a preview of the AI-generated UI component (returns HTML/CSS/JS fragments).
     * injectionMode controls whether to generate a popup or inline component.
     * If promptId is provided, the generated result is persisted back to that document.
     */
    @UseGuards(JwtAuthGuard)
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
     * Returns self-contained HTML safe for use in an iframe srcdoc.
     */
    @UseGuards(JwtAuthGuard)
    @Query(() => IntentPagePreview)
    async getIntentPromptPagePreview(
        @Args('siteId') siteId: string,
        @Args('promptId') promptId: string,
    ) {
        return this.intentPromptsService.getPagePreview(siteId, promptId);
    }

    /**
     * Manually trigger a rebuild of the Intent Selector Map for a site.
     * Runs Gemini classification over all crawled Qdrant chunks.
     */
    @UseGuards(JwtAuthGuard)
    @Mutation(() => Boolean)
    async rebuildIntentSelectorMap(@Args('siteId') siteId: string): Promise<boolean> {
        await this.intentService.buildIntentSelectorMap(siteId);
        return true;
    }

    // ─── PUBLIC QUERIES (no auth — used by tracker SDK) ──────────────────────

    /**
     * Returns all pre-generated UI payloads for a site.
     * Called by socketTracker.js on boot to prefetch all intent UIs into browser memory.
     * No auth required — siteId is a UUID and payloads are visitor-facing content.
     */
    @Query(() => [IntentPayloadPublic])
    async getIntentPayloads(@Args('siteId') siteId: string): Promise<IntentPayloadPublic[]> {
        return this.intentPromptsService.getAllActivePayloads(siteId);
    }

    /**
     * Returns the crawl-derived Intent Selector Map for a site.
     * Called by socketTracker.js on boot so it can tag DOM elements with
     * data-vi-intent-category and score signals semantically.
     * No auth required.
     */
    @Query(() => [IntentSelectorEntry])
    async getIntentSelectors(@Args('siteId') siteId: string): Promise<IntentSelectorEntry[]> {
        return this.intentService.getIntentSelectorEntries(siteId);
    }
}
