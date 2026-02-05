import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type IntentPromptDocument = IntentPrompt & Document;

@Schema({ timestamps: true })
export class IntentPrompt {
    @Prop({ required: true, index: true })
    siteId: string;

    @Prop({ required: true })
    intent: string; // e.g., 'high_intent', 'bounce_risk', 'hesitation'

    @Prop({ required: true })
    prompt: string; // The system prompt instruction for the AI

    @Prop({ type: String })
    description?: string; // User friendly description

    @Prop({ type: String })
    generatedHtml?: string;

    @Prop({ type: String })
    generatedCss?: string;

    @Prop({ type: String })
    generatedJs?: string;

    @Prop({ type: Boolean, default: true })
    isActive: boolean;
}

export const IntentPromptSchema = SchemaFactory.createForClass(IntentPrompt);

// Compound index to ensure one prompt per intent per site? Or allow multiple?
// Likely one active prompt per intent is best for deterministic behavior, but maybe A/B testing later.
// For now, let's just index siteId. 
IntentPromptSchema.index({ siteId: 1, intent: 1 });
