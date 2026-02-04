import { InputType, Field } from '@nestjs/graphql';
import { IsString, IsOptional, IsBoolean, IsArray, IsNumber, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';

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
