import { ObjectType, Field, Int, registerEnumType } from '@nestjs/graphql';

export enum CrawlStatus {
    PENDING = 'PENDING',
    IN_PROGRESS = 'IN_PROGRESS',
    COMPLETED = 'COMPLETED',
    FAILED = 'FAILED',
}

registerEnumType(CrawlStatus, {
    name: 'CrawlStatus',
});

@ObjectType()
export class CrawlJobStatus {
    @Field()
    jobId: string;

    @Field()
    siteId: string;

    @Field(() => CrawlStatus)
    status: CrawlStatus;

    @Field(() => Int)
    pagesDiscovered: number;

    @Field(() => Int)
    pagesCrawled: number;

    @Field(() => Int, { nullable: true })
    pagesFailed?: number;

    @Field({ nullable: true })
    startedAt?: Date;

    @Field({ nullable: true })
    completedAt?: Date;

    @Field({ nullable: true })
    error?: string;

    @Field(() => [String])
    urlsQueued: string[];
}
