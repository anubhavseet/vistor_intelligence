import { ObjectType, Field } from '@nestjs/graphql';

@ObjectType()
export class Webhook {
  @Field()
  id: string;

  @Field()
  siteId: string;

  @Field()
  url: string;

  @Field()
  eventType: string;

  @Field()
  isActive: boolean;

  @Field()
  successCount: number;

  @Field()
  failureCount: number;

  @Field({ nullable: true })
  lastTriggeredAt?: Date;
}
