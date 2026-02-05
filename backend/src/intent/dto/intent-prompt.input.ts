import { InputType, Field } from '@nestjs/graphql';
import { IsString, IsBoolean, IsOptional } from 'class-validator';

@InputType()
export class CreateIntentPromptInput {
    @Field()
    @IsString()
    siteId: string;

    @Field()
    @IsString()
    intent: string;

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

    @Field({ nullable: true })
    @IsOptional()
    @IsString()
    intent?: string;

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
