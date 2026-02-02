import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { v4 as uuidv4 } from 'uuid';
import { Account, AccountDocument } from '../common/schemas/account.schema';
import { VisitorSession, VisitorSessionDocument } from '../common/schemas/visitor-session.schema';
import { IntentService } from '../intent/intent.service';

@Injectable()
export class AccountsService {
  constructor(
    @InjectModel(Account.name) private accountModel: Model<AccountDocument>,
    @InjectModel(VisitorSession.name)
    private visitorSessionModel: Model<VisitorSessionDocument>,
    private intentService: IntentService,
  ) {}

  /**
   * Find or create an account based on organization/domain
   */
  async findOrCreateAccount(
    siteId: string,
    organizationName: string,
    domain: string,
    ipHash: string,
  ): Promise<Account> {
    // Try to find existing account by domain or organization
    let account = await this.accountModel.findOne({
      siteId,
      $or: [{ domain }, { organizationName }],
    });

    if (!account) {
      // Create new account
      const accountId = `acc_${uuidv4()}`;
      account = await this.accountModel.create({
        accountId,
        siteId,
        organizationName,
        domain,
        ipHashes: [ipHash],
        firstSeenAt: new Date(),
        lastSeenAt: new Date(),
        totalSessions: 0,
        totalPageViews: 0,
        totalTimeSpent: 0,
        pagesVisited: [],
        engagementScore: 0,
        intentScore: 0,
        category: 'Looker',
        isHighIntent: false,
      });
    } else {
      // Update existing account
      if (!account.ipHashes.includes(ipHash)) {
        account.ipHashes.push(ipHash);
      }
      account.lastSeenAt = new Date();
      await account.save();
    }

    return account;
  }

  /**
   * Update account metrics from sessions
   * Should be called periodically or after significant activity
   */
  async updateAccountMetrics(accountId: string): Promise<Account> {
    const account = await this.accountModel.findOne({ accountId });
    if (!account) {
      throw new Error('Account not found');
    }

    // Aggregate all sessions for this account
    const sessions = await this.visitorSessionModel.find({
      accountId: account.accountId,
      siteId: account.siteId,
    });

    // Calculate metrics
    account.totalSessions = sessions.length;
    account.totalPageViews = sessions.reduce((sum, s) => sum + s.totalPageViews, 0);
    account.totalTimeSpent = sessions.reduce((sum, s) => sum + s.totalTimeSpent, 0);

    // Collect unique pages
    const allPages = new Set<string>();
    sessions.forEach((s) => {
      s.pagesVisited.forEach((p) => allPages.add(p));
    });
    account.pagesVisited = Array.from(allPages);

    // Calculate behavior metrics
    const pricingVisits = account.pagesVisited.filter((p) =>
      /pricing|price|plan|cost/i.test(p),
    ).length;
    const docsVisits = account.pagesVisited.filter((p) =>
      /docs|documentation|api|guide/i.test(p),
    ).length;
    const apiVisits = account.pagesVisited.filter((p) => /api|endpoint|swagger/i.test(p)).length;

    account.behaviorMetrics = {
      pricingPageVisits: pricingVisits,
      docsPageVisits: docsVisits,
      apiPageVisits: apiVisits,
      repeatVisits: sessions.length > 1 ? sessions.length - 1 : 0,
      multiUserActivity: account.ipHashes.length > 1 ? account.ipHashes.length : 0,
      avgTimePerSession: sessions.length > 0 ? account.totalTimeSpent / sessions.length : 0,
      avgPagesPerSession: sessions.length > 0 ? account.totalPageViews / sessions.length : 0,
    };

    // Calculate engagement and intent scores
    account.engagementScore = this.intentService.calculateEngagementScore(account);
    account.intentScore = this.intentService.calculateIntentScore(account);
    account.category = this.intentService.categorizeAccount(account.intentScore);
    account.isHighIntent = account.intentScore >= 70;
    account.lastIntentUpdateAt = new Date();

    return account.save();
  }

  /**
   * Get account by ID
   */
  async getAccount(accountId: string): Promise<Account> {
    return this.accountModel.findOne({ accountId });
  }

  /**
   * Get accounts for a site with search and filters
   */
  async getSiteAccounts(
    siteId: string,
    options: {
      limit?: number;
      search?: string;
      minIntentScore?: number;
      category?: string;
    } = {},
  ): Promise<Account[]> {
    const { limit = 100, search, minIntentScore, category } = options;
    
    const query: any = { siteId };
    
    if (search) {
      query.$or = [
        { organizationName: { $regex: search, $options: 'i' } },
        { domain: { $regex: search, $options: 'i' } },
      ];
    }
    
    if (minIntentScore !== undefined) {
      query.intentScore = { $gte: minIntentScore };
    }
    
    if (category) {
      query.category = category;
    }
    
    return this.accountModel
      .find(query)
      .sort({ lastSeenAt: -1 })
      .limit(limit)
      .exec();
  }

  /**
   * Get high-intent accounts
   */
  async getHighIntentAccounts(siteId: string, minScore: number = 70): Promise<Account[]> {
    return this.accountModel
      .find({
        siteId,
        intentScore: { $gte: minScore },
      })
      .sort({ intentScore: -1 })
      .exec();
  }

  /**
   * Get account timeline (sessions over time)
   */
  async getAccountTimeline(accountId: string): Promise<VisitorSession[]> {
    const account = await this.getAccount(accountId);
    if (!account) {
      return [];
    }

    return this.visitorSessionModel
      .find({
        accountId: account.accountId,
        siteId: account.siteId,
      })
      .sort({ startedAt: -1 })
      .exec();
  }
}
