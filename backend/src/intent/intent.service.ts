import { Injectable, Logger } from '@nestjs/common';
import { Account } from '../common/schemas/account.schema';
import { GeminiService } from '../ai-generation/gemini.service';
import { QdrantService } from '../qdrant/qdrant.service';
import { IntentPromptsService } from './intent-prompts.service';
import { SitesService } from '../sites/sites.service';

export interface SignalBatch {
  dwell_time: Record<string, number>;
  scroll_velocity: number;
  scroll_depth?: number; // New
  hesitation_event: boolean;
  rage_clicks: number;
  copy_text: string[];
  text_selections?: string[]; // New
  dead_clicks?: any[]; // New
  events: { type: string; timestamp: number; payload?: any }[]; // Added payload
  interactions?: Record<string, { clicks: number; hovers: number; inputs: number; last_timestamp: number }>;
  forms?: Record<string, { time_focused: number; refills: number }>;
  performance?: { lcp?: number; cls?: number; fid?: number };
  errors?: { msg: string; stack: string; time: number }[];
  mouse_trace?: { x: number; y: number; time: number }[];
  url?: string;
  referrer?: string; // New
}

export interface IntentResult {
  score: number;
  category: 'Bouncer' | 'Researcher' | 'Lead';
  suggestedAction: string | null;
  uiPayload?: any;
}

@Injectable()
export class IntentService {
  private readonly logger = new Logger(IntentService.name);

  constructor(
    private geminiService: GeminiService,
    private qdrantService: QdrantService,
    private intentPromptsService: IntentPromptsService,
    private sitesService: SitesService,
  ) { }

