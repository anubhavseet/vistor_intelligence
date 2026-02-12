import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { BullModule } from '@nestjs/bull';
import { TrackingService } from './tracking.service';
import { TrackingController } from './tracking.controller';
import { TrackingResolver } from './tracking.resolver';
import { VisitorSession, VisitorSessionSchema } from '../common/schemas/visitor-session.schema';
import { PageEvent, PageEventSchema } from '../common/schemas/page-event.schema';
import { RawTrackingLog, RawTrackingLogSchema } from '../common/schemas/raw-tracking-log.schema';
import { SitesModule } from '../sites/sites.module';
import { EnrichmentModule } from '../enrichment/enrichment.module';
import { AccountsModule } from '../accounts/accounts.module';
import { IntentModule } from '../intent/intent.module';
import { EnrichmentProcessor } from './processors/enrichment.processor';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: VisitorSession.name, schema: VisitorSessionSchema },
      { name: PageEvent.name, schema: PageEventSchema },
      { name: RawTrackingLog.name, schema: RawTrackingLogSchema },
    ]),
    BullModule.registerQueue({
      name: 'enrichment',
    }),
    SitesModule,
    EnrichmentModule,
    AccountsModule,
    IntentModule,
  ],
  controllers: [TrackingController],
  providers: [TrackingService, TrackingResolver, EnrichmentProcessor],
  exports: [TrackingService],
})
export class TrackingModule { }
