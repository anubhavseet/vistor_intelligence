import { ObjectType, Field } from '@nestjs/graphql';

@ObjectType()
export class SiteSettings {
  @Field()
  enableTracking: boolean;

  @Field()
  enableGeoLocation: boolean;

  @Field()
  enableBehaviorTracking: boolean;

  @Field()
  dataRetentionDays: number;
}

@ObjectType()
export class Site {
  @Field()
  id: string;

  @Field()
  siteId: string;

  @Field()
  name: string;

  @Field({ nullable: true })
  domain?: string;

  @Field(() => [String])
  allowedDomains: string[];

  @Field()
  userId: string;

  @Field()
  isActive: boolean;

  @Field(() => SiteSettings)
  settings: SiteSettings;

  @Field({ nullable: true })
  apiKey?: string;

  @Field()
  createdAt: Date;

  @Field()
  updatedAt: Date;
}
