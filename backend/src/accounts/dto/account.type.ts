import { ObjectType, Field } from '@nestjs/graphql';

@ObjectType()
export class BehaviorMetrics {
  @Field({ nullable: true })
  pricingPageVisits?: number;

  @Field({ nullable: true })
  docsPageVisits?: number;

  @Field({ nullable: true })
  apiPageVisits?: number;

  @Field({ nullable: true })
  repeatVisits?: number;

  @Field({ nullable: true })
  multiUserActivity?: number;

  @Field({ nullable: true })
  avgTimePerSession?: number;

  @Field({ nullable: true })
  avgPagesPerSession?: number;
}

@ObjectType()
export class Account {
  @Field()
  id: string;

  @Field()
  accountId: string;

  @Field()
  siteId: string;

  @Field({ nullable: true })
  organizationName?: string;

  @Field({ nullable: true })
  domain?: string;

  @Field()
  totalSessions: number;

  @Field()
  totalPageViews: number;

  @Field()
  totalTimeSpent: number;

  @Field(() => [String])
  pagesVisited: string[];

  @Field()
  engagementScore: number;

  @Field()
  intentScore: number;

  @Field()
  category: string;

  @Field(() => BehaviorMetrics, { nullable: true })
  behaviorMetrics?: BehaviorMetrics;

  @Field()
  firstSeenAt: Date;

  @Field()
  lastSeenAt: Date;

  @Field()
  isHighIntent: boolean;

  @Field({ nullable: true })
  lastIntentUpdateAt?: Date;
}
