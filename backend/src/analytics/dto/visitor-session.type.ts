import { ObjectType, Field } from '@nestjs/graphql';

@ObjectType()
export class GeoLocation {
  @Field({ nullable: true })
  country?: string;

  @Field({ nullable: true })
  region?: string;

  @Field({ nullable: true })
  city?: string;

  @Field({ nullable: true })
  lat?: number;

  @Field({ nullable: true })
  lng?: number;

  @Field({ nullable: true })
  timezone?: string;
}

@ObjectType()
export class VisitorFlags {
  @Field({ nullable: true })
  isVPN?: boolean;

  @Field({ nullable: true })
  isMobile?: boolean;

  @Field({ nullable: true })
  isDataCenter?: boolean;

  @Field({ nullable: true })
  isProxy?: boolean;
}

@ObjectType()
export class VisitorSession {
  @Field()
  id: string;

  @Field()
  sessionId: string;

  @Field()
  siteId: string;

  @Field(() => GeoLocation, { nullable: true })
  geo?: GeoLocation;

  @Field({ nullable: true })
  userAgent?: string;

  @Field({ nullable: true })
  referrer?: string;

  @Field()
  startedAt: Date;

  @Field({ nullable: true })
  endedAt?: Date;

  @Field(() => [String])
  pagesVisited: string[];

  @Field()
  totalPageViews: number;

  @Field()
  totalTimeSpent: number;

  @Field()
  maxScrollDepth: number;

  @Field({ nullable: true })
  accountId?: string;

  @Field({ nullable: true })
  organizationName?: string;

  @Field(() => VisitorFlags, { nullable: true })
  flags?: VisitorFlags;

  @Field()
  isActive: boolean;

  @Field()
  lastActivityAt: Date;
}
