import { Resolver, Query, Args } from '@nestjs/graphql';
import { AnalyticsService } from './analytics.service';
import { AnalyticsDashboardData, PageSection, SectionMetric } from './dto/analytics.types';

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
}
