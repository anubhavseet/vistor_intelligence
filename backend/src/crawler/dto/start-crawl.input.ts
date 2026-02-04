import { InputType, Field, Int } from '@nestjs/graphql';
import { IsString, IsUrl, IsOptional, IsInt, Min, Max } from 'class-validator';

@InputType()
export class StartCrawlInput {
    @Field()
    @IsString()
    siteId: string;

    @Field()
    @IsUrl({
        protocols: ['http', 'https'],
        require_protocol: true,
    })
    startUrl: string;

    @Field(() => Int, { nullable: true, defaultValue: 50 })
    @IsOptional()
    @IsInt()
    @Min(1)
    @Max(500)
    maxPages?: number;

    @Field(() => Int, { nullable: true, defaultValue: 3 })
    @IsOptional()
    @IsInt()
    @Min(1)
    @Max(10)
    maxDepth?: number;

    @Field({ nullable: true, defaultValue: true })
    @IsOptional()
    sameDomainOnly?: boolean;
}
