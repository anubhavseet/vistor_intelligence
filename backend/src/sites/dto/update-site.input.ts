import { InputType, Field } from '@nestjs/graphql';
import { IsString, IsOptional, IsBoolean, IsArray, IsNumber, ValidateNested, IsEnum } from 'class-validator';
import { IntentCategory } from '../../common/enums/intent.enum';
import { Type } from 'class-transformer';

@InputType()
export class IntentLimitInput {
  @Field(() => IntentCategory)
  @IsEnum(IntentCategory)
  intent: IntentCategory;

  @Field()
  @IsNumber()
  limit: number;
}

@InputType()
export class UpdateSiteSettingsInput {
  @Field({ nullable: true })
  @IsOptional()
  @IsBoolean()
  enableTracking?: boolean;

  @Field({ nullable: true })
  @IsOptional()
  @IsBoolean()
  enableGeoLocation?: boolean;

  @Field({ nullable: true })
  @IsOptional()
  @IsBoolean()
  enableBehaviorTracking?: boolean;

  @Field({ nullable: true })
  @IsOptional()
  @IsNumber()
  dataRetentionDays?: number;

  @Field({ nullable: true })
  @IsOptional()
  @IsNumber()
  trackingStartDelay?: number;

  @Field({ nullable: true })
  @IsOptional()
  @IsBoolean()
  usePreGeneratedIntentUI?: boolean;

  @Field({ nullable: true })
  @IsOptional()
  @IsBoolean()
  isUiInjectionEnabled?: boolean;

  @Field(() => [IntentLimitInput], { nullable: true })
  @IsOptional()
  @ValidateNested({ each: true })
  @Type(() => IntentLimitInput)
  maxInjectionsPerIntent?: IntentLimitInput[];
}

@InputType()
export class UpdateSiteInput {
  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  name?: string;

  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  domain?: string;

  @Field(() => [String], { nullable: true })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  allowedDomains?: string[];

  @Field({ nullable: true })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @Field(() => UpdateSiteSettingsInput, { nullable: true })
  @IsOptional()
  @ValidateNested()
  @Type(() => UpdateSiteSettingsInput)
  settings?: UpdateSiteSettingsInput;
}
