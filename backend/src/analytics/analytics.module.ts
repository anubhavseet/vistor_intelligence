import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { AnalyticsService } from './analytics.service';
import { AnalyticsResolver } from './analytics.resolver';
import { VisitorSession, VisitorSessionSchema } from '../common/schemas/visitor-session.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: VisitorSession.name, schema: VisitorSessionSchema },
    ]),
  ],
  providers: [AnalyticsService, AnalyticsResolver],
  exports: [AnalyticsService, AnalyticsResolver],
})
export class AnalyticsModule { }