  /**
   * Calculate Real-time Intent Score and optionally generate AI UI
   */
  async analyzeAndGetUi(
    currentScore: number,
    signals: SignalBatch,
    siteId: string
  ): Promise<IntentResult> {

    // 1. Calculate Score (Deterministic)
    const { score, category, suggestedAction } = this.calculateRealTimeScore(currentScore, signals);

    let uiPayload = null;

    // 2. Trigger AI Generation if Intent is High or specific trigger
    const exitIntent = signals.events ? signals.events.find(e => e.type === 'exit_intent') : null;
    const isHesitating = signals.hesitation_event;

    // Determine mapping to IntentPrompt keys
    let intentKey = null;
    if (exitIntent) intentKey = 'bounce_risk';
    else if (isHesitating) intentKey = 'hesitation';
    else if (category === 'Lead') intentKey = 'high_intent';
    else if (category === 'Researcher') intentKey = 'researcher';

    // Check if we should trigger based on having a valid intent key or existing logic
    const shouldTriggerAi = intentKey || (category === 'Lead') || (suggestedAction !== null);

    if (shouldTriggerAi) {
      try {
        // Check site settings for pre-generated UI preference
        const site = await this.sitesService.getSiteBySiteId(siteId);
        let usePreGenerated = site.settings?.usePreGeneratedIntentUI || false;

        if (usePreGenerated && intentKey) {
          // Use pre-generated UI from IntentPrompt
          const customPrompt = await this.intentPromptsService.getPromptForIntent(siteId, intentKey);

          if (customPrompt && customPrompt.generatedHtml) {
            this.logger.log(`Using pre-generated UI for intent '${intentKey}'`);
            uiPayload = {
              injection_target_selector: 'body',
              html_payload: customPrompt.generatedHtml,
              scoped_css: customPrompt.generatedCss || '',
              javascript_payload: customPrompt.generatedJs || ''
            };
          } else {
            this.logger.warn(`No pre-generated UI found for intent '${intentKey}', falling back to on-the-go generation`);
            usePreGenerated = false; // Fallback to on-the-go generation
          }
        }

        // If not using pre-generated UI, generate on-the-go
        if (!usePreGenerated || !uiPayload) {
          // A. Understand Context
          let queryText = "General interest in product";
          const interests: string[] = [];

          // 1. Text Copy (Strongest)
          if (signals.copy_text && signals.copy_text.length > 0) {
            interests.push(...signals.copy_text);
          }

          // 2. Text Selection (Strong)
          if (signals.text_selections && signals.text_selections.length > 0) {
            interests.push(...signals.text_selections);
          }

          // 3. Dwell Time (Medium)
          if (signals.dwell_time) {
            const sortedDwell = Object.entries(signals.dwell_time)
              .sort(([, a], [, b]) => b - a)
              .slice(0, 3);
            if (sortedDwell.length > 0) {
              interests.push(...sortedDwell.map(([id]) => id.replace(/-/g, ' ')));
            }
          }

          // 4. Dead Clicks (Frustration Context)
          if (signals.dead_clicks && signals.dead_clicks.length > 0) {
            // Maybe search for what they clicked on? For now, we use it to adjust tone.
            interests.push(`User frustrated interacting with ${signals.dead_clicks[0].selector}`);
          }

          if (interests.length > 0) {
            queryText = interests.join(' ');
          }

          // B. Search Semantic Context
          const embedding = await this.geminiService.generateEmbedding(queryText);

          const filters: any = {
            must: [
              { key: "siteId", match: { value: siteId } }
            ]
          };
          if (signals.url.includes("localhost")) {
            filters.must.push({ key: "url", match: { value: `${site.domain}${signals.url.split("/")[3]}` } });
          } else if (signals.url) {
            filters.must.push({ key: "url", match: { value: signals.url } });
          }

          const searchResults = await this.qdrantService.search(embedding, filters, 1);
          const context = searchResults.length > 0 ? searchResults[0].payload : null;
          console.log("Context:", context);
          // C. Fetch Custom Prompt
          let instruction = suggestedAction || "High intent engagement";

          // Enhance instruction with behavioral narrative
          let behaviorNarrative = "";
          if (signals.scroll_depth && signals.scroll_depth > 80) behaviorNarrative += "User has read the entire page. ";
          if (signals.text_selections && signals.text_selections.length > 0) behaviorNarrative += `User highlighted terms: "${signals.text_selections.slice(0, 3).join(', ')}". `;
          if (signals.dead_clicks && signals.dead_clicks.length > 0) behaviorNarrative += "User appears frustrated, clicking on static elements. Offer help. ";
          if (signals.referrer) {
            try {
              const currentHost = signals.url ? new URL(signals.url).hostname : '';
              const refHost = new URL(signals.referrer).hostname;
              if (currentHost && refHost !== currentHost) behaviorNarrative += `Incoming from: ${signals.referrer}. `;
            } catch (e) { }
          }

          if (behaviorNarrative) instruction += ` Context: ${behaviorNarrative}`;

          if (intentKey) {
            const customPrompt = await this.intentPromptsService.getPromptForIntent(siteId, intentKey);
            if (customPrompt) {
              instruction = customPrompt.prompt + ` Context: ${behaviorNarrative}`;
              this.logger.log(`Using custom prompt for intent '${intentKey}': ${instruction.substring(0, 50)}...`);
            }
          }

          if (context) {
            this.logger.log(`Generating UI on-the-go for intent: ${intentKey} on context: ${context.selector}`);
            uiPayload = await this.geminiService.generateUiElement(
              instruction,
              (context.raw_html as string) || "",
              (context.description as string) || "Standard business website",
              site.designSystem
            );
          } else {
            uiPayload = await this.geminiService.generateUiElement(
              instruction,
              "",
              "Standard business website",
              site.designSystem
            );
          }
        }

      } catch (e) {
        this.logger.error('Failed to generate AI UI', e);
      }
    }

    return { score, category, suggestedAction, uiPayload };
  }

