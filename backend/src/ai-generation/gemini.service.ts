import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { GoogleGenerativeAI, GenerativeModel } from '@google/generative-ai';

@Injectable()
export class GeminiService {
    private readonly logger = new Logger(GeminiService.name);
    private apiKeys: string[] = [];
    private currentKeyIndex = 0;

    constructor(private configService: ConfigService) {
        const apiKeysString = this.configService.get<string>('GEMINI_API_KEYS');
        const singleApiKey = this.configService.get<string>('GEMINI_API_KEY');

        if (apiKeysString) {
            this.apiKeys = apiKeysString.split(',').map(key => key.trim()).filter(key => key.length > 0);
        }

        if (this.apiKeys.length === 0 && singleApiKey) {
            this.apiKeys.push(singleApiKey);
        }

        if (this.apiKeys.length === 0) {
            this.logger.warn('No GEMINI_API_KEYS or GEMINI_API_KEY found in environment variables');
            this.apiKeys.push('dummy_key');
        } else {
            this.logger.log(`Loaded ${this.apiKeys.length} Gemini API keys`);
        }
    }

    private getRotatedModel(modelName: string): GenerativeModel {
        const apiKey = this.apiKeys[this.currentKeyIndex];
        // Rotate to the next key for the next request
        this.currentKeyIndex = (this.currentKeyIndex + 1) % this.apiKeys.length;

        const genAI = new GoogleGenerativeAI(apiKey);
        return genAI.getGenerativeModel({ model: modelName });
    }

    async generateEmbedding(text: string): Promise<number[]> {
        try {
            const model = this.getRotatedModel('text-embedding-004');
            const result = await model.embedContent(text);
            const embedding = result.embedding;
            return embedding.values;
        } catch (error) {
            this.logger.error('Error generating embedding', error);
            throw error;
        }
    }

    async generateUiDescription(htmlSnippet: string): Promise<string> {
        const prompt = `
      Analyze the following HTML snippet and describe its semantic purpose and visual style (colors, fonts, structure) strictly in 2-3 sentences.
      HTML:
      ${htmlSnippet}
    `;

        try {
            const model = this.getRotatedModel('gemini-2.5-flash');
            const result = await model.generateContent(prompt);
            const response = await result.response;
            return response.text();
        } catch (error) {
            this.logger.error('Error generating UI description', error);
            return 'Unknown section';
        }
    }

    async generateUiElement(
        userIntent: string,
        siteContextHtml: string,
        siteDesignDescription: string
    ): Promise<{ injection_target_selector: string; html_payload: string; scoped_css: string; javascript_payload: string }> {

        const prompt = `
      You are an expert Frontend Developer and UX Designer.
      
      Context:
      User Intent: "${userIntent}"
      Current Page Section Context (HTML): "${siteContextHtml.substring(0, 1000)}..."
      Site Design/Style: "${siteDesignDescription}"

      Task:
      Generate a responsive, beautiful UI element (HTML, CSS, and JS) to address the user's intent. 
      The UI should match the site's existing design pattern (glassmorphism, vibrant colors if applicable, or safe corporate style depending on context).
      The element should be an overlay, modal, or specific section injection.
      
      Requirements:
      1. IT MUST have a closing mechanism (e.g., specific close button).
      2. The close button MUST have the class 'vi-internal-close'.
      3. The UI should NOT block the website content unless it's a modal, but even then ensure it's user-friendly.
      4. Include separate JavaScript for interactivity (closing, animations, form handling). Use Vanilla JS.
      5. Scope CSS to the unique ID of the container to prevent leakage.
      6. Ensure the JS selects elements safely, preferably using the unique ID.

      Disclaimer:Make sure the UI is not intrusive and can be closed easily and the closeing button 
        should have "vi-internal-close"  this class every time , The generated Javascript should not have 
        any error and should be able to run in the browser same goes for HTML and CSS.

      Return ONLY a JSON object with the following structure (no markdown, no extra text):
      {
        "injection_target_selector": "The CSS selector where this element should be appended (e.g., 'body', '#pricing')",
        "html_payload": "The raw HTML of the component. Use a unique ID for the container.",
        "scoped_css": "The CSS styles. Scope them to the unique ID.",
        "javascript_payload": "The Vanilla JS logic (e.g., event listeners for closing, submission)."
      }
    `;

        try {
            const model = this.getRotatedModel('gemini-2.5-flash');
            const result = await model.generateContent(prompt);
            const response = await result.response;
            const text = response.text();

            // Clean up markdown code blocks if present
            const jsonString = text.replace(/```json/g, '').replace(/```/g, '').trim();
            console.log(jsonString);
            const parsed = JSON.parse(jsonString);

            // Ensure compat if older prompt version cached or erratic
            return {
                injection_target_selector: parsed.injection_target_selector || 'body',
                html_payload: parsed.html_payload || '',
                scoped_css: parsed.scoped_css || '',
                javascript_payload: parsed.javascript_payload || ''
            };
        } catch (error) {
            this.logger.error('Error generating UI element', error);
            // Fallback
            return {
                injection_target_selector: 'body',
                html_payload: '<div id="ai-fallback" style="position:fixed;bottom:20px;right:20px;padding:20px;background:white;box-shadow:0 4px 12px rgba(0,0,0,0.1);border-radius:8px;">How can we help you? <button class="vi-internal-close" style="margin-left:10px;">x</button></div>',
                scoped_css: '#ai-fallback { z-index: 9999; font-family: sans-serif; }',
                javascript_payload: 'document.querySelector("#ai-fallback .vi-internal-close")?.addEventListener("click", () => document.getElementById("ai-fallback").remove());'
            };
        }
    }
}
