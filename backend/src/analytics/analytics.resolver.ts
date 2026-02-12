import { Resolver, Query, Args } from '@nestjs/graphql';
import { AnalyticsService } from './analytics.service';
import { AnalyticsDashboardData } from './dto/analytics.types';

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
}
