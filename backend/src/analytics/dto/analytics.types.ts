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
}
