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
