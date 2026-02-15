import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { AnalyticsService } from './analytics.service';
import { AnalyticsResolver } from './analytics.resolver';
import { VisitorSession, VisitorSessionSchema } from '../common/schemas/visitor-session.schema';
import { RawTrackingLog, RawTrackingLogSchema } from '../common/schemas/raw-tracking-log.schema';
import { PageEvent, PageEventSchema } from '../common/schemas/page-event.schema';
import { QdrantModule } from '../qdrant/qdrant.module';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: VisitorSession.name, schema: VisitorSessionSchema },
      { name: RawTrackingLog.name, schema: RawTrackingLogSchema },
      { name: PageEvent.name, schema: PageEventSchema },
    ]),
    QdrantModule,
  ],
  providers: [AnalyticsService, AnalyticsResolver],
  exports: [AnalyticsService, AnalyticsResolver],
})
export class AnalyticsModule { }
