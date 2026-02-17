import { ObjectType, Field, InputType, Int, Float } from '@nestjs/graphql';

/**
 * Input type for tracking events via GraphQL mutation
 */
@InputType()
export class TrackingEventInput {
    @Field()
    siteId: string;

    @Field()
    sessionId: string;

    @Field()
    eventType: string;

    @Field()
    data: string; // JSON string of event data

    @Field(() => Float, { nullable: true })
    timestamp?: number;
}

/**
 * Response from tracking event mutation
 */
@ObjectType()
export class TrackingEventResponse {
    @Field()
    success: boolean;

    @Field()
    sessionId: string;

    @Field(() => Float)
    intentScore: number;

    @Field({ nullable: true })
    uiPayload?: string; // JSON string

    @Field({ nullable: true })
    error?: string;
}

/**
 * Live session update for admin dashboard subscription
 */
@ObjectType()
export class LiveSessionUpdate {
    @Field()
    sessionId: string;

    @Field()
    siteId: string;

    @Field()
    eventType: string;

    @Field(() => Float)
    intentScore: number;

    @Field(() => Float)
    lastActivity: number;

    @Field()
    currentPage: string;
}

/**
 * Intent score update subscription payload
 */
@ObjectType()
export class IntentUpdate {
    @Field()
    sessionId: string;

    @Field(() => Float)
    score: number;

    @Field()
    category: string;

    @Field(() => Float)
    timestamp: number;
}

/**
 * UI injection payload for real-time personalization
 */
@ObjectType()
export class UIInjectionPayload {
    @Field()
    sessionId: string;

    @Field()
    payload: string; // JSON string containing html, css, js

    @Field(() => Float)
    timestamp: number;
}

/**
 * Session state type for queries
 */
@ObjectType()
export class SessionStateType {
    @Field()
    sessionId: string;

    @Field()
    siteId: string;

    @Field(() => Float)
    connectedAt: number;

    @Field(() => Float)
    lastActivityAt: number;

    @Field()
    ipAddress: string;

    @Field()
    userAgent: string;

    @Field({ nullable: true })
    currentPage?: string;

    @Field(() => Float)
    intentScore: number;

    @Field(() => Int)
    eventCount: number;

    @Field()
    isActive: boolean;
}
