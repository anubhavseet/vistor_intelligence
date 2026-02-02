import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { EnrichmentService } from './enrichment.service';

@Module({
  imports: [HttpModule.register({ timeout: 5000 })],
  providers: [EnrichmentService],
  exports: [EnrichmentService],
})
export class EnrichmentModule {}
