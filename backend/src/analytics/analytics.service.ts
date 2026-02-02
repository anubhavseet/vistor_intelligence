import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { VisitorSession, VisitorSessionDocument } from '../common/schemas/visitor-session.schema';
import { PageEvent, PageEventDocument } from '../common/schemas/page-event.schema';
import { Account, AccountDocument } from '../common/schemas/account.schema';

@Injectable()
export class AnalyticsService {
  constructor(
    @InjectModel(VisitorSession.name)
    private visitorSessionModel: Model<VisitorSessionDocument>,
    @InjectModel(PageEvent.name)
    private pageEventModel: Model<PageEventDocument>,
    @InjectModel(Account.name)
    private accountModel: Model<AccountDocument>,
  ) {}

  /**
   * Get live active visitors
   */
  async getLiveVisitors(siteId: string): Promise<VisitorSession[]> {
    return this.visitorSessionModel
      .find({
        siteId,
        isActive: true,
        lastActivityAt: { $gte: new Date(Date.now() - 30 * 60 * 1000) }, // Active in last 30 min
      })
      .sort({ lastActivityAt: -1 })
      .exec();
  }

  /**
   * Get live visitor count
   */
  async getLiveVisitorCount(siteId: string): Promise<number> {
    return this.visitorSessionModel.countDocuments({
      siteId,
      isActive: true,
      lastActivityAt: { $gte: new Date(Date.now() - 30 * 60 * 1000) },
    });
  }

  /**
   * Get visitor map data (geo distribution)
   */
  async getVisitorMap(siteId: string, startDate?: Date, endDate?: Date) {
    const query: any = { siteId };
    if (startDate || endDate) {
      query.startedAt = {};
      if (startDate) query.startedAt.$gte = startDate;
      if (endDate) query.startedAt.$lte = endDate;
    }

    const sessions = await this.visitorSessionModel.find(query).exec();

    // Group by country
    const countryMap = new Map<string, number>();
    const geoPoints: Array<{ lat: number; lng: number; country: string }> = [];

    sessions.forEach((session) => {
      if (session.geo?.country) {
        countryMap.set(
          session.geo.country,
          (countryMap.get(session.geo.country) || 0) + 1,
        );
      }
      if (session.geo?.lat && session.geo?.lng) {
        geoPoints.push({
          lat: session.geo.lat,
          lng: session.geo.lng,
          country: session.geo.country || 'Unknown',
        });
      }
    });

    return {
      points: geoPoints,
      countryCounts: Array.from(countryMap.entries()).map(([country, count]) => ({
        country,
        count,
      })),
      totalVisitors: sessions.length,
    };
  }

  /**
   * Get page flow analytics
   */
  async getPageFlow(siteId: string, startDate?: Date, endDate?: Date) {
    const query: any = { siteId };
    if (startDate || endDate) {
      query.timestamp = {};
      if (startDate) query.timestamp.$gte = startDate;
      if (endDate) query.timestamp.$lte = endDate;
    }

    const events = await this.pageEventModel
      .find(query)
      .sort({ timestamp: 1 })
      .exec();

    // Group by session and build flow
    const sessionFlows = new Map<string, string[]>();
    events.forEach((event) => {
      if (!sessionFlows.has(event.sessionId)) {
        sessionFlows.set(event.sessionId, []);
      }
      if (event.eventType === 'view') {
        sessionFlows.get(event.sessionId)?.push(event.pageUrl);
      }
    });

    // Count page transitions
    const transitions = new Map<string, number>();
    sessionFlows.forEach((flow) => {
      for (let i = 0; i < flow.length - 1; i++) {
        const key = `${flow[i]} -> ${flow[i + 1]}`;
        transitions.set(key, (transitions.get(key) || 0) + 1);
      }
    });

    return {
      flows: Array.from(sessionFlows.values()),
      topTransitions: Array.from(transitions.entries())
        .sort((a, b) => b[1] - a[1])
        .slice(0, 20)
        .map(([transition, count]) => ({ transition, count })),
    };
  }

  /**
   * Get engagement trends
   */
  async getEngagementTrends(siteId: string, days: number = 30) {
    const startDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
    const sessions = await this.visitorSessionModel
      .find({
        siteId,
        startedAt: { $gte: startDate },
      })
      .exec();

    // Group by day
    const dailyStats = new Map<string, { visitors: number; pageViews: number; avgTime: number }>();

    sessions.forEach((session) => {
      const date = session.startedAt.toISOString().split('T')[0];
      if (!dailyStats.has(date)) {
        dailyStats.set(date, { visitors: 0, pageViews: 0, avgTime: 0 });
      }
      const stats = dailyStats.get(date)!;
      stats.visitors += 1;
      stats.pageViews += session.totalPageViews;
      stats.avgTime += session.totalTimeSpent;
    });

    return Array.from(dailyStats.entries())
      .map(([date, stats]) => ({
        date,
        visitors: stats.visitors,
        pageViews: stats.pageViews,
        avgTime: stats.visitors > 0 ? stats.avgTime / stats.visitors : 0,
      }))
      .sort((a, b) => a.date.localeCompare(b.date));
  }

  /**
   * Export accounts to CSV format
   */
  async exportAccountsToCSV(siteId: string): Promise<string> {
    const accounts = await this.accountModel.find({ siteId }).exec();

    const headers = ['Account ID', 'Organization', 'Domain', 'Intent Score', 'Engagement Score', 'Category', 'Total Sessions', 'Last Seen'];
    const rows = accounts.map((acc: any) => [
      acc.accountId || '',
      acc.organizationName || '',
      acc.domain || '',
      acc.intentScore || 0,
      acc.engagementScore || 0,
      acc.category || '',
      acc.totalSessions || 0,
      acc.lastSeenAt ? acc.lastSeenAt.toISOString() : '',
    ]);

    const csv = [
      headers.join(','),
      ...rows.map(row => row.map(cell => `"${cell}"`).join(',')),
    ].join('\n');

    return csv;
  }
}
