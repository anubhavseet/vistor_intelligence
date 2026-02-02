import { ObjectType, Field } from '@nestjs/graphql';

@ObjectType()
export class EngagementTrend {
  @Field()
  date: string;

  @Field()
  visitors: number;

  @Field()
  pageViews: number;

  @Field()
  avgTime: number;
}
