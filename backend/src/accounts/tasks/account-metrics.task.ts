import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { VisitorSession, VisitorSessionDocument } from '../../common/schemas/visitor-session.schema';
import { Account, AccountDocument } from '../../common/schemas/account.schema';
import { AccountsService } from '../accounts.service';
import { WebhooksService } from '../../webhooks/webhooks.service';

/**
 * Scheduled Task: Update Account Metrics
 * 
 * Runs periodically to:
 * 1. Link sessions to accounts based on organization/domain
 * 2. Update account metrics and intent scores
 */
@Injectable()
export class AccountMetricsTask {
  private readonly logger = new Logger(AccountMetricsTask.name);

  constructor(
    @InjectModel(VisitorSession.name)
    private visitorSessionModel: Model<VisitorSessionDocument>,
    @InjectModel(Account.name)
    private accountModel: Model<AccountDocument>,
    private accountsService: AccountsService,
    private webhooksService: WebhooksService,
  ) {}

  /**
   * Run every hour to update account metrics
   */
  @Cron(CronExpression.EVERY_HOUR)
  async handleAccountMetricsUpdate() {
    this.logger.log('Starting account metrics update task');

    try {
      // Find sessions with organization but no account link
      const unlinkedSessions = await this.visitorSessionModel.find({
        organizationName: { $exists: true, $ne: null },
        accountId: { $exists: false },
      }).limit(100);

      for (const session of unlinkedSessions) {
        if (session.organizationName) {
          // Extract domain from organization or use a default
          const domain = this.extractDomain(session.organizationName);
          
          if (domain) {
            try {
              const account = await this.accountsService.findOrCreateAccount(
                session.siteId,
                session.organizationName,
                domain,
                session.ipHash,
              );
              
              session.accountId = account.accountId;
              await session.save();
            } catch (error) {
              this.logger.error(`Error linking session ${session.sessionId} to account:`, error.message);
            }
          }
        }
      }

      // Update metrics for all accounts
      const accounts = await this.accountModel.find({}).limit(100);
      for (const account of accounts) {
        try {
          const oldIntentScore = account.intentScore;
          const updatedAccount = await this.accountsService.updateAccountMetrics(account.accountId);
          
          // Trigger webhook if account became high-intent
          if (oldIntentScore < 70 && updatedAccount.intentScore >= 70) {
            await this.webhooksService.triggerWebhooks(
              account.siteId,
              'high_intent',
              {
                accountId: account.accountId,
                organizationName: account.organizationName,
                intentScore: updatedAccount.intentScore,
              },
            );
          }
        } catch (error) {
          this.logger.error(`Error updating metrics for account ${account.accountId}:`, error.message);
        }
      }

      this.logger.log(`Account metrics update completed. Processed ${unlinkedSessions.length} sessions and ${accounts.length} accounts`);
    } catch (error) {
      this.logger.error('Error in account metrics update task:', error.message);
    }
  }

  private extractDomain(organization: string): string | undefined {
    // Try to extract domain from org string
    const match = organization.match(/([a-zA-Z0-9-]+\.[a-zA-Z]{2,})/);
    return match ? match[1] : undefined;
  }
}
