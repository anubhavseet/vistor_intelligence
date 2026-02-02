import { Resolver, Query, Args, Subscription } from '@nestjs/graphql';
import { UseGuards } from '@nestjs/common';
import { PubSub } from 'graphql-subscriptions';
import { AnalyticsService } from './analytics.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { VisitorSession } from './dto/visitor-session.type';
import { VisitorMap } from './dto/visitor-map.type';
import { PageFlow } from './dto/page-flow.type';
import { EngagementTrend } from './dto/engagement-trend.type';
import { mapVisitorSessionToGraphQL, mapArrayToGraphQL } from '../common/utils/mappers.util';

const pubSub = new PubSub();

@Resolver()
@UseGuards(JwtAuthGuard)
export class AnalyticsResolver {
  constructor(private analyticsService: AnalyticsService) {}

  @Query(() => [VisitorSession])
  async getLiveVisitors(@Args('siteId') siteId: string): Promise<VisitorSession[]> {
    const sessions = await this.analyticsService.getLiveVisitors(siteId);
    return mapArrayToGraphQL(sessions, mapVisitorSessionToGraphQL);
  }

  @Query(() => Number)
  async getLiveVisitorCount(@Args('siteId') siteId: string): Promise<number> {
    return this.analyticsService.getLiveVisitorCount(siteId);
  }

  @Query(() => String)
  async exportAccountsCSV(@Args('siteId') siteId: string): Promise<string> {
    return this.analyticsService.exportAccountsToCSV(siteId);
  }

  @Query(() => VisitorMap)
  async getVisitorMap(
    @Args('siteId') siteId: string,
    @Args('startDate', { nullable: true }) startDate?: Date,
    @Args('endDate', { nullable: true }) endDate?: Date,
  ): Promise<VisitorMap> {
    return this.analyticsService.getVisitorMap(siteId, startDate, endDate);
  }

  @Query(() => PageFlow)
  async getPageFlow(
    @Args('siteId') siteId: string,
    @Args('startDate', { nullable: true }) startDate?: Date,
    @Args('endDate', { nullable: true }) endDate?: Date,
  ): Promise<PageFlow> {
    return this.analyticsService.getPageFlow(siteId, startDate, endDate);
  }

  @Query(() => [EngagementTrend])
  async getEngagementTrends(
    @Args('siteId') siteId: string,
    @Args('days', { nullable: true, defaultValue: 30 }) days: number,
  ): Promise<EngagementTrend[]> {
    return this.analyticsService.getEngagementTrends(siteId, days);
  }

  @Subscription(() => VisitorSession, {
    filter: (payload, variables) => payload.highIntentAccountDetected.siteId === variables.siteId,
  })
  highIntentAccountDetected(@Args('siteId') siteId: string) {
    return pubSub.asyncIterator('highIntentAccountDetected');
  }

  @Subscription(() => String, {
    filter: (payload, variables) => payload.trafficSpikeDetected.siteId === variables.siteId,
  })
  trafficSpikeDetected(@Args('siteId') siteId: string) {
    return pubSub.asyncIterator('trafficSpikeDetected');
  }
}
