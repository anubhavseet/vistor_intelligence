import { Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { VisitorSession, VisitorSessionDocument } from '../common/schemas/visitor-session.schema';
import { RawTrackingLog, RawTrackingLogDocument } from '../common/schemas/raw-tracking-log.schema';
import { AnalyticsDashboardData, PagePerformanceStat, UserFlowStat, BehavioralPatternStat, PageSection, SectionMetric } from './dto/analytics.types';
import { QdrantService } from '../qdrant/qdrant.service';

@Injectable()
export class AnalyticsService {
  private readonly logger = new Logger(AnalyticsService.name);

  constructor(
    @InjectModel(VisitorSession.name)
    private visitorSessionModel: Model<VisitorSessionDocument>,
    @InjectModel(RawTrackingLog.name)
    private rawTrackingLogModel: Model<RawTrackingLogDocument>,
    private qdrantService: QdrantService,
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
      pagePerformance: await this.getPagePerformance(siteId, days),
      userFlows: await this.getUserFlows(siteId, days),
      behavioralPatterns: await this.getBehavioralPatterns(siteId, days),
    };
  }

  async getPagePerformance(siteId: string, days: number): Promise<PagePerformanceStat[]> {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const pipeline: any[] = [
      {
        $match: {
          siteId,
          timestamp: { $gte: startDate },
          'raw_signals.url': { $exists: true }
        }
      },
      {
        $group: {
          _id: '$raw_signals.url',
          avgScrollDepth: { $avg: '$raw_signals.scroll_depth' },
          avgTimeOnPage: {
            $avg: {
              $divide: [{ $ifNull: ['$raw_signals.dwell_time.total', 0] }, 1000]
            }
          },
          rageClicks: { $sum: '$raw_signals.rage_clicks' }
        }
      },
      {
        $project: {
          url: '$_id',
          avgScrollDepth: { $round: ['$avgScrollDepth', 2] },
          avgTimeOnPage: { $round: ['$avgTimeOnPage', 1] },
          rageClicks: 1
        }
      },
      { $sort: { avgTimeOnPage: -1 } },
      { $limit: 10 }
    ];

    return this.rawTrackingLogModel.aggregate(pipeline);
  }

  async getUserFlows(siteId: string, days: number): Promise<UserFlowStat[]> {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const pipeline = [
      {
        $match: {
          siteId,
          startedAt: { $gte: startDate },
          'pagesVisited.1': { $exists: true } // At least 2 pages
        }
      },
      {
        $project: {
          pagesVisited: 1
        }
      }
    ];

    const sessions = await this.visitorSessionModel.aggregate(pipeline);
    const flowMap = new Map<string, number>();

    sessions.forEach(session => {
      const pages = session.pagesVisited;
      for (let i = 0; i < pages.length - 1; i++) {
        const source = pages[i];
        const target = pages[i + 1];
        if (source && target && source !== target) {
          const key = `${source}|${target}`;
          flowMap.set(key, (flowMap.get(key) || 0) + 1);
        }
      }
    });

    const flows: UserFlowStat[] = [];
    flowMap.forEach((count, key) => {
      const [source, target] = key.split('|');
      flows.push({ source, target, count });
    });

    return flows.sort((a, b) => b.count - a.count).slice(0, 15);
  }

  async getBehavioralPatterns(siteId: string, days: number): Promise<BehavioralPatternStat[]> {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    // 1. Rage Clicks
    const rageClickPipeline = [
      {
        $match: {
          siteId,
          timestamp: { $gte: startDate },
          'raw_signals.rage_clicks': { $gt: 0 }
        }
      },
      {
        $group: {
          _id: null,
          count: { $sum: 1 },
          sessionIds: { $addToSet: '$sessionId' }
        }
      }
    ];
    const rageResult = await this.rawTrackingLogModel.aggregate(rageClickPipeline);

    // 2. Dead Clicks (High error rate)
    const deadClickPipeline = [
      {
        $match: {
          siteId,
          timestamp: { $gte: startDate },
          'raw_signals.errors': { $ne: [] }
        }
      },
      {
        $group: {
          _id: null,
          count: { $sum: 1 },
          sessionIds: { $addToSet: '$sessionId' }
        }
      }
    ];
    const deadResult = await this.rawTrackingLogModel.aggregate(deadClickPipeline);

    return [
      {
        pattern: 'Rage Clicks',
        count: rageResult[0]?.count || 0,
        sessionIds: (rageResult[0]?.sessionIds || []).slice(0, 5)
      },
      {
        pattern: 'JS Errors',
        count: deadResult[0]?.count || 0,
        sessionIds: (deadResult[0]?.sessionIds || []).slice(0, 5)
      }
    ];
  }

  async getPageSections(siteId: string, url: string): Promise<PageSection[]> {
    try {
      let points = await this.qdrantService.scroll(
        {
          must: [
            { key: 'siteId', match: { value: siteId } },
            { key: 'url', match: { value: url } }
          ]
        },
        200
      );

      // Retry with/without trailing slash if no points found
      if (points.length === 0) {
        const altUrl = url.endsWith('/') ? url.slice(0, -1) : `${url}/`;
        points = await this.qdrantService.scroll(
          {
            must: [
              { key: 'siteId', match: { value: siteId } },
              { key: 'url', match: { value: altUrl } }
            ]
          },
          200
        );
      }

      return points.map(item => ({
        selector: item.payload?.selector as string,
        html: item.payload?.raw_html as string,
        description: item.payload?.description as string
      }));
    } catch (error) {
      this.logger.error(`Error fetching page sections for ${url}`, error);
      return [];
    }
  }

  async getSectionMetrics(siteId: string, url: string, days: number): Promise<SectionMetric[]> {
    // Aggregate dwell time from raw_tracking_logs for this specific URL
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const pipeline = [
      {
        $match: {
          siteId,
          timestamp: { $gte: startDate },
          'raw_signals.url': url
        }
      },
      {
        $project: {
          dwell_time: '$raw_signals.dwell_time'
        }
      }
    ];

    const logs = await this.rawTrackingLogModel.aggregate(pipeline);

    // Calculate metrics in code because dwell_time is a dynamic map
    const sectionStats = new Map<string, { totalTime: number, visits: number }>();

    logs.forEach(log => {
      const dwellMap = log.dwell_time || {};
      Object.keys(dwellMap).forEach(selector => {
        if (selector === 'total') return;

        const time = dwellMap[selector];
        const current = sectionStats.get(selector) || { totalTime: 0, visits: 0 };
        sectionStats.set(selector, {
          totalTime: current.totalTime + time,
          visits: current.visits + 1
        });
      });
    });

    const metrics: SectionMetric[] = [];
    sectionStats.forEach((stat, selector) => {
      metrics.push({
        selector,
        avgDwellTime: parseFloat((stat.totalTime / stat.visits / 1000).toFixed(2)),
        clickCount: 0 // Placeholder, requires click tracking per element in future
      });
    });

    return metrics.sort((a, b) => b.avgDwellTime - a.avgDwellTime);
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
