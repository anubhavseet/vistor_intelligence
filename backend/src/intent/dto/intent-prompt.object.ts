import { ObjectType, Field, ID } from '@nestjs/graphql';
import { IntentCategory } from '../../common/enums/intent.enum';

@ObjectType()
export class IntentPrompt {
    @Field(() => ID)
    id: string;

    @Field()
    siteId: string;

    @Field(() => IntentCategory)
    intent: IntentCategory;

    @Field()
    prompt: string;

    @Field({ nullable: true })
    description?: string;

    @Field({ nullable: true })
    generatedHtml?: string;

    @Field({ nullable: true })
    generatedCss?: string;

    @Field({ nullable: true })
    generatedJs?: string;

    @Field({ nullable: true })
    generatedTargetSelector?: string;

    @Field({ nullable: true })
    generatedInjectionPosition?: string;

    @Field({ defaultValue: 'popup' })
    injectionMode: string;

    @Field()
    isActive: boolean;

    @Field()
    createdAt: Date;

    @Field()
    updatedAt: Date;
}


@ObjectType()
export class IntentPreview {
    @Field()
    html: string;

    @Field()
    css: string;

    @Field()
    js: string;

    @Field({ nullable: true })
    targetSelector?: string;

    @Field({ nullable: true })
    injectionPosition?: string;
}

/** Full page preview — returns the crawled site HTML with the component injected inline */
@ObjectType()
export class IntentPagePreview {
    @Field()
    pageHtml: string; // Full assembled HTML to drop into an iframe srcdoc

    @Field({ nullable: true })
    targetSelector?: string;

    @Field({ nullable: true })
    injectionPosition?: string;

    @Field({ defaultValue: 'popup' })
    injectionMode: string;
}

/**
 * Public payload served to the tracker SDK for client-side prefetching.
 * Contains all data needed to inject a UI without any additional backend calls.
 */
@ObjectType()
export class IntentPayloadPublic {
    @Field()
    intent: string;

    @Field()
    type: string; // 'inject' | 'inline_inject' | 'highlight' | 'modify' | 'concierge'

    @Field({ nullable: true })
    html?: string;

    @Field({ nullable: true })
    css?: string;

    @Field({ nullable: true })
    js?: string;

    @Field({ nullable: true })
    targetSelector?: string;

    @Field({ nullable: true })
    injectionPosition?: string;

    @Field({ defaultValue: 'popup' })
    injectionMode: string;
}

/**
 * A single entry in the crawl-derived Intent Selector Map.
 * Maps a semantic content category to CSS selectors found on the host website.
 */
@ObjectType()
export class IntentSelectorEntry {
    @Field()
    category: string; // 'pricing' | 'features' | 'testimonial' | 'cta' | 'docs' | 'hero' | etc.

    @Field(() => [String])
    selectors: string[]; // CSS selectors found on the site for this category

    @Field({ nullable: true })
    confidence?: number; // 0-1, from Gemini classification
}
