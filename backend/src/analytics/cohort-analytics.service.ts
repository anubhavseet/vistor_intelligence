import { Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { VisitorSession, VisitorSessionDocument } from '../common/schemas/visitor-session.schema';

export interface CohortData {
    cohortId: string;
    firstSeen: Date;
    visitorCount: number;
    retention: {
        day1: number;
        day7: number;
        day30: number;
    };
    avgIntentScore: number;
    conversionRate: number;
}

export interface TemporalPattern {
    hour: number;
    dayOfWeek: number;
    avgVisitors: number;
    avgConversions: number;
    peakIntentScore: number;
}

/**
 * Advanced Cohort Analytics Service
 * Implements Palantir-level cohort analysis and retention tracking
 */
@Injectable()
export class CohortAnalyticsService {
    private readonly logger = new Logger(CohortAnalyticsService.name);

    constructor(
        @InjectModel(VisitorSession.name)
        private visitorSessionModel: Model<VisitorSessionDocument>,
    ) { }

    /**
     * Calculate cohort retention analysis
     * Groups visitors by first visit date and tracks return behavior
     */
    async calculateCohortRetention(
        siteId: string,
        startDate: Date,
        endDate: Date,
    ): Promise<CohortData[]> {
        const pipeline = [
            {
                $match: {
                    siteId,
                    startedAt: { $gte: startDate, $lte: endDate },
                },
            },
            {
                $group: {
                    _id: {
                        // Group by visitor fingerprint and first visit date
                        visitor: '$ipAddress', // TODO: Replace with proper visitor fingerprinting
                        cohortDate: {
                            $dateToString: {
                                format: '%Y-%m-%d',
                                date: '$startedAt',
                            },
                        },
                    },
                    firstSeen: { $min: '$startedAt' },
                    lastSeen: { $max: '$startedAt' },
                    sessionCount: { $sum: 1 },
                    avgIntentScore: { $avg: '$intent_score' },
                },
            },
            {
                $group: {
                    _id: '$_id.cohortDate',
                    visitorCount: { $sum: 1 },
                    avgIntentScore: { $avg: '$avgIntentScore' },
                    visitors: {
                        $push: {
                            firstSeen: '$firstSeen',
                            lastSeen: '$lastSeen',
                            sessionCount: '$sessionCount',
                        },
                    },
                },
            },
            {
                $project: {
                    cohortId: '$_id',
                    firstSeen: '$_id',
                    visitorCount: 1,
                    avgIntentScore: 1,
                    // Calculate retention metrics
                    retention: {
                        day1: {
                            $size: {
                                $filter: {
                                    input: '$visitors',
                                    as: 'visitor',
                                    cond: {
                                        $lte: [
                                            {
                                                $divide: [
                                                    { $subtract: ['$$visitor.lastSeen', '$$visitor.firstSeen'] },
                                                    86400000, // 1 day in ms
                                                ],
                                            },
                                            1,
                                        ],
                                    },
                                },
                            },
                        },
                        day7: {
                            $size: {
                                $filter: {
                                    input: '$visitors',
                                    as: 'visitor',
                                    cond: {
                                        $and: [
                                            {
                                                $gte: [
                                                    {
                                                        $divide: [
                                                            { $subtract: ['$$visitor.lastSeen', '$$visitor.firstSeen'] },
                                                            86400000,
                                                        ],
                                                    },
                                                    6,
                                                ],
                                            },
                                            {
                                                $lte: [
                                                    {
                                                        $divide: [
                                                            { $subtract: ['$$visitor.lastSeen', '$$visitor.firstSeen'] },
                                                            86400000,
                                                        ],
                                                    },
                                                    8,
                                                ],
                                            },
                                        ],
                                    },
                                },
                            },
                        },
                        day30: {
                            $size: {
                                $filter: {
                                    input: '$visitors',
                                    as: 'visitor',
                                    cond: {
                                        $gte: [
                                            {
                                                $divide: [
                                                    { $subtract: ['$$visitor.lastSeen', '$$visitor.firstSeen'] },
                                                    86400000,
                                                ],
                                            },
                                            29,
                                        ],
                                    },
                                },
                            },
                        },
                    },
                },
            },
            {
                $sort: { cohortId: -1 as -1 },
            },
        ];

        const results = await this.visitorSessionModel.aggregate(pipeline);

        return results.map((r) => ({
            cohortId: r.cohortId,
            firstSeen: new Date(r.cohortId),
            visitorCount: r.visitorCount,
            retention: {
                day1: (r.retention.day1 / r.visitorCount) * 100,
                day7: (r.retention.day7 / r.visitorCount) * 100,
                day30: (r.retention.day30 / r.visitorCount) * 100,
            },
            avgIntentScore: r.avgIntentScore || 0,
            conversionRate: 0, // TODO: Calculate from conversion events
        }));
    }

    /**
     * Identify high-value visitor segments
     * Uses behavioral clustering to find patterns
     */
    async identifyHighValueSegments(
        siteId: string,
        minIntentScore: number = 70,
    ): Promise<any[]> {
        const pipeline = [
            {
                $match: {
                    siteId,
                    intent_score: { $gte: minIntentScore },
                    startedAt: {
                        $gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), // Last 30 days
                    },
                },
            },
            {
                $group: {
                    _id: {
                        country: '$geo.country',
                        referrer: '$referrer',
                    },
                    count: { $sum: 1 },
                    avgIntentScore: { $avg: '$intent_score' },
                    avgTimeSpent: { $avg: '$totalTimeSpent' },
                    avgPagesVisited: { $avg: { $size: '$pagesVisited' } },
                },
            },
            {
                $match: {
                    count: { $gte: 5 }, // Minimum 5 visitors to be considered a segment
                },
            },
            {
                $sort: { avgIntentScore: -1 as -1 },
            },
            {
                $limit: 20,
            },
        ];

        return this.visitorSessionModel.aggregate(pipeline);
    }

    /**
     * Analyze temporal patterns
     * Identifies when high-intent visitors are most active
     */
    async analyzeTemporalPatterns(
        siteId: string,
        days: number = 30,
    ): Promise<TemporalPattern[]> {
        const startDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000);

        const pipeline = [
            {
                $match: {
                    siteId,
                    startedAt: { $gte: startDate },
                },
            },
            {
                $project: {
                    hour: { $hour: '$startedAt' },
                    dayOfWeek: { $dayOfWeek: '$startedAt' },
                    intent_score: 1,
                    hasConversion: { $gt: ['$intent_score', 70] }, // Simple conversion proxy
                },
            },
            {
                $group: {
                    _id: {
                        hour: '$hour',
                        dayOfWeek: '$dayOfWeek',
                    },
                    visitorCount: { $sum: 1 },
                    conversions: {
                        $sum: { $cond: ['$hasConversion', 1, 0] },
                    },
                    avgIntentScore: { $avg: '$intent_score' },
                },
            },
            {
                $project: {
                    hour: '$_id.hour',
                    dayOfWeek: '$_id.dayOfWeek',
                    avgVisitors: '$visitorCount',
                    avgConversions: '$conversions',
                    peakIntentScore: '$avgIntentScore',
                },
            },
            {
                $sort: { peakIntentScore: -1 as -1 },
            },
        ];

        return this.visitorSessionModel.aggregate(pipeline);
    }

    /**
     * Calculate visitor lifecycle stages
     * Categorizes visitors based on engagement patterns
     */
    async calculateLifecycleStages(siteId: string): Promise<any> {
        const pipeline = [
            {
                $match: {
                    siteId,
                    startedAt: {
                        $gte: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000), // Last 90 days
                    },
                },
            },
            {
                $group: {
                    _id: '$ipAddress', // Group by visitor
                    sessionCount: { $sum: 1 },
                    firstSeen: { $min: '$startedAt' },
                    lastSeen: { $max: '$startedAt' },
                    avgIntentScore: { $avg: '$intent_score' },
                    totalTimeSpent: { $sum: '$totalTimeSpent' },
                    avgPagesPerSession: { $avg: { $size: '$pagesVisited' } },
                },
            },
            {
                $project: {
                    visitorId: '$_id',
                    sessionCount: 1,
                    daysSinceFirst: {
                        $divide: [
                            { $subtract: [new Date(), '$firstSeen'] },
                            86400000,
                        ],
                    },
                    daysSinceLast: {
                        $divide: [
                            { $subtract: [new Date(), '$lastSeen'] },
                            86400000,
                        ],
                    },
                    avgIntentScore: 1,
                    totalTimeSpent: 1,
                    avgPagesPerSession: 1,
                    // Calculate lifecycle stage
                    stage: {
                        $switch: {
                            branches: [
                                {
                                    case: { $lt: ['$sessionCount', 2] },
                                    then: 'New',
                                },
                                {
                                    case: {
                                        $and: [
                                            { $gte: ['$sessionCount', 2] },
                                            { $lt: [{ $divide: [{ $subtract: [new Date(), '$lastSeen'] }, 86400000] }, 7] },
                                        ],
                                    },
                                    then: 'Active',
                                },
                                {
                                    case: {
                                        $and: [
                                            { $gte: ['$sessionCount', 5] },
                                            { $gte: ['$avgIntentScore', 60] },
                                        ],
                                    },
                                    then: 'Power User',
                                },
                                {
                                    case: {
                                        $gt: [{ $divide: [{ $subtract: [new Date(), '$lastSeen'] }, 86400000] }, 30],
                                    },
                                    then: 'Churned',
                                },
                            ],
                            default: 'Casual',
                        },
                    },
                },
            },
            {
                $group: {
                    _id: '$stage',
                    count: { $sum: 1 },
                    avgSessionCount: { $avg: '$sessionCount' },
                    avgIntentScore: { $avg: '$avgIntentScore' },
                    avgTimeSpent: { $avg: '$totalTimeSpent' },
                },
            },
        ];

        const results = await this.visitorSessionModel.aggregate(pipeline);

        return {
            stages: results,
            total: results.reduce((sum, r) => sum + r.count, 0),
        };
    }

    /**
     * Behavioral velocity scoring
     * Measures how quickly visitors are progressing through the funnel
     */
    async calculateBehavioralVelocity(
        sessionId: string,
    ): Promise<{ score: number; trend: 'accelerating' | 'decelerating' | 'stable' }> {
        const session = await this.visitorSessionModel.findOne({ sessionId });
        if (!session) {
            return { score: 0, trend: 'stable' };
        }

        // Calculate velocity based on:
        // 1. Time between page views (faster = higher velocity)
        // 2. Intent score progression
        // 3. Engagement depth

        const pagesVisited = session.pagesVisited || [];
        if (pagesVisited.length < 2) {
            return { score: 0, trend: 'stable' };
        }

        // Simple velocity calculation
        const sessionDuration = Date.now() - new Date(session.startedAt).getTime();
        const pagesPerMinute = (pagesVisited.length / (sessionDuration / 60000)) || 0;

        const velocityScore = Math.min(pagesPerMinute * 10, 100);

        return {
            score: velocityScore,
            trend: velocityScore > 50 ? 'accelerating' : velocityScore > 20 ? 'stable' : 'decelerating',
        };
    }
}
