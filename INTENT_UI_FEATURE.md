# Pre-Generated AI Intent UI Feature

## Overview
This feature adds a new setting to control whether the backend should use pre-generated AI intent UI or generate it on-the-go based on user intent signals.

## What Was Implemented

### 1. Backend Changes

#### Schema Updates (`backend/src/common/schemas/site.schema.ts`)
- Added `usePreGeneratedIntentUI` boolean field to site settings
- Default value: `false` (uses on-the-go generation by default)

#### Intent Service Updates (`backend/src/intent/intent.service.ts`)
- Modified `analyzeAndGetUi` method to check site settings for pre-generated UI preference
- When `usePreGeneratedIntentUI` is enabled:
  - Retrieves pre-generated HTML, CSS, and JS from IntentPrompt schema
  - Skips real-time AI generation for faster response
  - Falls back to on-the-go generation if no pre-generated UI is available
- When disabled (default):
  - Uses existing behavior - generates UI dynamically using Gemini API

#### Intent Calculation Fix
- Fixed logic error in `calculateRealTimeScore` method
  - Removed overlapping condition that was causing incorrect suggestedAction values
  - Proper if-else chain now ensures correct action based on intent score

#### GraphQL Types & DTOs
- Updated `SiteSettings` GraphQL type to include `usePreGeneratedIntentUI`
- Updated `UpdateSiteSettingsInput` to allow updating the setting
- All site-related queries now return this field

### 2. Frontend Changes

#### GraphQL Operations (`frontend-react/src/lib/graphql/site-operations.ts`)
- Added `usePreGeneratedIntentUI` to all GraphQL queries:
  - GET_SITES
  - GET_SITE
  - CREATE_SITE
  - UPDATE_SITE
  - REGENERATE_API_KEY
- Updated TypeScript interfaces:
  - `SiteSettings` interface
  - `UpdateSiteSettings` interface

#### Site Settings Page (`frontend-react/src/pages/SiteSettings.tsx`)
- Added state variable for `usePreGeneratedIntentUI`
- Added toggle UI in the Tracking Settings section
- Toggle allows users to enable/disable pre-generated intent UI
- Integrated with save functionality to persist changes

## How to Use

### For Site Administrators

1. Navigate to **Dashboard > Sites > [Your Site] > Settings**
2. Scroll to the **Tracking Settings** section
3. Find the **"Use Pre-Generated AI Intent UI"** toggle
4. Enable it to use pre-generated UI (faster) or disable for on-the-go generation (more dynamic)
5. Click **Save Changes**

### For Developers

The feature works automatically based on the setting:

**Pre-Generated Mode (Enabled)**:
```typescript
// Backend checks site settings
const site = await this.sitesService.getSiteBySiteId(siteId);
if (site.settings.usePreGeneratedIntentUI) {
  // Look up pre-generated UI from IntentPrompt
  const customPrompt = await this.intentPromptsService.getPromptForIntent(siteId, intentKey);
  if (customPrompt && customPrompt.generatedHtml) {
    // Use pre-generated HTML/CSS/JS
    uiPayload = {
      html_payload: customPrompt.generatedHtml,
      scoped_css: customPrompt.generatedCss,
      javascript_payload: customPrompt.generatedJs
    };
  }
}
```

**On-the-Go Mode (Disabled - Default)**:
```typescript
// Generate UI dynamically using Gemini API
uiPayload = await this.geminiService.generateUiElement(
  instruction,
  contextHtml,
  contextDesc
);
```

## Benefits

### Pre-Generated UI (When Enabled)
- ✅ **Faster Response**: No API calls to Gemini during user interaction
- ✅ **Consistent Experience**: Same UI every time for a given intent
- ✅ **Lower API Costs**: Reduced Gemini API usage
- ✅ **Predictable**: Known UI behavior for testing
- ❌ **Less Dynamic**: Cannot adapt to specific user context on-the-fly

### On-the-Go Generation (Default)
- ✅ **Highly Dynamic**: Adapts to user's specific page context
- ✅ **Personalized**: Takes into account user behavior and page content
- ✅ **Fresh**: Always current with latest site content
- ❌ **Slower**: Requires API call to Gemini (typically 1-3 seconds)
- ❌ **Higher Costs**: More API usage

## Intent Calculation Improvements

Fixed the intent scoring logic to properly calculate and categorize user intent:

### Score Ranges
- **0-29**: Bouncer (low intent)
- **30-70**: Researcher (medium intent)
- **71-100**: Lead (high intent)

### Suggested Actions
- **Score > 80**: `priority_support_chat`
- **Score > 50**: `lure_customers_to_contact_Us_with_discount_or_offer`
- **Exit Intent + Lead**: `discount_modal`

### Intent Key Mapping
- Exit intent → `bounce_risk`
- Hesitation event → `hesitation`
- Lead category → `high_intent`
- Researcher category → `researcher`

## Technical Details

### Files Modified

**Backend:**
- `backend/src/common/schemas/site.schema.ts`
- `backend/src/intent/intent.service.ts`
- `backend/src/sites/dto/site.type.ts`
- `backend/src/sites/dto/update-site.input.ts`

**Frontend:**
- `frontend-react/src/lib/graphql/site-operations.ts`
- `frontend-react/src/pages/SiteSettings.tsx`

### Database Migration

No database migration required - the schema uses Mongoose defaults. Existing sites will automatically have `usePreGeneratedIntentUI: false`.

## Testing

1. **Create Intent Prompts**: Ensure you have IntentPrompt entries with generated HTML/CSS/JS
2. **Enable Setting**: Toggle on "Use Pre-Generated AI Intent UI" in site settings
3. **Trigger Intent**: Perform actions that trigger intent detection (e.g., hover on CTA, exit intent)
4. **Verify**: Check that pre-generated UI is used (check backend logs for "Using pre-generated UI for intent")
5. **Disable Setting**: Toggle off and verify it falls back to on-the-go generation

## Future Enhancements

- [ ] Add UI to preview pre-generated intent UIs
- [ ] Bulk regenerate all intent UIs for a site
- [ ] A/B testing between pre-generated and on-the-go
- [ ] Analytics dashboard showing which mode performs better
- [ ] Cache on-the-go generated UIs as templates
