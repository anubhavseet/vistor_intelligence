import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { AnalyticsService } from './analytics.service';
import { AnalyticsResolver } from './analytics.resolver';
import { VisitorSession, VisitorSessionSchema } from '../common/schemas/visitor-session.schema';
import { PageEvent, PageEventSchema } from '../common/schemas/page-event.schema';
import { Account, AccountSchema } from '../common/schemas/account.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: VisitorSession.name, schema: VisitorSessionSchema },
      { name: PageEvent.name, schema: PageEventSchema },
      { name: Account.name, schema: AccountSchema },
    ]),
  ],
  providers: [AnalyticsService, AnalyticsResolver],
  exports: [AnalyticsService],
})
export class AnalyticsModule {}
