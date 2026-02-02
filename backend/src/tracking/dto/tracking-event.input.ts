import { InputType, Field } from '@nestjs/graphql';

@InputType()
export class TrackingEventInput {
  @Field({ nullable: true })
  sessionId?: string;

  @Field()
  eventType: string;

  @Field({ nullable: true })
  pageUrl?: string;

  @Field({ nullable: true })
  referrer?: string;

  @Field({ nullable: true })
  userAgent?: string;

  @Field({ nullable: true })
  ipAddress?: string;

  @Field(() => String, { nullable: true, description: 'JSON string of metadata' })
  metadata?: string;
}
