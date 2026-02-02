import { InputType, Field } from '@nestjs/graphql';
import { IsString, IsUrl, IsIn } from 'class-validator';

@InputType()
export class CreateWebhookInput {
  @Field()
  @IsString()
  siteId: string;

  @Field()
  @IsUrl()
  url: string;

  @Field()
  @IsIn(['high_intent', 'traffic_spike', 'both'])
  eventType: string;
}
