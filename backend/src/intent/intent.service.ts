import { Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { IntentCategory } from '../common/enums/intent.enum';
import { Account } from '../common/schemas/account.schema';
import { Site, SiteDocument } from '../common/schemas/site.schema';
import { GeminiService } from '../ai-generation/gemini.service';
import { QdrantService } from '../qdrant/qdrant.service';
import { IntentPromptsService } from './intent-prompts.service';
import { SitesService } from '../sites/sites.service';
import { SubscriptionService } from '../subscription/subscription.service';

export interface SignalBatch {
  dwell_time: Record<string, number>;
  scroll_velocity: number;
  scroll_depth?: number;
  hesitation_event: boolean;
  rage_clicks: number;
  copy_text: string[];
  text_selections?: string[];
  dead_clicks?: any[];
  events: { type: string; timestamp: number; payload?: any }[];
  interactions?: Record<string, { clicks: number; hovers: number; inputs: number; last_timestamp: number }>;
  forms?: Record<string, { time_focused: number; refills: number }>;
  performance?: { lcp?: number; cls?: number; fid?: number };
  errors?: { msg: string; stack: string; time: number }[];
  mouse_trace?: { x: number; y: number; time: number }[];
  geolocation?: { lat: number; lng: number; accuracy: number };
  url?: string;
  referrer?: string;
  localScore?: number;   // Score computed by the tracker client-side
  detectedIntent?: string; // Intent detected client-side
}

export interface IntentResult {
  score: number;
  category: 'Bouncer' | 'Researcher' | 'Lead';
  suggestedAction: string | null;
  uiPayload?: any;
  detectedIntents?: string[];
}

export interface EngagementContext {
  stage: number;
  injectionHistory: Array<{
    id: string;
    type: string;
    intent: string;
    dismissed: boolean;
    interacted: boolean;
    converted: boolean;
    timestamp: number;
  }>;
}

@Injectable()
export class IntentService {
  private readonly logger = new Logger(IntentService.name);

  constructor(
    @InjectModel(Site.name) private siteModel: Model<SiteDocument>,
    private geminiService: GeminiService,
    private qdrantService: QdrantService,
    private intentPromptsService: IntentPromptsService,
    private sitesService: SitesService,
    private subscriptionService: SubscriptionService,
  ) { }

  /**
   * Calculate Real-time Intent Score and optionally generate AI UI.
   *
   * Architecture change: UI generation is now handled client-side by the tracker
   * using prefetched payloads. The backend's role here is:
   *  1. Validate / recalculate score for persistence and analytics.
   *  2. Only generate UI server-side for the concierge chat trigger (edge case).
   */
  async analyzeAndGetUi(
    currentScore: number,
    signals: SignalBatch,
    siteId: string,
    engagementContext?: EngagementContext,
  ): Promise<IntentResult> {

    // 1. Calculate Score (Deterministic)
    // If the client already sent a localScore use it as the baseline (more accurate),
    // otherwise fall back to server-side heuristic calculation.
    let score: number;
    let category: 'Bouncer' | 'Researcher' | 'Lead';
    let suggestedAction: string | null = null;

    if (typeof signals.localScore === 'number' && signals.localScore > 0) {
      // Use client-computed score for accuracy
      score = signals.localScore;
      if (score < 30) category = 'Bouncer';
      else if (score <= 70) category = 'Researcher';
      else category = 'Lead';
    } else {
      // Fallback: server-side heuristic (for legacy / non-upgraded tracker)
      const result = this.calculateRealTimeScore(currentScore, signals);
      score = result.score;
      category = result.category;
      suggestedAction = result.suggestedAction;
    }

    // 2. Detect intents for analytics (no UI generation for regular batch events)
    const detectedIntents: string[] = [];
    const exitIntent = signals.events?.find(e => e.type === 'exit_intent');

    if (exitIntent) detectedIntents.push('bounce_risk');
    if (signals.hesitation_event) detectedIntents.push('hesitation');
    if (signals.rage_clicks > 2) detectedIntents.push('confused');
    if (category === 'Lead') detectedIntents.push('high_intent');
    if (category === 'Researcher') detectedIntents.push('researcher');

    // 3. Concierge trigger (only remaining server-side UI generation)
    // The rest of UI injection is handled client-side with prefetched payloads.
    let uiPayload = null;
    const stage = engagementContext?.stage || 0;
    const history = engagementContext?.injectionHistory || [];
    const conciergeSentThisSession = history.some(h => h.type === 'concierge');
    const recentDismissals = history.filter(h => h.dismissed && Date.now() - h.timestamp < 300000).length;

    if (!conciergeSentThisSession && stage >= 2 && score >= 50 && recentDismissals < 2) {
      let greeting = "Hi! 👋 I noticed you've been exploring — is there anything I can help you with?";
      if (detectedIntents.includes('price_sensitive')) {
        greeting = "Hi! 👋 I see you've been looking at our pricing. Happy to help you find the right plan!";
      } else if (detectedIntents.includes('confused')) {
        greeting = "Hi! 👋 It looks like you might have some questions — I'm here to help!";
      }

      uiPayload = {
        injection_target_selector: 'body',
        html_payload: greeting,
        scoped_css: '',
        javascript_payload: '',
        intent: 'general',
        type: 'concierge',
      };
      this.logger.log(`[Concierge] Triggering chat widget (stage: ${stage}, score: ${score})`);
    }

    // 4. Attach injection metadata if there's a server-side payload
    if (uiPayload) {
      const injectionId = `inj_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`;
      uiPayload.id = injectionId;
      uiPayload.persistence = 'session';
      uiPayload.priority = 5;

      // Track AI call usage
      try {
        const site = await this.sitesService.getSiteBySiteId(siteId);
        if (site?.userId) {
          await this.subscriptionService.incrementUsage(site.userId.toString(), 'aiCallsMade');
        }
      } catch (e) {
        this.logger.warn(`Failed to track AI call usage for site ${siteId}: ${e.message}`);
      }
    }

    return { score, category, suggestedAction, uiPayload, detectedIntents };
  }

  /**
   * Calculate Real-time Intent Score based on Signal Batch (Deterministic).
   * Used as a server-side fallback when no localScore is provided by the tracker.
   */
  calculateRealTimeScore(currentScore: number, signals: SignalBatch): IntentResult {
    let score = currentScore;

    if (score === 0) score = 40;

    // 1. Dwell Time Analysis (string-match fallback — less accurate on real sites)
    if (signals.dwell_time) {
      for (const [elementId] of Object.entries(signals.dwell_time)) {
        const id = elementId.toLowerCase();
        if (id.includes('pricing')) score += 15;
        else if (id.includes('features') || id.includes('benefit')) score += 5;
        else if (id.includes('testimonial') || id.includes('review')) score += 10;
        else if (id.includes('doc') || id.includes('tech')) score += 5;
      }
    }

    // 2. Behavioral Signals
    if (signals.scroll_velocity > 2000) score -= 10;
    if (signals.copy_text?.length > 0) score += 15;
    if (signals.text_selections?.length > 0) score += 10;
    if (signals.hesitation_event) score += 10;

    if (signals.scroll_depth) {
      if (signals.scroll_depth > 75) score += 10;
      else if (signals.scroll_depth > 50) score += 5;
    }

    if (signals.rage_clicks > 0) score += 5;

    score = Math.min(Math.max(score, 0), 100);

    let category: 'Bouncer' | 'Researcher' | 'Lead';
    if (score < 30) category = 'Bouncer';
    else if (score <= 70) category = 'Researcher';
    else category = 'Lead';

    const exitIntent = signals.events?.find(e => e.type === 'exit_intent');
    let suggestedAction: string | null = null;
    if (exitIntent && category === 'Lead') {
      suggestedAction = "Create a high-converting \"Wait! Don't Go\" exit-intent modal.";
    }

    return { score, category, suggestedAction };
  }

  // ─── INTENT SELECTOR MAP ──────────────────────────────────────────────────

  /**
   * Returns the stored Intent Selector Map as an array of IntentSelectorEntry objects.
   * Called by the public getIntentSelectors GraphQL query (tracker SDK).
   */
  async getIntentSelectorEntries(siteId: string): Promise<Array<{
    category: string;
    selectors: string[];
    confidence: number;
  }>> {
    const site = await this.siteModel.findOne({ siteId }).exec();
    if (!site?.intentSelectorMap) return [];

    return Object.entries(site.intentSelectorMap).map(([category, data]) => ({
      category,
      selectors: data.selectors || [],
      confidence: data.confidence || 0,
    }));
  }

  /**
   * Builds an Intent Selector Map from crawled Qdrant HTML chunks using Gemini classification.
   *
   * For each crawled HTML chunk stored in Qdrant for this site, Gemini is asked to:
   *  1. Identify the semantic category (pricing, features, testimonial, cta, docs, hero, faq, other)
   *  2. Extract the most specific stable CSS selector for the section root element.
   *
   * Results are aggregated and persisted to Site.intentSelectorMap and cached.
   *
   * This runs once after a crawl completes (triggered by the crawler processor)
   * and can be manually triggered via the rebuildIntentSelectorMap mutation.
   */
  async buildIntentSelectorMap(siteId: string): Promise<void> {
    this.logger.log(`[IntentSelectorMap] Building for site: ${siteId}`);

    // 1. Fetch all crawled chunks from Qdrant for this site (cap at 50 to limit Gemini calls)
    const points = await this.qdrantService.scroll({
      must: [{ key: 'siteId', match: { value: siteId } }]
    }, 50);

    if (!points || points.length === 0) {
      this.logger.warn(`[IntentSelectorMap] No Qdrant points found for site ${siteId}`);
      return;
    }

    this.logger.log(`[IntentSelectorMap] Processing ${points.length} Qdrant chunks in batches of 10`);

    // 2. Classify chunks in batches of 10 with a 2s delay between batches.
    //    Each call within a batch runs in parallel and uses key rotation via getRotatedModel().
    //    This prevents hitting Gemini rate limits on large crawls (100-200+ pages).
    const BATCH_SIZE = 10;
    const BATCH_DELAY_MS = 2000;
    const categoryMap: Record<string, { selectors: string[]; confidence: number }> = {};

    const classifyChunk = async (point: any): Promise<void> => {
      const rawHtml = point.payload?.raw_html as string;
      const existingSelector = point.payload?.selector as string;

      if (!rawHtml || rawHtml.trim() === '') return;

      // Truncate to first 2000 chars to keep token usage low
      const htmlSnippet = rawHtml.substring(0, 2000);

      const classificationPrompt = `You are an HTML semantic classifier for a SaaS website intelligence platform.

Given the following HTML snippet from a website page, do two things:
1. Classify the PRIMARY semantic purpose of this section.
   Categories (pick ONE): pricing | features | testimonial | faq | hero | cta | contact | docs | blog | nav | footer | other
2. Return the MOST SPECIFIC stable CSS selector for the ROOT element of this section.
   Prefer exact #id selectors if present. Otherwise use a tag+class combo. Use the existing selector hint if available.

Existing selector hint: ${existingSelector || 'none'}

HTML snippet:
${htmlSnippet}

Respond ONLY with valid JSON (no markdown, no explanation):
{"category": "pricing", "selector": "#pricing-table", "confidence": 0.92}`;

      try {
        // generateText() internally calls getRotatedModel() which rotates API keys
        const response = await this.geminiService.generateText(classificationPrompt);
        const clean = response.replace(/```json|```/g, '').trim();
        const parsed: { category: string; selector: string; confidence: number } = JSON.parse(clean);

        if (!parsed.category || !parsed.selector) return;

        const cat = parsed.category.toLowerCase().trim();
        if (!categoryMap[cat]) {
          categoryMap[cat] = { selectors: [], confidence: parsed.confidence || 0.5 };
        }
        if (!categoryMap[cat].selectors.includes(parsed.selector)) {
          categoryMap[cat].selectors.push(parsed.selector);
        }
        // Running average confidence
        categoryMap[cat].confidence = (categoryMap[cat].confidence + (parsed.confidence || 0.5)) / 2;
      } catch (e) {
        this.logger.warn(`[IntentSelectorMap] Failed to classify chunk: ${e.message}`);
      }
    };

    // Split points into batches of BATCH_SIZE and process sequentially
    for (let i = 0; i < points.length; i += BATCH_SIZE) {
      const batch = points.slice(i, i + BATCH_SIZE);
      const batchNum = Math.floor(i / BATCH_SIZE) + 1;
      const totalBatches = Math.ceil(points.length / BATCH_SIZE);

      this.logger.log(`[IntentSelectorMap] Batch ${batchNum}/${totalBatches} — classifying ${batch.length} chunks`);

      // Each chunk in the batch runs in parallel (keys rotate per call via getRotatedModel)
      await Promise.allSettled(batch.map(classifyChunk));

      // Wait between batches to respect Gemini rate limits (skip delay after the last batch)
      if (i + BATCH_SIZE < points.length) {
        await new Promise(resolve => setTimeout(resolve, BATCH_DELAY_MS));
      }
    }

    if (Object.keys(categoryMap).length === 0) {
      this.logger.warn(`[IntentSelectorMap] No classifications produced for site ${siteId}`);
      return;
    }

    // 3. Persist to Site document
    await this.siteModel.findOneAndUpdate(
      { siteId },
      {
        $set: {
          intentSelectorMap: categoryMap,
          intentSelectorMapBuiltAt: new Date(),
        }
      },
      { upsert: false }
    ).exec();

    this.logger.log(`[IntentSelectorMap] ✅ Built ${Object.keys(categoryMap).length} categories for site ${siteId}: ${Object.keys(categoryMap).join(', ')}`);
  }

  // ─── LEGACY METHODS (kept for analytics pipeline) ────────────────────────

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
