import { ObjectType, Field, InputType, Int, Float } from '@nestjs/graphql';

@ObjectType()
export class GeoType {
    @Field({ nullable: true })
    country?: string;

    @Field({ nullable: true })
    region?: string;

    @Field({ nullable: true })
    city?: string;

    @Field(() => Float, { nullable: true })
    lat?: number;

    @Field(() => Float, { nullable: true })
    lng?: number;

    @Field({ nullable: true })
    timezone?: string;
}

@ObjectType()
export class VisitorSessionType {
    @Field()
    sessionId: string;

    @Field()
    siteId: string;

    @Field({ nullable: true })
    organizationName?: string;

    @Field(() => GeoType, { nullable: true })
    geo?: GeoType;

    @Field(() => Int)
    intentScore: number;

    @Field()
    intentCategory: string;

    @Field()
    startedAt: Date;

    @Field({ nullable: true })
    lastActivityAt?: Date;

    @Field(() => [String])
    pagesVisited: string[];

    @Field(() => Int)
    totalPageViews: number;

    @Field()
    isActive: boolean;
}

@ObjectType()
export class SiteConfigType {
    @Field(() => String, { nullable: true })
    settings?: string; // JSON string

    @Field(() => [String], { nullable: true })
    allowedDomains?: string[];

    @Field()
    isActive: boolean;
}

@ObjectType()
export class TrackResponse {
    @Field({ nullable: true })
    sessionId?: string;

    @Field({ nullable: true })
    intent_category?: string;

    @Field({ nullable: true })
    current_score?: number;

    @Field({ nullable: true })
    suggested_action?: string;

    @Field({ nullable: true })
    ui_payload?: string; // JSON string
}

@InputType()
export class SignalBatchInput {
    @Field(() => String, { nullable: true, description: 'JSON string of dwell_time map' })
    dwell_time?: string;

    @Field(() => Float, { nullable: true })
    scroll_velocity?: number;

    @Field(() => Int, { nullable: true })
    scroll_depth?: number;

    @Field({ nullable: true })
    hesitation_event?: boolean;

    @Field(() => Int, { nullable: true })
    rage_clicks?: number;

    @Field(() => [String], { nullable: true })
    copy_text?: string[];

    @Field(() => [String], { nullable: true })
    text_selections?: string[];

    @Field(() => String, { nullable: true, description: 'JSON string of events array' })
    events?: string;

    @Field(() => String, { nullable: true, description: 'JSON string of interactions map' })
    interactions?: string;

    @Field({ nullable: true })
    url?: string;

    @Field({ nullable: true })
    referrer?: string;
}

@InputType()
export class TrackInput {
    @Field({ nullable: true })
    sessionId?: string;

    @Field({ nullable: true })
    eventType?: string;

    @Field({ nullable: true })
    pageUrl?: string;

    @Field({ nullable: true })
    referrer?: string;

    @Field({ nullable: true })
    userAgent?: string;

    @Field({ nullable: true })
    ipAddress?: string;

    @Field(() => String, { nullable: true })
    metadata?: string; // JSON string

    @Field(() => SignalBatchInput, { nullable: true })
    signals?: SignalBatchInput;

    @Field(() => Float, { nullable: true })
    timestamp?: number;
}
