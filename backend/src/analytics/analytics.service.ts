import { Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { VisitorSession, VisitorSessionDocument } from '../common/schemas/visitor-session.schema';
import { RawTrackingLog, RawTrackingLogDocument } from '../common/schemas/raw-tracking-log.schema';
import { PageEvent, PageEventDocument } from '../common/schemas/page-event.schema';
import {
  OverviewStats, ReferrerStat, GeoStat, PageStat, DailyStat, HeatMapPoint,
  AnalyticsDashboardData, PagePerformanceStat, UserFlowStat, BehavioralPatternStat,
  TopInteraction, CustomEventStat, PageSection, SectionMetric, CityStat, AreaStats, UtmCampaignStat, DeviceStat
} from './dto/analytics.types';
import { QdrantService } from '../qdrant/qdrant.service';

@Injectable()
export class AnalyticsService {
  private readonly logger = new Logger(AnalyticsService.name);

  constructor(
    @InjectModel(VisitorSession.name)
    private visitorSessionModel: Model<VisitorSessionDocument>,
    @InjectModel(RawTrackingLog.name)
    private rawTrackingLogModel: Model<RawTrackingLogDocument>,
    @InjectModel(PageEvent.name)
    private pageEventModel: Model<PageEventDocument>,
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
      { $unwind: { path: '$pagesVisited', preserveNullAndEmptyArrays: false } },
      { $match: { pagesVisited: { $exists: true, $ne: '' } } },
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

    // 6. Heatmap Points (Individual Points)
    const heatPipeline = [
      matchStage,
      { $match: { 'geo.lat': { $ne: null } } },
      {
        $project: {
          lat: '$geo.lat',
          lng: '$geo.lng',
          weight: { $literal: 1 },
          intentScore: '$intentScore',
          referrer: { $ifNull: ['$referrer', 'Direct'] },
          startedAt: { $dateToString: { format: "%Y-%m-%dT%H:%M:%S.%LZ", date: "$startedAt" } },
          city: '$geo.city',
          country: '$geo.country',
          pagesVisited: { $ifNull: ['$pagesVisited', []] },
          deviceType: '$deviceType',
          os: '$os',
          browser: '$browser',
          duration: '$totalTimeSpent',
          org: '$organizationName'
        }
      },
      { $limit: 5000 },
    ];
    const heatPoints = await this.visitorSessionModel.aggregate(heatPipeline as any[]);

    // 7. City Stats
    const cityPipeline = [
      matchStage,
      { $match: { 'geo.city': { $ne: null } } },
      {
        $group: {
          _id: { city: '$geo.city', country: '$geo.country' },
          count: { $sum: 1 },
          lat: { $first: '$geo.lat' },
          lng: { $first: '$geo.lng' }
        }
      },
      { $sort: { count: -1 } },
      { $limit: 50 }
    ];
    const cityStats = await this.visitorSessionModel.aggregate(cityPipeline as any[]);

    return {
      overview: {
        totalSessions,
        totalPageViews: overview?.totalPageViews || 0,
        avgSessionDuration: parseFloat(avgDuration.toFixed(1)),
        bounceRate: parseFloat(bounceRate.toFixed(1)),
      },
      dailyStats: dailyStats.map(d => ({ date: d._id, sessions: d.sessions, pageViews: d.pageViews })),
      heatMapPoints: heatPoints.map(h => ({
        lat: h.lat,
        lng: h.lng,
        weight: h.weight,
        avgIntent: h.intentScore,
        referrer: h.referrer,
        startedAt: h.startedAt,
        city: h.city,
        country: h.country,
        pagesVisited: h.pagesVisited.slice(0, 5),
        deviceType: h.deviceType,
        os: h.os,
        browser: h.browser,
        duration: h.duration,
        org: h.org
      })),
      cityStats: cityStats.map(c => ({ city: c._id.city, country: c._id.country, count: c.count, lat: c.lat, lng: c.lng })),
      referrers: referrers.map(r => ({ source: r._id, count: r.count })),
      geoStats: geoStats.map(g => ({ country: g._id, count: g.count })),
      topPages: topPages.map(p => ({ url: p.url, views: p.views, visitors: p.visitors })),
      pagePerformance: await this.getPagePerformance(siteId, days),
      userFlows: await this.getUserFlows(siteId, days),
      behavioralPatterns: await this.getBehavioralPatterns(siteId, days),
      topInteractions: await this.getTopInteractions(siteId, days),
      customEvents: await this.getCustomEvents(siteId, days),
    };
  }

  async getAreaStats(siteId: string, centerLat: number, centerLng: number, radiusKm: number, days: number): Promise<AreaStats> {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    // Earth radius approximation
    const R = 6378.1;

    // Use MongoDB $geoWithin if we had 2dsphere index. 
    // Assuming we might not have it or just using basic lat/lng numbers, we can use basic math or $geoWithin if it's set up.
    // For now, let's use a box approximation or simple distance filter if the dataset is small enough, 
    // OR better: if we don't have indexes, aggregation with $function or $expr is slow.
    // Ideally, we should use $geoWithin with $centerSphere.
    // Let's assume standard lat/lng storage.

    // Calculate bounding box for speed
    const latDelta = radiusKm / 111;
    const lngDelta = radiusKm / (111 * Math.cos(centerLat * (Math.PI / 180)));

    const pipeline = [
      {
        $match: {
          siteId,
          startedAt: { $gte: startDate },
          'geo.lat': { $gte: centerLat - latDelta, $lte: centerLat + latDelta },
          'geo.lng': { $gte: centerLng - lngDelta, $lte: centerLng + lngDelta }
        }
      },
      // Refine with circle distance calc if needed, but box is often close enough for "circled area" UI
      {
        $group: {
          _id: null,
          visitorCount: { $sum: 1 },
          avgIntentScore: { $avg: '$intentScore' },
          pages: { $push: '$pagesVisited' }
        }
      }
    ];

    const result = await this.visitorSessionModel.aggregate(pipeline);

    if (!result || result.length === 0) {
      return { visitorCount: 0, avgIntentScore: 0, topPages: [] };
    }

    // Process top pages manually from the array of arrays
    const pageCounts: Record<string, number> = {};
    result[0].pages.flat().forEach((p: string) => {
      if (p) pageCounts[p] = (pageCounts[p] || 0) + 1;
    });

    const topPages = Object.entries(pageCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([url]) => url);

    return {
      visitorCount: result[0].visitorCount,
      avgIntentScore: result[0].avgIntentScore || 0,
      topPages
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
        $addFields: {
          computedDwellTime: {
            $sum: {
              $map: {
                input: { $objectToArray: { $ifNull: ['$raw_signals.dwell_time', {}] } },
                as: 'item',
                in: { $cond: [{ $isNumber: '$$item.v' }, '$$item.v', 0] }
              }
            }
          }
        }
      },
      {
        $group: {
          _id: '$raw_signals.url',
          avgScrollDepth: { $avg: '$raw_signals.scroll_depth' },
          avgTimeOnPage: {
            $avg: { $divide: ['$computedDwellTime', 1000] }
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
      { $sort: { avgTimeOnPage: -1, url: 1 } },
      { $limit: 100 }
    ];

    return this.rawTrackingLogModel.aggregate(pipeline);
  }

  async getUserFlows(siteId: string, days: number): Promise<UserFlowStat[]> {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    // Bug #8 fix: All computation moved into MongoDB aggregation.
    // Previously this loaded all sessions into Node.js memory and built a Map —
    // dangerous at scale. Now the page-pair generation runs inside the DB.
    const pipeline: any[] = [
      {
        $match: {
          siteId,
          startedAt: { $gte: startDate },
          'pagesVisited.1': { $exists: true }, // At least 2 pages
        },
      },
      // Create an array of [source, target] pairs for consecutive pages
      {
        $addFields: {
          pagePairs: {
            $map: {
              input: { $range: [0, { $subtract: [{ $size: '$pagesVisited' }, 1] }] },
              as: 'idx',
              in: {
                source: { $arrayElemAt: ['$pagesVisited', '$$idx'] },
                target: { $arrayElemAt: ['$pagesVisited', { $add: ['$$idx', 1] }] },
              },
            },
          },
        },
      },
      { $unwind: '$pagePairs' },
      // Exclude self-loops and null values
      {
        $match: {
          'pagePairs.source': { $exists: true, $nin: [null, ''] },
          'pagePairs.target': { $exists: true, $nin: [null, ''] },
          $expr: { $ne: ['$pagePairs.source', '$pagePairs.target'] },
        },
      },
      {
        $group: {
          _id: { source: '$pagePairs.source', target: '$pagePairs.target' },
          count: { $sum: 1 },
        },
      },
      {
        $project: {
          source: '$_id.source',
          target: '$_id.target',
          count: 1,
          _id: 0,
        },
      },
      { $sort: { count: -1 } },
      { $limit: 15 },
    ];

    return this.visitorSessionModel.aggregate(pipeline);
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

  async getTopInteractions(siteId: string, days: number): Promise<TopInteraction[]> {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const result = await this.pageEventModel.aggregate([
      {
        $match: {
          siteId,
          timestamp: { $gte: startDate },
          eventType: 'click',
          'metadata.selector': { $exists: true }
        }
      },
      {
        $group: {
          _id: { selector: '$metadata.selector', url: '$pageUrl' },
          count: { $sum: { $ifNull: ['$metadata.count', 1] } }
        }
      },
      { $sort: { count: -1 } },
      { $limit: 10 },
      {
        $project: {
          selector: '$_id.selector',
          pageUrl: '$_id.url',
          count: 1,
          _id: 0
        }
      }
    ]);
    return result;
  }

  async getCustomEvents(siteId: string, days: number): Promise<CustomEventStat[]> {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const result = await this.pageEventModel.aggregate([
      {
        $match: {
          siteId,
          timestamp: { $gte: startDate },
          eventType: { $nin: ['view', 'scroll', 'click', 'session_start', 'session_end'] }
        }
      },
      {
        $group: {
          _id: '$eventType',
          count: { $sum: 1 },
          recentSessions: { $addToSet: '$sessionId' }
        }
      },
      {
        $project: {
          eventName: '$_id',
          count: 1,
          recentSessions: { $slice: ['$recentSessions', 5] },
          _id: 0
        }
      },
      { $sort: { count: -1 } }
    ]);
    return result;
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
        clickCount: 0
      });
    });

    // Populate click counts from PageEvents
    const interactionStats = await this.pageEventModel.aggregate([
      {
        $match: {
          siteId,
          timestamp: { $gte: startDate },
          eventType: 'click',
          'metadata.selector': { $in: Array.from(sectionStats.keys()) }
        }
      },
      {
        $group: {
          _id: '$metadata.selector',
          count: { $sum: { $ifNull: ['$metadata.count', 1] } }
        }
      }
    ]);

    const clickMap = new Map<string, number>();
    interactionStats.forEach((stat: any) => {
      clickMap.set(stat._id, stat.count);
    });

    metrics.forEach(m => {
      m.clickCount = clickMap.get(m.selector) || 0;
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

  /**
   * Get device and technology statistics
   */
  async getDeviceStats(siteId: string, days: number): Promise<DeviceStat[]> {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const pipeline: any[] = [
      {
        $match: {
          siteId,
          startedAt: { $gte: startDate },
        },
      },
      {
        $group: {
          _id: {
            deviceType: { $ifNull: ['$deviceType', 'desktop'] },
            browser: { $ifNull: ['$browser', 'Unknown'] },
          },
          visitors: { $sum: 1 },
          avgIntentScore: { $avg: '$intentScore' },
        },
      },
      {
        $project: {
          deviceType: '$_id.deviceType',
          browser: '$_id.browser',
          visitors: 1,
          avgIntentScore: { $round: ['$avgIntentScore', 1] },
          _id: 0,
        },
      },
      { $sort: { visitors: -1 } },
    ];

    return this.visitorSessionModel.aggregate(pipeline);
  }

  /**
   * Get UTM Campaign Attribution Stats
   * Parses the `utmParams` array of strings (e.g., ["utm_source=google", "utm_campaign=summer_sale"])
   */
  async getUtmCampaigns(siteId: string, days: number): Promise<UtmCampaignStat[]> {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    // This pipeline extracts source/medium/campaign using regex from string array
    const pipeline: any[] = [
      {
        $match: {
          siteId,
          startedAt: { $gte: startDate },
          utmParams: { $exists: true, $ne: [] },
        },
      },
      {
        $addFields: {
          source: {
            $arrayElemAt: [
              {
                $map: {
                  input: {
                    $filter: {
                      input: '$utmParams',
                      as: 'p',
                      cond: { $regexMatch: { input: '$$p', regex: /utm_source=/ } },
                    },
                  },
                  as: 'm',
                  in: { $substrCP: ['$$m', 11, { $strLenCP: '$$m' }] },
                },
              },
              0,
            ],
          },
          medium: {
            $arrayElemAt: [
              {
                $map: {
                  input: {
                    $filter: {
                      input: '$utmParams',
                      as: 'p',
                      cond: { $regexMatch: { input: '$$p', regex: /utm_medium=/ } },
                    },
                  },
                  as: 'm',
                  in: { $substrCP: ['$$m', 11, { $strLenCP: '$$m' }] },
                },
              },
              0,
            ],
          },
          campaign: {
            $arrayElemAt: [
              {
                $map: {
                  input: {
                    $filter: {
                      input: '$utmParams',
                      as: 'p',
                      cond: { $regexMatch: { input: '$$p', regex: /utm_campaign=/ } },
                    },
                  },
                  as: 'm',
                  in: { $substrCP: ['$$m', 13, { $strLenCP: '$$m' }] },
                },
              },
              0,
            ],
          },
          isNewVisitor: { $lt: ['$sessionCount', 2] },
          isBounce: { $eq: [{ $size: '$pagesVisited' }, 1] },
          converted: { $gte: ['$intentScore', 70] },
        },
      },
      {
        $group: {
          _id: {
            source: { $ifNull: ['$source', '(direct)'] },
            medium: { $ifNull: ['$medium', '(none)'] },
            campaign: { $ifNull: ['$campaign', '(not set)'] },
          },
          visitors: { $sum: 1 },
          newVisitors: { $sum: { $cond: ['$isNewVisitor', 1, 0] } },
          bounces: { $sum: { $cond: ['$isBounce', 1, 0] } },
          totalTimeSpent: { $sum: '$totalTimeSpent' },
          conversionCount: { $sum: { $cond: ['$converted', 1, 0] } },
        },
      },
      {
        $project: {
          source: '$_id.source',
          medium: '$_id.medium',
          campaign: '$_id.campaign',
          visitors: 1,
          newVisitors: 1,
          bounceRate: {
            $round: [
              {
                $cond: [
                  { $gt: ['$visitors', 0] },
                  { $multiply: [{ $divide: ['$bounces', '$visitors'] }, 100] },
                  0,
                ],
              },
              1,
            ],
          },
          avgTimeSpent: {
            $round: [
              {
                $cond: [
                  { $gt: ['$visitors', 0] },
                  { $divide: ['$totalTimeSpent', '$visitors'] },
                  0,
                ],
              },
              1,
            ],
          },
          conversionRate: {
            $round: [
              {
                $cond: [
                  { $gt: ['$visitors', 0] },
                  { $multiply: [{ $divide: ['$conversionCount', '$visitors'] }, 100] },
                  0,
                ],
              },
              1,
            ],
          },
          _id: 0,
        },
      },
      { $match: { visitors: { $gt: 0 } } },
      { $sort: { visitors: -1 } },
    ];

    return this.visitorSessionModel.aggregate(pipeline);
  }
}
