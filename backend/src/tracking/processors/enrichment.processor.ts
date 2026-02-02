import { Processor, Process } from '@nestjs/bull';
import { Logger } from '@nestjs/common';
import { Job } from 'bull';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { VisitorSession, VisitorSessionDocument } from '../../common/schemas/visitor-session.schema';
import { EnrichmentService } from '../../enrichment/enrichment.service';

/**
 * Enrichment Processor
 * 
 * Background job processor for enriching visitor sessions with geo and org data.
 * Runs asynchronously to avoid blocking the ingestion pipeline.
 */
@Processor('enrichment')
export class EnrichmentProcessor {
  private readonly logger = new Logger(EnrichmentProcessor.name);

  constructor(
    @InjectModel(VisitorSession.name)
    private visitorSessionModel: Model<VisitorSessionDocument>,
    private enrichmentService: EnrichmentService,
  ) {}

  @Process()
  async handleEnrichment(job: Job<{ sessionId: string; ipAddress: string }>) {
    const { sessionId, ipAddress } = job.data;

    try {
      const session = await this.visitorSessionModel.findById(sessionId);
      if (!session) {
        this.logger.warn(`Session ${sessionId} not found for enrichment`);
        return;
      }

      // Enrich IP
      const enrichment = await this.enrichmentService.enrichIP(ipAddress);
      if (!enrichment) {
        this.logger.warn(`Enrichment failed for session ${sessionId}`);
        return;
      }

      // Update session with geo data
      if (enrichment.geo) {
        session.geo = enrichment.geo;
      }
      if (enrichment.flags) {
        session.flags = enrichment.flags;
      }

      // If organization detected, store organization name
      // Account linking will be handled by a separate background job
      if (enrichment.organization) {
        session.organizationName = enrichment.organization;
      }

      await session.save();
      this.logger.log(`Enriched session ${sessionId}`);
    } catch (error) {
      this.logger.error(`Error enriching session ${sessionId}:`, error.message);
      throw error; // Retry job
    }
  }
}
