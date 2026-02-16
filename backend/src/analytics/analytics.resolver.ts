import { Resolver, Query, Args } from '@nestjs/graphql';
import { AnalyticsService } from './analytics.service';
import { AnalyticsDashboardData, PageSection, SectionMetric, AreaStats } from './dto/analytics.types';

@Resolver()
export class AnalyticsResolver {
  constructor(private analyticsService: AnalyticsService) { }

  @Query(() => AnalyticsDashboardData)
  async getAnalyticsDashboard(
    @Args('siteId') siteId: string,
    @Args('days') days: number,
  ): Promise<AnalyticsDashboardData> {
    return this.analyticsService.getDashboardData(siteId, days);
  }

  @Query(() => [PageSection])
  async getPageSections(
    @Args('siteId') siteId: string,
    @Args('url') url: string,
  ): Promise<PageSection[]> {
    return this.analyticsService.getPageSections(siteId, url);
  }

  @Query(() => [SectionMetric])
  async getSectionMetrics(
    @Args('siteId') siteId: string,
    @Args('url') url: string,
    @Args('days') days: number,
  ): Promise<SectionMetric[]> {
    return this.analyticsService.getSectionMetrics(siteId, url, days);
  }

  @Query(() => AreaStats)
  async getAreaStats(
    @Args('siteId') siteId: string,
    @Args('centerLat') centerLat: number,
    @Args('centerLng') centerLng: number,
    @Args('radiusKm') radiusKm: number,
    @Args('days') days: number,
  ): Promise<AreaStats> {
    return this.analyticsService.getAreaStats(siteId, centerLat, centerLng, radiusKm, days);
  }
}
