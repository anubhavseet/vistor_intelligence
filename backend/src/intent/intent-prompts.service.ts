import { Injectable, NotFoundException } from '@nestjs/common';
import { IntentCategory } from '../common/enums/intent.enum';
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
            injectionMode: input.injectionMode || 'popup',
        });
        await created.save();

        // Generate UI in background
        try {
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
            const mutationType = input.injectionMode === 'inline' ? 'inline_inject' : 'inject';
            const uiPayload = await this.geminiService.generateUiElement(
                input.prompt,
                contextHtml,
                contextDesc,
                site.designSystem,
                mutationType,
                input.intent,
            );

            created.generatedHtml = uiPayload.html_payload;
            created.generatedCss = uiPayload.scoped_css;
            created.generatedJs = uiPayload.javascript_payload;
            created.generatedTargetSelector = uiPayload.injection_target_selector;
            created.generatedInjectionPosition = (uiPayload as any).injection_position || 'afterend';
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
    async getPromptForIntent(siteId: string, intent: IntentCategory | string): Promise<IntentPrompt | null> {
        return this.intentPromptModel.findOne({ siteId, intent, isActive: true }).exec();
    }

    async generatePreview(
        siteId: string,
        intent: IntentCategory,
        prompt: string,
        injectionMode: string = 'popup',
        promptId?: string,
    ): Promise<{ html: string, css: string, js: string, targetSelector: string, injectionPosition: string }> {
        const embedding = await this.geminiService.generateEmbedding(`Generate context for ${intent} based on this instruction: ${prompt}`);
        const filters = { must: [{ key: "siteId", match: { value: siteId } }] };
        // Fetch top 5 results and concatenate for richer selector context
        const searchResults = await this.qdrantService.search(embedding, filters, 5);

        let contextHtml = "";
        let contextDesc = "Standard business website";

        if (searchResults.length > 0) {
            // Use first result's description, but concatenate all raw_html chunks for better selector coverage
            contextDesc = searchResults[0].payload.description as string || "";
            const htmlChunks = searchResults
                .map(r => r.payload.raw_html as string || '')
                .filter(Boolean)
                .join('\n\n<!-- PAGE SECTION BREAK -->\n\n');
            // Cap at 5000 chars to fit comfortably in context window
            contextHtml = htmlChunks.slice(0, 5000);
        }

        const site = await this.sitesService.getSiteBySiteId(siteId);
        const mutationType = injectionMode === 'inline' ? 'inline_inject' : 'inject';

        const uiPayload = await this.geminiService.generateUiElement(
            `Generate UI for ${intent} based on this instruction: ${prompt}`,
            contextHtml,
            contextDesc,
            site.designSystem,
            mutationType,
            intent,
        );

        const result = {
            html: uiPayload.html_payload,
            css: uiPayload.scoped_css,
            js: uiPayload.javascript_payload || '',
            targetSelector: uiPayload.injection_target_selector || 'body',
            injectionPosition: (uiPayload as any).injection_position || 'afterend',
        };

        // Persist generated fields back to the document so they are available
        // for live injection without needing to regenerate on every request.
        if (promptId) {
            await this.intentPromptModel.findByIdAndUpdate(promptId, {
                generatedHtml: result.html,
                generatedCss: result.css,
                generatedJs: result.js,
                generatedTargetSelector: result.targetSelector,
                generatedInjectionPosition: result.injectionPosition,
                injectionMode,
            }).exec();
        }

        return result;
    }

    /**
     * Build a full page preview by fetching the raw crawled HTML from Qdrant,
     * then injecting the generated component into it at the right position.
     * Returns a self-contained HTML string for use in an iframe.
     */
    async getPagePreview(siteId: string, promptId: string): Promise<{ pageHtml: string; targetSelector: string; injectionPosition: string; injectionMode: string }> {
        const promptDoc = await this.findOne(promptId);

        // Fetch top 10 crawled page sections from Qdrant to reconstruct the full page
        const embedding = await this.geminiService.generateEmbedding('website page layout structure sections');
        const filters = { must: [{ key: "siteId", match: { value: siteId } }] };
        const searchResults = await this.qdrantService.search(embedding, filters, 10);

        const site = await this.sitesService.getSiteBySiteId(siteId);
        const baseDomain = site?.domain ? `https://${site.domain}` : '';
        const baseTag = baseDomain ? `<base href="${baseDomain}/" target="_blank">` : '';

        let rawHtml: string;
        if (searchResults.length === 0 || !searchResults[0].payload?.raw_html) {
            rawHtml = `<html><body><p style="font-family:sans-serif;padding:40px;color:#666">No crawled HTML available for this site yet. Please crawl the site first.</p></body></html>`;
        } else {
            // Concatenate all chunks to reconstruct the page body as best as possible
            const bodyChunks = searchResults
                .map(r => r.payload.raw_html as string || '')
                .filter(Boolean);

            // Wrap in a minimal HTML shell with base tag for asset resolution
            rawHtml = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  ${baseTag}
  <style>
    /* Highlight the injection target after load */
    [data-vi-preview-target] {
      outline: 3px dashed #6366f1 !important;
      outline-offset: 4px !important;
      animation: vi-target-pulse 1.5s ease-in-out 3;
    }
    @keyframes vi-target-pulse {
      0%, 100% { outline-color: #6366f1; }
      50% { outline-color: #f59e0b; }
    }
    /* Highlight the injected component */
    [data-vi-injection] {
      outline: 3px solid #22c55e !important;
      outline-offset: 2px !important;
      animation: vi-inject-flash 2s ease-in-out 2;
    }
    @keyframes vi-inject-flash {
      0%, 100% { outline-color: #22c55e; box-shadow: 0 0 0 0 rgba(34,197,94,0); }
      50% { outline-color: #16a34a; box-shadow: 0 0 0 8px rgba(34,197,94,0.2); }
    }
  </style>
</head>
<body>
${bodyChunks.join('\n')}
</body>
</html>`;
        }

        const targetSelector = (promptDoc as any).generatedTargetSelector || 'body';
        const injectionPosition = (promptDoc as any).generatedInjectionPosition || 'beforeend';
        const mode = (promptDoc as any).injectionMode || 'popup';

        const generatedHtml = (promptDoc as any).generatedHtml || '';
        const generatedCss = (promptDoc as any).generatedCss || '';
        const generatedJs = (promptDoc as any).generatedJs || '';

        // Build the injection script with preview marker on target
        const injectionScript = this.buildInjectionScript(
            targetSelector,
            injectionPosition,
            mode,
            generatedHtml,
            generatedCss,
            generatedJs,
        );

        // Also mark the target element for pulsing outline
        const targetHighlightScript = `<script>
          (function() {
            try {
              var t = document.querySelector(${JSON.stringify(targetSelector)});
              if (t) t.setAttribute('data-vi-preview-target', '1');
            } catch(e) {}
          })();
        </script>`;

        // Inject the script before </body>
        let pageHtml = rawHtml;
        if (pageHtml.includes('</body>')) {
            pageHtml = pageHtml.replace('</body>', `${injectionScript}\n${targetHighlightScript}\n</body>`);
        } else {
            pageHtml += injectionScript + targetHighlightScript;
        }

        return { pageHtml, targetSelector, injectionPosition, injectionMode: mode };
    }

    private buildInjectionScript(
        targetSelector: string,
        injectionPosition: string,
        mode: string,
        html: string,
        css: string,
        js: string,
    ): string {
        const escapedHtml = html.replace(/`/g, '\\`').replace(/\$/g, '\\$');
        const escapedCss = css.replace(/`/g, '\\`');
        const escapedJs = js.replace(/`/g, '\\`').replace(/<\/script>/gi, '<\\/script>');

        if (mode === 'inline') {
            return `
<script>
(function() {
    try {
        var target = document.querySelector(${JSON.stringify(targetSelector)});
        if (!target) target = document.body;
        var host = document.createElement('div');
        host.setAttribute('data-vi-preview-injection', 'true');
        host.style.cssText = 'position:relative;z-index:9999;';
        var shadow = host.attachShadow({ mode: 'open' });
        shadow.innerHTML = '<style>' + ${JSON.stringify(css)} + ':host{all:initial;display:block;font-family:inherit;}</style>' + ${JSON.stringify(html)};
        target.insertAdjacentElement(${JSON.stringify(injectionPosition)}, host);
        try { (new Function('document', ${JSON.stringify(js)}))(shadow); } catch(e) { console.error('[VI Preview JS]', e); }
    } catch(e) { console.error('[VI Preview Injection Error]', e); }
})();
</script>`;
        } else {
            // popup mode — fixed overlay
            return `
<script>
(function() {
    try {
        var host = document.createElement('div');
        host.setAttribute('data-vi-preview-injection', 'true');
        host.style.cssText = 'position:fixed;bottom:24px;right:24px;z-index:2147483647;font-family:sans-serif;';
        var shadow = host.attachShadow({ mode: 'open' });
        shadow.innerHTML = '<style>' + ${JSON.stringify(css)} + ':host{all:initial;display:block;font-family:inherit;}</style>' + ${JSON.stringify(html)};
        document.body.appendChild(host);
        try { (new Function('document', ${JSON.stringify(js)}))(shadow); } catch(e) { console.error('[VI Preview JS]', e); }
    } catch(e) { console.error('[VI Preview Injection Error]', e); }
})();
</script>`;
        }
    }
}
