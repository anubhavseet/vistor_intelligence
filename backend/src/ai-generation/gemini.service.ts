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
        designSystem?: any,
        mutationType: string = 'inject',
    ): Promise<{ injection_target_selector: string; html_payload: string; scoped_css: string; javascript_payload: string; highlight_css?: string; tooltip_html?: string; css_modifications?: Record<string, string> }> {

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

      SALES STRATEGY RULES (CRITICAL — think like a top salesperson):
      1. NEVER be pushy or aggressive. Be a helpful consultant, not a carnival barker.
      2. Match the visitor's energy based on their intent:
         - Researcher → provide depth, data, case studies, comparisons
         - Price-sensitive → emphasize value, ROI, money-back guarantees, annual savings
         - Confused → simplify, guide step-by-step, offer help
         - High-intent → reduce friction, make the CTA crystal clear and obvious
         - Hesitating → reassure with social proof and low-commitment options
         - Bounce risk → give them a compelling reason to stay (special offer, free resource)
      3. Use social proof when contextually appropriate ("Join 2,000+ teams" or "Trusted by...")
      4. Create gentle urgency ONLY when genuine (limited time offers, spots remaining)
         - NEVER fabricate scarcity or create a false sense of urgency
      5. Handle objections preemptively:
         - If user was on pricing page → address value/cost concerns
         - If user was comparing alternatives → highlight unique differentiators
         - If user visited refund/cancel pages → emphasize guarantees and support
      6. Always provide an escape — NEVER trap the user. Include a clear close button.

      Design Guidelines (MANDATORY):
      1. **Aesthetics**: "Native Chameleon Mode" (Highest Priority).
         - The component MUST look like it was built by the original site developers.
         - IF design tokens are provided, use them STRICTLY.
         - IF NO design tokens are provided, analyze the 'Current Page Section Context' HTML to infer:
            - Font family (use 'inherit' or the dominant font).
            - Border radius (match the button/card radius in the snippet).
            - Shadow depth (flat, subtle, or deep - match the context).
         - DO NOT default to "Glassmorphism" or "Modern Gradients" unless the host site uses them.
         - Text Contrast: Ensure AA standard compliance.
      
      2. **Fallback Strategy** (If context is missing/ambiguous):
         - Use a "Clean, Minimalist SaaS" style.
         - Font: system-ui, -apple-system, sans-serif.
         - Background: White (#ffffff) or very light gray (#f9fafb).
         - Colors: Neutral grays for borders/text, Blue (#2563eb) for primary actions if no other color detected.
         - Shadows: Subtle (box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1)).
         - NO gradients, NO glassmorphism, NO complex animations.

      3. **Layout**:
         - The component is isolated in a Shadow DOM.
         - Use ':host' for the root container styles.
         - For Modals: Use a backdrop that matches the site's modal style (often semi-transparent black).
         - For Popups: clear visual hierarchy but matching the site's card design.

      4. **Responsiveness**: Must work perfectly on Mobile and Desktop.

      Technical Constraints (CRITICAL):
      1. **Shadow DOM Environment**:
         - DO NOT try to style 'body' or 'html'.
         - CSS classes are scoped.
         - Use the extracted font-family in :host or 'font-family: inherit'.
      2. **JavaScript**:
         - Write standard Vanilla JS.
         - The environment proxies 'document' to the Shadow Root.
         - ALWAYS add a closing mechanism.
      3. **Closing Mechanism**:
         - You MUST include a close button with class "vi-internal-close".
         - Ensure the JS handles the click event for this button to remove the host element (or hide it).

      Response Format:
      Return ONLY valid JSON (RFC 8259 compliant). No markdown formatting.
      
      ${mutationType === 'highlight' ? `
      MUTATION TYPE: HIGHLIGHT
      Instead of a popup, generate CSS to HIGHLIGHT an existing element with a pulsing effect and a contextual tooltip.
      {
        "injection_target_selector": "CSS selector of the element to highlight on the HOST page",
        "html_payload": "A small tooltip div with helpful text (1-2 sentences max)",
        "scoped_css": "CSS for the tooltip. Include a @keyframes vi-pulse animation.",
        "javascript_payload": "JS to position the tooltip near the highlighted element. Use document.querySelector.",
        "highlight_css": "The CSS to apply DIRECTLY to the target element: outline, box-shadow, animation, etc."
      }
      ` : mutationType === 'modify' ? `
      MUTATION TYPE: MODIFY
      Instead of injecting new HTML, generate CSS modifications and attribute changes to EXISTING page elements.
      {
        "injection_target_selector": "CSS selector of the element to modify on the HOST page",
        "html_payload": "",
        "scoped_css": "",
        "javascript_payload": "JS that modifies existing elements: change text content, add trust badges, modify button labels, add inline helper text. Use document.querySelector. ALWAYS add a way to revert (store originals).",
        "css_modifications": { "property": "value" }
      }
      ` : `
      MUTATION TYPE: INJECT (Standard)
      {
        "injection_target_selector": "The CSS selector on the HOST page where this should appear (e.g., 'body' for floating, '#product-root' for embedded)",
        "html_payload": "The HTML structure. Start with a container div with a unique ID.",
        "scoped_css": "The CSS. Use ':host' to style the wrapper. Do NOT include <style> tags.",
        "javascript_payload": "The JavaScript logic. Do NOT include <script> tags. Ensure null checks."
      }
      `}
    `;

        try {
            const model = this.getRotatedModel('gemini-2.5-flash');
            const result = await model.generateContent(prompt);
            const response = await result.response;
            const text = response.text();

            // Clean up markdown code blocks if present
            const jsonString = text.replace(/```json/g, '').replace(/```/g, '').trim();

            const parsed = JSON.parse(jsonString);
            this.logger.log('Generated UI element');
            // Ensure compat if older prompt version cached or erratic
            return {
                injection_target_selector: parsed.injection_target_selector || 'body',
                html_payload: parsed.html_payload || '',
                scoped_css: parsed.scoped_css || '',
                javascript_payload: parsed.javascript_payload || '',
                highlight_css: parsed.highlight_css || undefined,
                css_modifications: parsed.css_modifications || undefined,
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

    /**
     * AI Concierge: Generate conversational chat response
     * Acts as a digital salesperson — consultative, warm, never pushy
     */
    async generateChatResponse(
        visitorMessage: string,
        conversationHistory: Array<{ role: string; text: string }>,
        siteContext: string,
        interestProfile: any,
        siteName: string,
        pageUrl: string,
    ): Promise<{ message: string; suggestedActions: any[]; shouldEscalate: boolean }> {

        const historyText = conversationHistory
            .slice(-10) // Last 10 messages for context
            .map(m => `${m.role === 'user' ? 'Visitor' : 'Assistant'}: ${m.text}`)
            .join('\n');

        const interestContext = interestProfile ? `
            Visitor Profile:
            - Topics of interest: ${interestProfile.topics?.join(', ') || 'Unknown'}
            - Pages visited: ${interestProfile.pagesVisited?.join(', ') || 'Current page only'}
            - Time on pricing: ${interestProfile.timeOnPricing || 0} seconds
            - Text they copied/selected: ${interestProfile.textCopied?.join(', ') || 'None'}
            - Detected concerns: ${interestProfile.objections?.join(', ') || 'None'}
        ` : '';

        const prompt = `
You are a helpful, warm sales assistant for "${siteName}". You are embedded on their website to help visitors.

PERSONALITY:
- Be conversational and friendly, like a knowledgeable colleague — not a corporate bot
- Be consultative: understand what the visitor needs before suggesting solutions
- NEVER be pushy or salesy. If someone isn't interested, respect that gracefully
- Keep responses concise (2-3 sentences max). No walls of text
- Use the website's own content to answer accurately — don't make things up
- If you don't know something, say so honestly and suggest where to find it

SALES STRATEGY:
- Listen first, suggest second
- For researchers: provide data, comparisons, and depth
- For price-sensitive visitors: emphasize value, ROI, guarantees
- For confused visitors: simplify and guide step by step
- For high-intent visitors: reduce friction — make the next step obvious
- Handle objections through value, not pressure

WEBSITE CONTENT (use this to answer questions accurately):
${siteContext || 'No specific page content available. Answer generally based on what you know.'}

${interestContext}

CONVERSATION SO FAR:
${historyText || 'No previous messages — this is the start of the conversation.'}

CURRENT PAGE: ${pageUrl}

Visitor says: "${visitorMessage}"

Respond as a JSON object:
{
    "message": "your response to the visitor",
    "suggestedActions": [{"label": "button text", "action": "url or action_type"}],
    "shouldEscalate": false
}

Rules for suggestedActions:
- Max 2-3 buttons. Can be empty if no clear CTA.
- action can be a URL (to navigate) or: "book_demo", "start_trial", "contact_sales", "view_pricing"
- Only include relevant actions — don't spam buttons

Set shouldEscalate to true ONLY if the visitor explicitly asks to talk to a real person, has a complex issue you can't solve, or seems frustrated.

Return ONLY valid JSON. No markdown formatting.
        `;

        try {
            const model = this.getRotatedModel('gemini-2.5-flash');
            const result = await model.generateContent(prompt);
            const response = await result.response;
            const text = response.text().trim();

            // Parse JSON response
            const jsonMatch = text.match(/\{[\s\S]*\}/);
            if (!jsonMatch) throw new Error('No JSON found in response');

            const parsed = JSON.parse(jsonMatch[0]);
            return {
                message: parsed.message || "I'd be happy to help! Could you tell me more about what you're looking for?",
                suggestedActions: parsed.suggestedActions || [],
                shouldEscalate: parsed.shouldEscalate || false,
            };
        } catch (error) {
            this.logger.error('Error generating chat response', error);
            return {
                message: "I'd be happy to help! Could you tell me a bit more about what you're looking for?",
                suggestedActions: [],
                shouldEscalate: false,
            };
        }
    }
}
