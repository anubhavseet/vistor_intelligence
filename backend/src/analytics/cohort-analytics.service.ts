import { Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { VisitorSession, VisitorSessionDocument } from '../common/schemas/visitor-session.schema';
import { CohortDataType, HighValueSegment, LifecycleResult, TemporalPatternType } from './dto/cohort.types';

/**
 * Advanced Cohort Analytics Service
 * Implements proper cohort retention analysis, lifecycle tracking, and behavioral segmentation.
 */
@Injectable()
export class CohortAnalyticsService {
    private readonly logger = new Logger(CohortAnalyticsService.name);

    constructor(
        @InjectModel(VisitorSession.name)
        private visitorSessionModel: Model<VisitorSessionDocument>,
    ) { }

    /**
     * Calculate cohort retention analysis (corrected algorithm).
     *
     * Groups visitors by their FIRST visit date (cohort). For each cohort,
     * counts how many visitors returned >= 1 day, >= 7 days, and >= 30 days
     * after their first visit. Uses ipHash as the stable visitor identifier.
     *
     * Query window is automatically extended to capture return visits.
     */
    async calculateCohortRetention(
        siteId: string,
        startDate: Date,
        endDate: Date,
    ): Promise<CohortDataType[]> {
        // Extend the look-ahead window to 30 days after endDate so we can
        // capture return visits that happened after the cohort window closed.
        const lookAheadEnd = new Date(endDate.getTime() + 30 * 86400000);

        const pipeline: any[] = [
            // 1. Match all sessions in the extended window for this site
            {
                $match: {
                    siteId,
                    startedAt: { $gte: startDate, $lte: lookAheadEnd },
                    ipHash: { $exists: true, $ne: null },
                },
            },
            // 2. Group by visitor (ipHash) to collect all their session dates
            {
                $group: {
                    _id: '$ipHash',
                    firstSeen: { $min: '$startedAt' },
                    sessionDates: { $push: '$startedAt' },
                    avgIntentScore: { $avg: '$intentScore' }, // ✅ Fixed: intentScore (camelCase)
                    // A visitor "converted" if their max intent score reached Lead threshold
                    maxIntentScore: { $max: '$intentScore' },
                },
            },
            // 3. Only keep visitors whose FIRST visit falls within the requested cohort window
            {
                $match: {
                    firstSeen: { $gte: startDate, $lte: endDate },
                },
            },
            // 4. Compute per-visitor retention booleans and cohort date
            {
                $addFields: {
                    cohortDate: {
                        $dateToString: { format: '%Y-%m-%d', date: '$firstSeen' },
                    },
                    // Day 1 retention: any session >= 1 day after firstSeen (and < 7 days)
                    returnedDay1: {
                        $gt: [
                            {
                                $size: {
                                    $filter: {
                                        input: '$sessionDates',
                                        as: 'd',
                                        cond: {
                                            $gte: [
                                                { $subtract: ['$$d', '$firstSeen'] },
                                                86400000, // 1 day in ms
                                            ],
                                        },
                                    },
                                },
                            },
                            0,
                        ],
                    },
                    // Day 7 retention: any session >= 7 days after firstSeen
                    returnedDay7: {
                        $gt: [
                            {
                                $size: {
                                    $filter: {
                                        input: '$sessionDates',
                                        as: 'd',
                                        cond: {
                                            $gte: [
                                                { $subtract: ['$$d', '$firstSeen'] },
                                                7 * 86400000,
                                            ],
                                        },
                                    },
                                },
                            },
                            0,
                        ],
                    },
                    // Day 30 retention: any session >= 30 days after firstSeen
                    returnedDay30: {
                        $gt: [
                            {
                                $size: {
                                    $filter: {
                                        input: '$sessionDates',
                                        as: 'd',
                                        cond: {
                                            $gte: [
                                                { $subtract: ['$$d', '$firstSeen'] },
                                                30 * 86400000,
                                            ],
                                        },
                                    },
                                },
                            },
                            0,
                        ],
                    },
                    // Converted = visitor's max intent score reached Lead threshold (70+)
                    isConverted: { $gte: ['$maxIntentScore', 70] },
                },
            },
            // 5. Group by cohort date to aggregate per-cohort metrics
            {
                $group: {
                    _id: '$cohortDate',
                    visitorCount: { $sum: 1 },
                    avgIntentScore: { $avg: '$avgIntentScore' },
                    day1Retained: { $sum: { $cond: ['$returnedDay1', 1, 0] } },
                    day7Retained: { $sum: { $cond: ['$returnedDay7', 1, 0] } },
                    day30Retained: { $sum: { $cond: ['$returnedDay30', 1, 0] } },
                    conversions: { $sum: { $cond: ['$isConverted', 1, 0] } },
                },
            },
            // 6. Project to final shape with percentage calculations
            {
                $project: {
                    cohortId: '$_id',
                    firstSeen: '$_id',
                    visitorCount: 1,
                    avgIntentScore: { $round: ['$avgIntentScore', 1] },
                    retention: {
                        day1: {
                            $round: [
                                {
                                    $cond: [
                                        { $gt: ['$visitorCount', 0] },
                                        { $multiply: [{ $divide: ['$day1Retained', '$visitorCount'] }, 100] },
                                        0,
                                    ],
                                },
                                1,
                            ],
                        },
                        day7: {
                            $round: [
                                {
                                    $cond: [
                                        { $gt: ['$visitorCount', 0] },
                                        { $multiply: [{ $divide: ['$day7Retained', '$visitorCount'] }, 100] },
                                        0,
                                    ],
                                },
                                1,
                            ],
                        },
                        day30: {
                            $round: [
                                {
                                    $cond: [
                                        { $gt: ['$visitorCount', 0] },
                                        { $multiply: [{ $divide: ['$day30Retained', '$visitorCount'] }, 100] },
                                        0,
                                    ],
                                },
                                1,
                            ],
                        },
                    },
                    conversionRate: {
                        $round: [
                            {
                                $cond: [
                                    { $gt: ['$visitorCount', 0] },
                                    { $multiply: [{ $divide: ['$conversions', '$visitorCount'] }, 100] },
                                    0,
                                ],
                            },
                            1,
                        ],
                    },
                },
            },
            { $sort: { cohortId: -1 as -1 } },
        ];

        const results = await this.visitorSessionModel.aggregate(pipeline);
        return results as CohortDataType[];
    }

    /**
     * Identify high-value visitor segments
     * Uses behavioral clustering to find patterns from visitors with intent >= minIntentScore
     */
    async identifyHighValueSegments(
        siteId: string,
        minIntentScore: number = 70,
    ): Promise<HighValueSegment[]> {
        const pipeline: any[] = [
            {
                $match: {
                    siteId,
                    intentScore: { $gte: minIntentScore }, // ✅ Fixed: intentScore (camelCase)
                    startedAt: {
                        $gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
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
                    avgIntentScore: { $avg: '$intentScore' }, // ✅ Fixed
                    avgTimeSpent: { $avg: '$totalTimeSpent' },
                    avgPagesVisited: { $avg: { $size: '$pagesVisited' } },
                },
            },
            {
                $match: {
                    count: { $gte: 3 }, // Minimum 3 visitors to be a segment
                },
            },
            {
                $project: {
                    country: '$_id.country',
                    referrer: '$_id.referrer',
                    count: 1,
                    avgIntentScore: { $round: ['$avgIntentScore', 1] },
                    avgTimeSpent: { $round: ['$avgTimeSpent', 0] },
                    avgPagesVisited: { $round: ['$avgPagesVisited', 1] },
                    _id: 0,
                },
            },
            { $sort: { avgIntentScore: -1 as -1 } },
            { $limit: 20 },
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
    ): Promise<TemporalPatternType[]> {
        const startDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000);

        const pipeline: any[] = [
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
                    intentScore: '$intentScore', // ✅ Fixed
                    isConversion: { $gte: ['$intentScore', 70] },
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
                        $sum: { $cond: ['$isConversion', 1, 0] },
                    },
                    avgIntentScore: { $avg: '$intentScore' },
                },
            },
            {
                $project: {
                    hour: '$_id.hour',
                    dayOfWeek: '$_id.dayOfWeek',
                    avgVisitors: '$visitorCount',
                    avgConversions: '$conversions',
                    peakIntentScore: { $round: ['$avgIntentScore', 1] },
                    _id: 0,
                },
            },
            { $sort: { peakIntentScore: -1 as -1 } },
        ];

        return this.visitorSessionModel.aggregate(pipeline);
    }

    /**
     * Calculate visitor lifecycle stages.
     *
     * Categorizes visitors based on engagement patterns.
     * Bug #5 fixed: Power User check is now evaluated BEFORE Active to prevent
     * high-intent frequent visitors from being misclassified.
     */
    async calculateLifecycleStages(siteId: string): Promise<LifecycleResult> {
        const now = new Date();

        const pipeline: any[] = [
            {
                $match: {
                    siteId,
                    startedAt: {
                        $gte: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000),
                    },
                },
            },
            // Group by visitor (ipHash) ✅ Fixed: was $ipAddress which doesn't exist
            {
                $group: {
                    _id: '$ipHash',
                    sessionCount: { $sum: 1 },
                    firstSeen: { $min: '$startedAt' },
                    lastSeen: { $max: '$startedAt' },
                    avgIntentScore: { $avg: '$intentScore' }, // ✅ Fixed field name
                    totalTimeSpent: { $sum: '$totalTimeSpent' },
                    avgPagesPerSession: { $avg: { $size: '$pagesVisited' } },
                },
            },
            {
                $addFields: {
                    daysSinceFirst: {
                        $divide: [{ $subtract: [now, '$firstSeen'] }, 86400000],
                    },
                    daysSinceLast: {
                        $divide: [{ $subtract: [now, '$lastSeen'] }, 86400000],
                    },
                },
            },
            {
                $addFields: {
                    // ✅ Bug #5 Fixed: Power User checked BEFORE Active.
                    // Previously, Active was evaluated first and overlapped with Power User,
                    // making Power User an unreachable branch.
                    stage: {
                        $switch: {
                            branches: [
                                // New: only 1 session ever
                                {
                                    case: { $lt: ['$sessionCount', 2] },
                                    then: 'New',
                                },
                                // Power User: 5+ sessions AND high intent (checked before Active)
                                {
                                    case: {
                                        $and: [
                                            { $gte: ['$sessionCount', 5] },
                                            { $gte: ['$avgIntentScore', 60] },
                                        ],
                                    },
                                    then: 'Power User',
                                },
                                // Active: 2+ sessions and visited in last 7 days
                                {
                                    case: {
                                        $and: [
                                            { $gte: ['$sessionCount', 2] },
                                            { $lte: ['$daysSinceLast', 7] },
                                        ],
                                    },
                                    then: 'Active',
                                },
                                // Churned: no activity for 30+ days
                                {
                                    case: { $gt: ['$daysSinceLast', 30] },
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
            {
                $project: {
                    stage: '$_id',
                    count: 1,
                    avgSessionCount: { $round: ['$avgSessionCount', 1] },
                    avgIntentScore: { $round: ['$avgIntentScore', 1] },
                    avgTimeSpent: { $round: ['$avgTimeSpent', 0] },
                    _id: 0,
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

        const pagesVisited = session.pagesVisited || [];
        if (pagesVisited.length < 2) {
            return { score: 0, trend: 'stable' };
        }

        const sessionDuration = Date.now() - new Date(session.startedAt).getTime();
        const pagesPerMinute = (pagesVisited.length / (sessionDuration / 60000)) || 0;
        const velocityScore = Math.min(pagesPerMinute * 10, 100);

        return {
            score: velocityScore,
            trend: velocityScore > 50 ? 'accelerating' : velocityScore > 20 ? 'stable' : 'decelerating',
        };
    }
}
