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



// ─── UTM Attribution ────────────────────────────────────────────────────────

@ObjectType()
export class UtmCampaignStat {
    @Field()
    campaign: string;

    @Field()
    source: string;

    @Field()
    medium: string;

    @Field(() => Int)
    visitors: number;

    @Field(() => Int)
    newVisitors: number;

    @Field(() => Float)
    bounceRate: number;

    @Field(() => Float)
    avgTimeSpent: number;

    @Field(() => Float)
    conversionRate: number;
}

// ─── Device & Tech ──────────────────────────────────────────────────────────

@ObjectType()
export class DeviceStat {
    @Field()
    deviceType: string; // mobile, desktop, tablet

    @Field()
    browser: string;

    @Field(() => Int)
    visitors: number;

    @Field(() => Float)
    avgIntentScore: number;
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

    @Field({ nullable: true })
    referrer?: string;

    @Field({ nullable: true })
    startedAt?: string;

    @Field({ nullable: true })
    city?: string;

    @Field({ nullable: true })
    country?: string;

    @Field(() => [String], { nullable: true })
    pagesVisited?: string[];

    @Field({ nullable: true })
    deviceType?: string;

    @Field({ nullable: true })
    os?: string;

    @Field({ nullable: true })
    browser?: string;

    @Field(() => Float, { nullable: true })
    duration?: number;

    @Field({ nullable: true })
    org?: string;
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

    @Field(() => [TopInteraction], { nullable: true })
    topInteractions?: TopInteraction[];

    @Field(() => [CustomEventStat], { nullable: true })
    customEvents?: CustomEventStat[];

    @Field(() => [CityStat], { nullable: true })
    cityStats?: CityStat[];
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
export class TopInteraction {
    @Field()
    selector: string;

    @Field()
    pageUrl: string;

    @Field(() => Int)
    count: number;
}

@ObjectType()
export class CustomEventStat {
    @Field()
    eventName: string;

    @Field(() => Int)
    count: number;

    @Field(() => [String]) // last 5 session IDs
    recentSessions: string[];
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

@ObjectType()
export class CityStat {
    @Field()
    city: string;

    @Field()
    country: string;

    @Field(() => Int)
    count: number;

    @Field(() => Float)
    lat: number;

    @Field(() => Float)
    lng: number;
}

@ObjectType()
export class AreaStats {
    @Field(() => Int)
    visitorCount: number;

    @Field(() => Float)
    avgIntentScore: number;

    @Field(() => [String])
    topPages: string[];
}

@ObjectType()
export class SessionSummary {
    @Field(() => String)
    sessionId: string;

    @Field(() => Date)
    startedAt: Date;

    @Field(() => Float)
    duration: number;

    @Field(() => Int)
    pageViews: number;

    @Field(() => Float)
    intentScore: number;

    @Field(() => String, { nullable: true })
    intentCategory?: string;
}

@ObjectType()
export class VisitorDeviceStats {
    @Field(() => Int, { defaultValue: 0 })
    mobileCount: number;

    @Field(() => Int, { defaultValue: 0 })
    desktopCount: number;

    @Field(() => String, { nullable: true })
    lastDevice?: string;
}

@ObjectType()
export class VisitorGeo {
    @Field(() => String, { nullable: true })
    country?: string;

    @Field(() => String, { nullable: true })
    city?: string;

    @Field(() => String, { nullable: true })
    region?: string;
}

@ObjectType()
export class VisitorProfile {
    @Field(() => String)
    visitorId: string;

    @Field(() => Date)
    firstSeenAt: Date;

    @Field(() => Date)
    lastSeenAt: Date;

    @Field(() => Int)
    totalSessions: number;

    @Field(() => Int)
    totalPageViews: number;

    @Field(() => Float)
    totalTimeSpent: number;

    @Field(() => Float)
    avgIntentScore: number;

    @Field(() => [String])
    tags: string[];

    @Field(() => VisitorDeviceStats, { nullable: true })
    deviceStats?: VisitorDeviceStats;

    @Field(() => VisitorGeo, { nullable: true })
    geo?: VisitorGeo;

    @Field(() => [SessionSummary])
    sessions: SessionSummary[];
}

@ObjectType()
export class VisitorListResponse {
    @Field(() => [VisitorProfile])
    visitors: VisitorProfile[];

    @Field(() => Int)
    total: number;
}
