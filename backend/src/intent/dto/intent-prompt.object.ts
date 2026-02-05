import { ObjectType, Field, ID } from '@nestjs/graphql';

@ObjectType()
export class IntentPrompt {
    @Field(() => ID)
    id: string;

    @Field()
    siteId: string;

    @Field()
    intent: string;

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
}

