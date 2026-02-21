import { Resolver, Query, Args, ObjectType, Field } from '@nestjs/graphql';
import { Int } from '@nestjs/graphql';
import { AnalyticsService } from './analytics.service';
import { CohortAnalyticsService } from './cohort-analytics.service';
import {
  AnalyticsDashboardData,
  PageSection,
  SectionMetric,
  AreaStats,
  UtmCampaignStat,
  DeviceStat,
  VisitorProfile,
  VisitorListResponse,
} from './dto/analytics.types';
import {
  CohortDataType,
  HighValueSegment,
  LifecycleResult,
  TemporalPatternType,
} from './dto/cohort.types';

@Resolver()
export class AnalyticsResolver {
  constructor(
    private analyticsService: AnalyticsService,
    private cohortAnalyticsService: CohortAnalyticsService,
  ) { }

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

  @Query(() => [UtmCampaignStat])
  async getUtmCampaigns(
    @Args('siteId') siteId: string,
    @Args('days', { type: () => Int, defaultValue: 30 }) days: number,
  ): Promise<UtmCampaignStat[]> {
    return this.analyticsService.getUtmCampaigns(siteId, days);
  }

  @Query(() => [DeviceStat])
  async getDeviceStats(
    @Args('siteId') siteId: string,
    @Args('days', { type: () => Int, defaultValue: 30 }) days: number,
  ): Promise<DeviceStat[]> {
    return this.analyticsService.getDeviceStats(siteId, days);
  }

  @Query(() => VisitorProfile, { nullable: true })
  async getVisitorProfile(
    @Args('siteId') siteId: string,
    @Args('visitorId') visitorId: string,
  ): Promise<VisitorProfile | null> {
    return this.analyticsService.getVisitorProfile(siteId, visitorId);
  }

  // ─── Cohort Analytics ────────────────────────────────────────────────────────

  /**
   * Bug #6 fixed: now returns proper typed [CohortDataType] instead of raw JSON string.
   * Bug #1/2/3 fixed in the service layer.
   */
  @Query(() => [CohortDataType])
  async getCohortRetention(
    @Args('siteId') siteId: string,
    @Args('startDate') startDate: Date,
    @Args('endDate') endDate: Date,
  ): Promise<CohortDataType[]> {
    return this.cohortAnalyticsService.calculateCohortRetention(siteId, startDate, endDate);
  }

  /**
   * Bug #6 fixed: now returns proper typed LifecycleResult instead of raw JSON string.
   * Bug #5 fixed in the service layer (lifecycle stage ordering).
   */
  @Query(() => LifecycleResult)
  async getVisitorLifecycle(
    @Args('siteId') siteId: string,
  ): Promise<LifecycleResult> {
    return this.cohortAnalyticsService.calculateLifecycleStages(siteId);
  }

  /**
   * Bug #7 fixed: high-value segments now exposed in the resolver.
   */
  @Query(() => [HighValueSegment])
  async getHighValueSegments(
    @Args('siteId') siteId: string,
    @Args('minIntentScore', { type: () => Int, defaultValue: 70 }) minIntentScore: number,
  ): Promise<HighValueSegment[]> {
    return this.cohortAnalyticsService.identifyHighValueSegments(siteId, minIntentScore);
  }

  /**
   * Bug #7 fixed: temporal patterns now exposed in the resolver.
   */
  @Query(() => [TemporalPatternType])
  async getTemporalPatterns(
    @Args('siteId') siteId: string,
    @Args('days', { type: () => Int, defaultValue: 30 }) days: number,
  ): Promise<TemporalPatternType[]> {
    return this.cohortAnalyticsService.analyzeTemporalPatterns(siteId, days);
  }

  @Query(() => [VisitorProfile])
  async getTopVisitors(
    @Args('siteId') siteId: string,
    @Args('limit', { type: () => Int, defaultValue: 10 }) limit: number
  ) {
    return this.analyticsService.getTopVisitors(siteId, limit);
  }

  @Query(() => VisitorListResponse)
  async getVisitors(
    @Args('siteId') siteId: string,
    @Args('limit', { type: () => Int, defaultValue: 50 }) limit: number,
    @Args('offset', { type: () => Int, defaultValue: 0 }) offset: number,
    @Args('sortBy', { type: () => String, defaultValue: 'lastSeenAt' }) sortBy: string,
    @Args('sortOrder', { type: () => String, defaultValue: 'desc' }) sortOrder: 'asc' | 'desc',
  ) {
    return this.analyticsService.getVisitors(siteId, limit, offset, sortBy, sortOrder);
  }
}
