import { Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { VisitorSession, VisitorSessionDocument } from '../common/schemas/visitor-session.schema';
import { AnalyticsDashboardData } from './dto/analytics.types';

@Injectable()
export class AnalyticsService {
  private readonly logger = new Logger(AnalyticsService.name);

  constructor(
    @InjectModel(VisitorSession.name)
    private visitorSessionModel: Model<VisitorSessionDocument>,
  ) { }

  async getDashboardData(siteId: string, days: number = 30): Promise<AnalyticsDashboardData> {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const matchStage = {
      $match: {
        siteId,
        startedAt: { $gte: startDate },
      },
    };

    // 1. Overview Stats
    const overviewPipeline = [
      matchStage,
      {
        $group: {
          _id: null,
          totalSessions: { $sum: 1 },
          totalPageViews: { $sum: '$totalPageViews' },
          totalDuration: { $sum: { $subtract: [{ $ifNull: ['$endedAt', '$lastActivityAt'] }, '$startedAt'] } },
          bounces: {
            $sum: {
              $cond: [{ $lte: ['$totalPageViews', 1] }, 1, 0],
            },
          },
        },
      },
    ];

    const [overview] = await this.visitorSessionModel.aggregate(overviewPipeline);
    const totalSessions = overview?.totalSessions || 0;
    const avgDuration = totalSessions > 0 ? (overview?.totalDuration || 0) / 1000 / totalSessions : 0;
    const bounceRate = totalSessions > 0 ? ((overview?.bounces || 0) / totalSessions) * 100 : 0;

    // 2. Referrers
    const referrerPipeline = [
      matchStage,
      { $match: { referrer: { $nin: [null, ''] } } },
      {
        $group: {
          _id: '$referrer',
          count: { $sum: 1 },
        },
      },
      { $sort: { count: -1 } },
      { $limit: 10 },
    ];
    const referrers = await this.visitorSessionModel.aggregate(referrerPipeline as any[]);

    // 3. Geo Stats
    const geoPipeline = [
      matchStage,
      { $match: { 'geo.country': { $ne: null } } },
      {
        $group: {
          _id: '$geo.country',
          count: { $sum: 1 },
        },
      },
      { $sort: { count: -1 } },
      { $limit: 10 },
    ];
    const geoStats = await this.visitorSessionModel.aggregate(geoPipeline as any[]);

    // 4. Top Pages
    const pagesPipeline = [
      matchStage,
      { $unwind: '$pagesVisited' },
      {
        $group: {
          _id: '$pagesVisited',
          views: { $sum: 1 },
          visitors: { $addToSet: '$sessionId' },
        },
      },
      {
        $project: {
          url: '$_id',
          views: 1,
          visitors: { $size: '$visitors' },
        },
      },
      { $sort: { views: -1 } },
      { $limit: 10 },
    ];
    const topPages = await this.visitorSessionModel.aggregate(pagesPipeline as any[]);

    // 5. Daily Stats
    const dailyPipeline = [
      matchStage,
      {
        $group: {
          _id: {
            $dateToString: { format: '%Y-%m-%d', date: '$startedAt' },
          },
          sessions: { $sum: 1 },
          pageViews: { $sum: '$totalPageViews' },
        },
      },
      { $sort: { _id: 1 } },
    ];
    const dailyStats = await this.visitorSessionModel.aggregate(dailyPipeline as any[]);

    // 6. Heatmap Points
    const heatPipeline = [
      matchStage,
      { $match: { 'geo.lat': { $ne: null } } },
      {
        $group: {
          _id: { lat: { $round: ['$geo.lat', 1] }, lng: { $round: ['$geo.lng', 1] } },
          weight: { $sum: 1 },
          avgIntent: { $avg: '$intentScore' }
        },
      },
      { $limit: 1000 },
    ];
    const heatPoints = await this.visitorSessionModel.aggregate(heatPipeline as any[]);

    return {
      overview: {
        totalSessions,
        totalPageViews: overview?.totalPageViews || 0,
        avgSessionDuration: parseFloat(avgDuration.toFixed(1)),
        bounceRate: parseFloat(bounceRate.toFixed(1)),
      },
      dailyStats: dailyStats.map(d => ({ date: d._id, sessions: d.sessions, pageViews: d.pageViews })),
      heatMapPoints: heatPoints.map(h => ({ lat: h._id.lat, lng: h._id.lng, weight: h.weight, avgIntent: h.avgIntent })),
      referrers: referrers.map(r => ({ source: r._id, count: r.count })),
      geoStats: geoStats.map(g => ({ country: g._id, count: g.count })),
      topPages: topPages.map(p => ({ url: p.url, views: p.views, visitors: p.visitors })),
    };
  }

  async exportAccountsToCSV(siteId: string): Promise<string> {
    const sessions = await this.visitorSessionModel.find({ siteId }).sort({ startedAt: -1 }).limit(1000).exec();

    if (!sessions || sessions.length === 0) {
      return 'No data found';
    }

    const header = [
      'Session ID',
      'Organization',
      'Date',
      'Duration (s)',
      'Page Views',
      'City',
      'Country',
      'Referrer'
    ].join(',');

    const rows = sessions.map(session => {
      const date = new Date(session.startedAt).toISOString().split('T')[0];
      const duration = session.totalTimeSpent || 0;
      const org = session.organizationName || 'Anonymous';
      const city = session.geo?.city || 'Unknown';
      const country = session.geo?.country || 'Unknown';
      const referrer = session.referrer || 'Direct';

      return [
        session.sessionId,
        `"${org.replace(/"/g, '""')}"`,
        date,
        duration,
        session.totalPageViews,
        `"${city.replace(/"/g, '""')}"`,
        `"${country.replace(/"/g, '""')}"`,
        `"${referrer.replace(/"/g, '""')}"`
      ].join(',');
    });

    return [header, ...rows].join('\n');
  }
}
