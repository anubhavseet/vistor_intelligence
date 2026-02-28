import { registerEnumType } from '@nestjs/graphql';

export enum IntentCategory {
    HIGH_INTENT = 'high_intent',
    BOUNCE_RISK = 'bounce_risk',
    HESITATION = 'hesitation',
    RESEARCHER = 'researcher',
    GENERAL = 'general',
    PRICE_SENSITIVE = 'price_sensitive',
    FEATURE_EVALUATOR = 'feature_evaluator',
    CONFUSED = 'confused',
    RETURN_VISITOR = 'return_visitor',
}

registerEnumType(IntentCategory, {
    name: 'IntentCategory',
    description: 'Categories of user intent for tracking and UI injection',
});
