import { ObjectType, Field, Int, Float } from '@nestjs/graphql';

@ObjectType()
export class OverviewStats {
    @Field(() => Int)
    totalSessions: number;

    @Field(() => Int)
    totalPageViews: number;

    @Field(() => Float)
    avgSessionDuration: number; // in seconds

    @Field(() => Float)
    bounceRate: number; // percentage
}

@ObjectType()
export class ReferrerStat {
    @Field()
    source: string;

    @Field(() => Int)
    count: number;
}

@ObjectType()
export class GeoStat {
    @Field()
    country: string;

    @Field(() => Int)
    count: number;
}

@ObjectType()
export class PageStat {
    @Field()
    url: string;

    @Field(() => Int)
    views: number;

    @Field(() => Int)
    visitors: number;
}

@ObjectType()
export class DailyStat {
    @Field()
    date: string;

    @Field(() => Int)
    sessions: number;

    @Field(() => Int)
    pageViews: number;
}

@ObjectType()
export class HeatMapPoint {
    @Field(() => Float)
    lat: number;

    @Field(() => Float)
    lng: number;

    @Field(() => Int)
    weight: number;

    @Field(() => Float, { nullable: true })
    avgIntent?: number;
}

@ObjectType()
export class AnalyticsDashboardData {
    @Field(() => OverviewStats)
    overview: OverviewStats;

    @Field(() => [DailyStat])
    dailyStats: DailyStat[];

    @Field(() => [ReferrerStat])
    referrers: ReferrerStat[];

    @Field(() => [GeoStat])
    geoStats: GeoStat[]; // Text based

    @Field(() => [HeatMapPoint])
    heatMapPoints: HeatMapPoint[]; // Visual map

    @Field(() => [PageStat])
    topPages: PageStat[];

    @Field(() => [PagePerformanceStat], { nullable: true })
    pagePerformance?: PagePerformanceStat[];

    @Field(() => [UserFlowStat], { nullable: true })
    userFlows?: UserFlowStat[];

    @Field(() => [BehavioralPatternStat], { nullable: true })
    behavioralPatterns?: BehavioralPatternStat[];
}

@ObjectType()
export class PagePerformanceStat {
    @Field()
    url: string;

    @Field(() => Float)
    avgScrollDepth: number;

    @Field(() => Float)
    avgTimeOnPage: number; // seconds

    @Field(() => Int)
    rageClicks: number;
}

@ObjectType()
export class UserFlowStat {
    @Field()
    source: string; // Previous Page

    @Field()
    target: string; // Next Page

    @Field(() => Int)
    count: number;
}

@ObjectType()
export class BehavioralPatternStat {
    @Field()
    pattern: string; // "Rage Clicks", "Quick Bounce", "Deep Reader"

    @Field(() => Int)
    count: number;

    @Field(() => [String])
    sessionIds: string[]; // Sample sessions
}

@ObjectType()
export class PageSection {
    @Field()
    selector: string;

    @Field()
    html: string;

    @Field({ nullable: true })
    description?: string;
}

@ObjectType()
export class SectionMetric {
    @Field()
    selector: string;

    @Field(() => Float)
    avgDwellTime: number;

    @Field(() => Int)
    clickCount: number;
}
