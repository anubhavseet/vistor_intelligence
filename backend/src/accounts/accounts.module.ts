import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { AccountsService } from './accounts.service';
import { AccountsResolver } from './accounts.resolver';
import { AccountsController } from './accounts.controller';
import { AccountMetricsTask } from './tasks/account-metrics.task';
import { Account, AccountSchema } from '../common/schemas/account.schema';
import { VisitorSession, VisitorSessionSchema } from '../common/schemas/visitor-session.schema';
import { IntentModule } from '../intent/intent.module';
import { AnalyticsModule } from '../analytics/analytics.module';
import { WebhooksModule } from '../webhooks/webhooks.module';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Account.name, schema: AccountSchema },
      { name: VisitorSession.name, schema: VisitorSessionSchema },
    ]),
    IntentModule,
    AnalyticsModule,
    WebhooksModule,
  ],
  controllers: [AccountsController],
  providers: [AccountsService, AccountsResolver, AccountMetricsTask],
  exports: [AccountsService],
})
export class AccountsModule {}
