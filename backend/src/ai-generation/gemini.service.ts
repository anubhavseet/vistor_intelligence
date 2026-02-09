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

        if (apiKeysString && singleApiKey) {
            this.apiKeys = apiKeysString.split(',').map(key => key.trim()).filter(key => key.length > 0);
            this.apiKeys.push(singleApiKey);
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
            const model = this.getRotatedModel('gemini-embedding-001');
            const result = await model.embedContent({
                content: { role: 'user', parts: [{ text }] },
                outputDimensionality: 768,
            } as any);
            const embedding = result.embedding;
            return embedding.values;
        } catch (error) {
            this.logger.error('Error generating embedding', error);
            throw error;
        }
    }

    async generateUiDescription(htmlSnippet: string): Promise<string> {
        const prompt = `
      Analyze the following HTML/CSS snippet as an expert UI Designer.
      
      Extract the following strictly in 2-3 sentences:
      1. Semantics: What is this section? (e.g., Pricing Table, Hero, Navbar)
      2. Design System Tokens: 
         - Dominant Colors (Hex/RGB)
         - Typography (Serif/Sans, Size)
         - Shapes (Rounded corners radius, Sharp edges)
         - Depth (Flat, Shadowed, Glassmorphism)
      
      Output ONLY the description string.
      
      HTML Snippet:
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
        siteDesignDescription: string,
        designSystem?: any
    ): Promise<{ injection_target_selector: string; html_payload: string; scoped_css: string; javascript_payload: string }> {

        let designContext = `Site Design/Style: "${siteDesignDescription}"`;
        if (designSystem) {
            designContext += `\n
            CRITICAL DESIGN TOKENS (YOU MUST USE THESE):
            - Primary Action Color: ${designSystem.primaryColor} (Use for buttons, links, highlights)
            - Font Family: ${designSystem.fontFamily} (Apply to :host)
            - Border Radius: ${designSystem.borderRadius}
            - Background: ${designSystem.backgroundColor}
            - Text Color: ${designSystem.textColor}
            `;
        }

        const prompt = `
      You are an Elite Frontend Engineer and World-Class UI/UX Designer.
      
      Context:
      User Intent: "${userIntent}"
      Current Page Section Context (HTML): "${siteContextHtml.substring(0, 1000)}..."
      ${designContext}

      Objective:
      Generate a STUNNING, HIGH-PERFORMANCE UI component to address the user's intent. 
      This component will be injected into a Shadow DOM host on a client's website.
      It MUST feel NATIVE to the host site by using the provided design tokens exactly.

      Design Guidelines (MANDATORY):
      1. **Aesthetics**: Use "Premium Modern" design.
         - IF design tokens are provided, use them strictly.
         - Unless specified otherwise, use subtle glassmorphism (backdrop-filter: blur).
         - Use modern gradients and profound drop shadows (box-shadow: 0 10px 30px -10px rgba(...)).
         - Animations: Add smooth entry animations (e.g., fade-in-up) using CSS @keyframes.
      2. **Layout**:
         - The component is isolated in a Shadow DOM.
         - Use ':host' for the root container styles.
         - For Modals: Use polished overlays.
         - For Popups: clear visual hierarchy.
      3. **Responsiveness**: Must work perfectly on Mobile and Desktop.

      Technical Constraints (CRITICAL):
      1. **Shadow DOM Environment**:
         - DO NOT try to style 'body' or 'html'.
         - CSS classes are scoped.
         - Use the extracted font-family in :host.
      2. **JavaScript**:
         - Write standard Vanilla JS.
         - The environment proxies 'document' to the Shadow Root.
         - ALWAYS add a closing mechanism.
      3. **Closing Mechanism**:
         - You MUST include a close button with class "vi-internal-close".
         - Ensure the JS handles the click event for this button to remove the host element (or hide it).

      Response Format:
      Return ONLY valid JSON (RFC 8259 compliant). No markdown formatting.
      {
        "injection_target_selector": "The CSS selector on the HOST page where this should appear (e.g., 'body' for floating, '#product-root' for embedded)",
        "html_payload": "The HTML structure. Start with a container div with a unique ID.",
        "scoped_css": "The CSS. Use ':host' to style the wrapper. Do NOT include <style> tags.",
        "javascript_payload": "The JavaScript logic. Do NOT include <script> tags. Ensure null checks."
      }
    `;

        try {
            const model = this.getRotatedModel('gemini-2.5-flash');
            const result = await model.generateContent(prompt);
            const response = await result.response;
            const text = response.text();

            // Clean up markdown code blocks if present
            const jsonString = text.replace(/```json/g, '').replace(/```/g, '').trim();

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
