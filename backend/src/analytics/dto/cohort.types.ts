import { ObjectType, Field, Int, Float } from '@nestjs/graphql';

// ─── Cohort Retention ────────────────────────────────────────────────────────

@ObjectType()
export class RetentionRates {
    @Field(() => Float)
    day1: number;

    @Field(() => Float)
    day7: number;

    @Field(() => Float)
    day30: number;
}

@ObjectType()
export class CohortDataType {
    @Field()
    cohortId: string;

    @Field()
    firstSeen: string; // ISO date string

    @Field(() => Int)
    visitorCount: number;

    @Field(() => RetentionRates)
    retention: RetentionRates;

    @Field(() => Float)
    avgIntentScore: number;

    @Field(() => Float)
    conversionRate: number; // % of visitors who reached Lead status
}

// ─── Visitor Lifecycle ────────────────────────────────────────────────────────

@ObjectType()
export class LifecycleStage {
    @Field()
    stage: string;

    @Field(() => Int)
    count: number;

    @Field(() => Float)
    avgSessionCount: number;

    @Field(() => Float)
    avgIntentScore: number;

    @Field(() => Float)
    avgTimeSpent: number;
}

@ObjectType()
export class LifecycleResult {
    @Field(() => [LifecycleStage])
    stages: LifecycleStage[];

    @Field(() => Int)
    total: number;
}

// ─── High Value Segments ──────────────────────────────────────────────────────

@ObjectType()
export class HighValueSegment {
    @Field({ nullable: true })
    country?: string;

    @Field({ nullable: true })
    referrer?: string;

    @Field(() => Int)
    count: number;

    @Field(() => Float)
    avgIntentScore: number;

    @Field(() => Float)
    avgTimeSpent: number;

    @Field(() => Float)
    avgPagesVisited: number;
}

// ─── Temporal Patterns ────────────────────────────────────────────────────────

@ObjectType()
export class TemporalPatternType {
    @Field(() => Int)
    hour: number;

    @Field(() => Int)
    dayOfWeek: number;

    @Field(() => Float)
    avgVisitors: number;

    @Field(() => Float)
    avgConversions: number;

    @Field(() => Float)
    peakIntentScore: number;
}

// ─── Admin Alert ──────────────────────────────────────────────────────────────

@ObjectType()
export class AdminAlertType {
    @Field()
    type: string; // 'vip_visitor' | 'anomaly' | 'rage_click'

    @Field({ nullable: true })
    sessionId?: string;

    @Field(() => Float, { nullable: true })
    score?: number;

    @Field(() => Float)
    timestamp: number;

    @Field({ nullable: true })
    message?: string;

    @Field({ nullable: true })
    severity?: string; // 'info' | 'warning' | 'critical'
}
