import { Injectable, Logger } from '@nestjs/common';
import { Account } from '../common/schemas/account.schema';
import { GeminiService } from '../ai-generation/gemini.service';
import { QdrantService } from '../qdrant/qdrant.service';

export interface SignalBatch {
  dwell_time: Record<string, number>;
  scroll_velocity: number;
  hesitation_event: boolean;
  rage_clicks: number;
  copy_text: string[];
  events: { type: string; timestamp: number }[];
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
    // Trigger criteria: Lead score OR High Researcher with hesitation
    const shouldTriggerAi = (category === 'Lead') || (category === 'Bouncer') || (category === 'Researcher' && signals.hesitation_event) || (suggestedAction !== null);

    if (shouldTriggerAi) {
      try {
        // A. Understand Context
        // Determine what the user is interested in based on dwell time or copy text
        let queryText = "General interest in product";
        const interests: string[] = [];

        if (signals.copy_text && signals.copy_text.length > 0) {
          interests.push(...signals.copy_text);
        }

        if (signals.dwell_time) {
          // Sort by time descending
          const sortedDwell = Object.entries(signals.dwell_time)
            .sort(([, a], [, b]) => b - a)
            .slice(0, 3); // Top 3 elements

          if (sortedDwell.length > 0) {
            interests.push(...sortedDwell.map(([id]) => id));
          }
        }

        if (interests.length > 0) {
          queryText = interests.join(' ');
        }

        // B. Search Semantic Context
        // const embedding = await this.geminiService.generateEmbedding(queryText);
        // const searchResults = await this.qdrantService.search(embedding, {
        //   must: [
        //     { key: "siteId", match: { value: siteId } }
        //   ]
        // }, 1);

        // if (searchResults.length > 0) {
        //   const context = searchResults[0].payload;

        //   this.logger.log(`Generating UI for intent: ${suggestedAction || 'Engagement'} on context: ${context.selector}`);

        // C. Generate UI
        // uiPayload = await this.geminiService.generateUiElement(
        //   suggestedAction || "High intent engagement",
        //   (context.raw_html as string) || "",
        //   (context.description as string) || "Standard business website"
        // );
        // }

        uiPayload = await this.geminiService.generateUiElement(
          suggestedAction || "High intent engagement",
          "",
          "Standard business website"
        );
      } catch (e) {
        this.logger.error('Failed to generate AI UI', e);
        // Fail silently and return just the score/action
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
    if (signals.hesitation_event) score += 10; // Considered clicking CTA

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
        suggestedAction = 'discount_modal';
      }
      // If Bouncer, do nothing (null)
    } else {
      if (score > 10) suggestedAction = 'priority_support_chat'
      if (score > 80) suggestedAction = 'priority_support_chat';
      else if (score > 50) suggestedAction = 'lure_custoumers_to_contact_Us_with_discount_or_offer';
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
