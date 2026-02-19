import { InputType, Field } from '@nestjs/graphql';
import { IsString, IsBoolean, IsOptional, IsEnum } from 'class-validator';
import { IntentCategory } from '../../common/enums/intent.enum';

@InputType()
export class CreateIntentPromptInput {
    @Field()
    @IsString()
    siteId: string;

    @Field(() => IntentCategory)
    @IsEnum(IntentCategory)
    intent: IntentCategory;

    @Field()
    @IsString()
    prompt: string;

    @Field({ nullable: true })
    @IsOptional()
    @IsString()
    description?: string;

    @Field({ defaultValue: true })
    @IsOptional()
    @IsBoolean()
    isActive: boolean;
}

@InputType()
export class UpdateIntentPromptInput {
    @Field()
    @IsString()
    id: string;

    @Field(() => IntentCategory, { nullable: true })
    @IsOptional()
    @IsEnum(IntentCategory)
    intent?: IntentCategory;

    @Field({ nullable: true })
    @IsOptional()
    @IsString()
    prompt?: string;

    @Field({ nullable: true })
    @IsOptional()
    @IsString()
    description?: string;

    @Field({ nullable: true })
    @IsOptional()
    @IsString()
    generatedHtml?: string;

    @Field({ nullable: true })
    @IsOptional()
    @IsString()
    generatedCss?: string;

    @Field({ nullable: true })
    @IsOptional()
    @IsString()
    generatedJs?: string;

    @Field({ nullable: true })
    @IsOptional()
    @IsBoolean()
    isActive?: boolean;
}