  /**
   * Calculate Real-time Intent Score based on Signal Batch (Deterministic)
   */
  calculateRealTimeScore(currentScore: number, signals: SignalBatch): IntentResult {
    let score = currentScore;

    // Baseline if starting fresh
    if (score === 0) score = 40;

    // 1. Dwell Time Analysis
    if (signals.dwell_time) {
      for (const [elementId, duration] of Object.entries(signals.dwell_time)) {
        const id = elementId.toLowerCase();
        if (id.includes('pricing')) score += 15;
        else if (id.includes('features') || id.includes('benefit')) score += 5;
        else if (id.includes('testimonial') || id.includes('review')) score += 10;
        else if (id.includes('doc') || id.includes('tech')) score += 5;
      }
    }

    // 2. Behavioral Signals
    if (signals.scroll_velocity > 2000) score -= 10; // Fast scrolling = scanning
    if (signals.copy_text && signals.copy_text.length > 0) score += 15; // High interest
    if (signals.text_selections && signals.text_selections.length > 0) score += 10; // Reading detail
    if (signals.hesitation_event) score += 10; // Considered clicking CTA

    // Scroll Depth
    if (signals.scroll_depth) {
      if (signals.scroll_depth > 75) score += 10;
      else if (signals.scroll_depth > 50) score += 5;
    }

    // Dead Clicks / Rage Clicks (Ambiguous - could be high intent but frustrated)
    if (signals.rage_clicks > 0 || (signals.dead_clicks && signals.dead_clicks.length > 0)) {
      // We don't dock points, but we change category to 'Frustrated' logic handled in UI generation
      score += 5; // They are trying to do something
    }

    // 3. Exit Intent Logic
    const exitIntent = signals.events ? signals.events.find(e => e.type === 'exit_intent') : null;

    // Clamp Score
    score = Math.min(Math.max(score, 0), 100);

    // 4. Categorization
    let category: 'Bouncer' | 'Researcher' | 'Lead';
    if (score < 30) category = 'Bouncer';
    else if (score <= 70) category = 'Researcher';
    else category = 'Lead';

    // 5. Action Triggers
    let suggestedAction: string | null = null;

    if (exitIntent) {
      if (category === 'Lead') {
        suggestedAction = 'Create a high-converting "Wait! Don\'t Go" exit-intent modal offering a special 10% discount code to retain the user.';
      }
      // If Bouncer, do nothing (null)
    } else {
      if (score > 80) suggestedAction = 'Generate a sophisticated, non-intrusive priority support chat invitation widget floating at the bottom right.';
      else if (score > 50) suggestedAction = 'Create a subtle slide-in notification suggesting they contact us for a personalized offer.';
    }

    return { score, category, suggestedAction };
  }

  // Keeping legacy methods for compatibility
  calculateEngagementScore(account: Account): number {
    let score = 0;
    score += Math.min(account.totalSessions * 5, 30);
    score += Math.min(account.totalPageViews * 0.5, 20);
    score += Math.min(account.totalTimeSpent / 60, 20);
    if (account.behaviorMetrics?.repeatVisits) {
      score += Math.min(account.behaviorMetrics.repeatVisits * 3, 15);
    }
    if (account.behaviorMetrics?.multiUserActivity && account.behaviorMetrics.multiUserActivity > 1) {
      score += Math.min((account.behaviorMetrics.multiUserActivity - 1) * 5, 15);
    }
    return Math.min(Math.round(score), 100);
  }

  calculateIntentScore(account: Account): number {
    let score = 0;
    if (account.behaviorMetrics?.pricingPageVisits) {
      score += Math.min(account.behaviorMetrics.pricingPageVisits * 10, 30);
    }
    if (account.behaviorMetrics?.docsPageVisits) {
      score += Math.min(account.behaviorMetrics.docsPageVisits * 5, 25);
    }
    if (account.behaviorMetrics?.apiPageVisits) {
      score += Math.min(account.behaviorMetrics.apiPageVisits * 8, 20);
    }
    if (account.behaviorMetrics?.repeatVisits) {
      score += Math.min(account.behaviorMetrics.repeatVisits * 4, 20);
    }
    if (account.behaviorMetrics?.multiUserActivity && account.behaviorMetrics.multiUserActivity > 1) {
      score += Math.min((account.behaviorMetrics.multiUserActivity - 1) * 5, 15);
    }
    const daysSinceLastVisit = (Date.now() - account.lastSeenAt.getTime()) / (1000 * 60 * 60 * 24);
    const recencyMultiplier = Math.max(0, 1 - daysSinceLastVisit / 30);
    score = score * (0.5 + 0.5 * recencyMultiplier);
    if (account.behaviorMetrics?.avgTimePerSession) {
      score += Math.min(account.behaviorMetrics.avgTimePerSession / 60, 10);
    }
    return Math.min(Math.round(score), 100);
  }

  categorizeAccount(intentScore: number): 'Looker' | 'Researching' | 'High Intent' {
    if (intentScore >= 70) return 'High Intent';
    else if (intentScore >= 40) return 'Researching';
    else return 'Looker';
  }

  getRecommendedAction(account: Account): string {
    if (account.intentScore >= 70) return 'Immediate outreach - high buying intent detected';
    else if (account.intentScore >= 50) return 'Warm outreach - strong research signals';
    else if (account.behaviorMetrics?.pricingPageVisits) return 'Monitor closely - pricing page interest';
    else if (account.behaviorMetrics?.docsPageVisits) return 'Nurture with content - active research';
    else return 'Continue monitoring - early stage';
  }
}
