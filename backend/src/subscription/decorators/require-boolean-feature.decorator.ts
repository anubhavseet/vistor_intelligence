import { SetMetadata } from '@nestjs/common';

export const REQUIRES_BOOLEAN_FEATURE_KEY = 'requiresBooleanFeature';
export const RequiresBooleanFeature = (feature: string) => SetMetadata(REQUIRES_BOOLEAN_FEATURE_KEY, feature);
