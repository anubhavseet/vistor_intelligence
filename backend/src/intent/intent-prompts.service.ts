import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { IntentPrompt, IntentPromptDocument } from './schemas/intent-prompt.schema';
import { CreateIntentPromptInput, UpdateIntentPromptInput } from './dto/intent-prompt.input';
import { GeminiService } from '../ai-generation/gemini.service';
import { QdrantService } from '../qdrant/qdrant.service';
import { SitesService } from '../sites/sites.service';

@Injectable()
export class IntentPromptsService {
    constructor(
        @InjectModel(IntentPrompt.name) private intentPromptModel: Model<IntentPromptDocument>,
        private geminiService: GeminiService,
        private qdrantService: QdrantService,
        private sitesService: SitesService
    ) { }

    async create(input: CreateIntentPromptInput): Promise<IntentPrompt> {
        const created = new this.intentPromptModel({
            siteId: input.siteId,
            intent: input.intent,
            prompt: input.prompt,
            description: input.description,
            isActive: input.isActive,
        });
        await created.save();

        // Generate UI in background (or await if critical, user wants it "generated... and in frontend there will be section")
        // Better to await so it's ready immediately.
        try {
            // Fetch context for style adaptation
            const embedding = await this.geminiService.generateEmbedding("General website design and style");
            const filters = { must: [{ key: "siteId", match: { value: input.siteId } }] };
            const searchResults = await this.qdrantService.search(embedding, filters, 1);

            let contextHtml = "";
            let contextDesc = "Standard business website";

            if (searchResults.length > 0) {
                contextHtml = searchResults[0].payload.raw_html as string || "";
                contextDesc = searchResults[0].payload.description as string || "";
            }

            const site = await this.sitesService.getSiteBySiteId(input.siteId);
            const uiPayload = await this.geminiService.generateUiElement(
                input.prompt,
                contextHtml,
                contextDesc,
                site.designSystem
            );

            created.generatedHtml = uiPayload.html_payload;
            created.generatedCss = uiPayload.scoped_css;
            created.generatedJs = uiPayload.javascript_payload;
            await created.save();

        } catch (e) {
            console.error("Failed to generate initial UI for prompt", e);
        }

        return created;
    }

    async findAllBySite(siteId: string): Promise<IntentPrompt[]> {
        return this.intentPromptModel.find({ siteId }).sort({ createdAt: -1 }).exec();
    }

    async findOne(id: string): Promise<IntentPrompt> {
        const found = await this.intentPromptModel.findById(id).exec();
        if (!found) throw new NotFoundException(`IntentPrompt #${id} not found`);
        return found;
    }

    async update(input: UpdateIntentPromptInput): Promise<IntentPrompt> {
        const { id, ...updateData } = input;
        const updated = await this.intentPromptModel
            .findByIdAndUpdate(id, updateData, { new: true })
            .exec();
        if (!updated) throw new NotFoundException(`IntentPrompt #${id} not found`);
        return updated;
    }

    async remove(id: string): Promise<boolean> {
        const result = await this.intentPromptModel.findByIdAndDelete(id).exec();
        if (!result) throw new NotFoundException(`IntentPrompt #${id} not found`);
        return true;
    }

    // Helper for IntentService to get active prompt for an intent
    async getPromptForIntent(siteId: string, intent: string): Promise<IntentPrompt | null> {
        return this.intentPromptModel.findOne({ siteId, intent, isActive: true }).exec();
    }

    async generatePreview(siteId: string, intent: string, prompt: string): Promise<{ html: string, css: string, js: string }> {
        // Fetch context for style adaptation
        const embedding = await this.geminiService.generateEmbedding(`Generate context for ${intent} based on this instruction: ${prompt}`);
        const filters = { must: [{ key: "siteId", match: { value: siteId } }] };
        const searchResults = await this.qdrantService.search(embedding, filters, 1);

        let contextHtml = "";
        let contextDesc = "Standard business website";

        if (searchResults.length > 0) {
            contextHtml = searchResults[0].payload.raw_html as string || "";
            contextDesc = searchResults[0].payload.description as string || "";
        }

        const site = await this.sitesService.getSiteBySiteId(siteId);

        const uiPayload = await this.geminiService.generateUiElement(
            `Generate UI for ${intent} based on this instruction: ${prompt}`,
            contextHtml,
            contextDesc,
            site.designSystem
        );

        return {
            html: uiPayload.html_payload,
            css: uiPayload.scoped_css,
            js: uiPayload.javascript_payload || ''
        };
    }
}
