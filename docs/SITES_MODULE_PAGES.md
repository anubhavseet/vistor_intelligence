# Sites Module - Complete Pages Implementation

## Overview

This document outlines all pages created for the comprehensive Sites module, including backend functionality integration and complete CRUD operations.

## Backend Enhancements

### New Resolvers Added

#### 1. **regenerateApiKey** Mutation
```graphql
mutation RegenerateApiKey($siteId: String!) {
  regenerateApiKey(siteId: $siteId) {
    id
    siteId
    apiKey
    # ... all site fields
  }
}
```
- Generates new API key for a site
- Invalidates old API key
- Returns updated site with new key

### Enhanced Input Types

#### UpdateSiteInput
```typescript
interface UpdateSiteInput {
  name?: string
  domain?: string
  allowedDomains?: string[]
  isActive?: boolean
  settings?: {
    enableTracking?: boolean
    enableGeoLocation?: boolean
    enableBehaviorTracking?: boolean
    data RetentionDays?: number
  }
}
```

### Service Methods
- `updateSite()` - Enhanced to handle nested settings updates
- `deleteSite()` - Soft delete (sets isActive = false)
- `regenerateApiKey()` - Generates new API key

## Frontend Pages Created

### 1. **Site Overview** (`/dashboard/sites/[siteId]`)

**Purpose**: Main dashboard for a specific site showing all details and quick actions.

**Features**:
- ✅ Site header with name, domain, and status badge
- ✅ Site ID display
- ✅ Stats grid (visitors, pageviews, accounts, retention)
- ✅ Tracking configuration status indicators
- ✅ Allowed domains list
- ✅ Quick action cards:
  - Site Settings
  - Tracking Code
  - Start Crawling
  - View Analytics
- ✅ Site information (created date, updated date, owner)

**Key Components**:
```typescript
// Stats Display
- Total Visitors (with icon)
- Pageviews (with trend)
- Identified Accounts
- Data Retention Days

// Configuration Status
- Visitor Tracking (✓/✗)
- Geo-Location (✓/✗)
- Behavior Tracking (✓/✗)
- Data Retention (days)

// Allowed Domains
- List of configured domains
- Empty state for "all allowed"
```

**GraphQL Used**:
- `GET_SITE` - Fetch complete site details

### 2. **Site Settings** (`/dashboard/sites/[siteId]/settings`)

**Purpose**: Complete site configuration and management interface.

**Features**:

#### Basic Information Section
- ✅ Site name (editable)
- ✅ Primary domain (editable)
- ✅ Site ID (read-only)
- ✅ Status toggle (Active/Inactive)

#### Allowed Domains Section
- ✅ Add new domains
- ✅ Remove existing domains
- ✅ Domain validation
- ✅ Empty state message

#### Tracking Settings Section
- ✅ Enable Tracking toggle
- ✅ Enable Geo-Location toggle
- ✅ Enable Behavior Tracking toggle
- ✅ Data Retention slider (30-365 days, increments of 30)

#### API Key Management (Sidebar)
- ✅ Show/Hide API key button
- ✅ Copy to clipboard functionality
- ✅ Regenerate API key (with confirmation)
- ✅ Warning about invalidation

#### Site Information (Sidebar)
- ✅ Created date
- ✅ Last updated date
- ✅ Current status

#### Danger Zone (Sidebar)
- ✅ Delete site button
- ✅ Two-click confirmation
- ✅ Warning message
- ✅ 5-second timeout on confirmation

**GraphQL Used**:
- `GET_SITE` - Load current settings
- `UPDATE_SITE` - Save all changes
- `DELETE_SITE` - Soft delete site
- `REGENERATE_API_KEY` - Generate new key

**Layout**:
```
┌────────────────────────┬────────────┐
│ Header with Save Button              │
├────────────────────────┬─────────────┤
│ Basic Information      │ API Key     │
│ - Name                 │ - Show/Hide │
│ - Domain               │ - Regenerate│
│ - Site ID              │             │
│ - Status Toggle        │ Site Info   │
│                        │ - Created   │
│ Allowed Domains        │ - Updated   │
│ - Add/Remove           │ - Status    │
│ - Domain List          │             │
│                        │ Danger Zone │
│ Tracking Settings      │ - Delete    │
│ - Enable Tracking      │             │
│ - Geo-Location         │             │
│ - Behavior Tracking    │             │
│ - Data Retention       │             │
└────────────────────────┴─────────────┘
```

## Complete Feature List

### Site Management

#### Create Site
- Name and domain input
- Auto-generated site ID and API key
- API key shown only once on creation
- Success confirmation

#### View Site
- Overview dashboard
- Configuration status
- Stats and metrics
- Quick actions

#### Update Site
- Basic information
- Allowed domains
- Tracking settings
- Status toggle
- Save confirmation

#### Delete Site
- Soft delete (preserves data)
- Two-click confirmation
- 5-second timeout
- Redirect to sites list

### Security Features

#### API Key Management
- Secure display (show/hide)
- Copy to clipboard
- Regenerate with confirmation
- Warning about invalidation

#### Domain Restrictions
- Whitelist allowed domains
- Multiple domain support
- Easy add/remove
- Empty = all allowed

### Tracking Configuration

#### Feature Toggles
1. **Visitor Tracking**
   - Enable/disable pageview tracking
   - Session tracking

2. **Geo-Location**
   - Enable/disable location data
   - IP-based location tracking

3. **Behavior Tracking**
   - Click tracking
   - Scroll tracking
   - Interaction tracking

4. **Data Retention**
   - Configurable period (30-365 days)
   - Slider interface
   - 30-day increments

## Navigation Flow

```
Sites List (/dashboard/sites)
    │
    ├─→ Site Overview (/dashboard/sites/[siteId])
    │       │
    │       ├─→ Settings → Site Settings Page
    │       ├─→ Tracking Code → Tracking Code Page
    │       ├─→ Start Crawling → Crawling Page
    │       └─→ View Analytics → Analytics Tab
    │
    └─→ Add New Site → AddSiteModal → Site Settings
```

## User Workflows

### 1. Creating a New Site
```
1. Click "Add Website" from any page
2. Enter site name and domain (optional)
3. Click "Create Site"
4. View API key (shown once)
5. Copy API key to safe location
6. Click "Done"
7. Redirected to sites list (or overview)
```

### 2. Configuring a Site
```
1. Navigate to site overview
2. Click "Settings" button
3. Update desired fields:
   - Basic info
   - Allowed domains
   - Tracking settings
4. Click "Save Changes"
5. Confirmation message shown
6. Settings applied immediately
```

### 3. Managing API Keys
```
1. Go to site settings
2. Click "Show API Key" (sidebar)
3. Copy key if needed
4. To regenerate:
   - Click "Regenerate API Key"
   - Confirm warning dialog
   - New key generated
   - Old key invalidated
```

### 4. Deleting a Site
```
1. Go to site settings
2. Scroll to "Danger Zone" (sidebar)
3. Click "Delete Site"
4. Button changes to "Click Again to Confirm"
5. Click again within 5 seconds
6. Site soft-deleted (isActive = false)
7. Redirected to sites list
```

## Technical Implementation

### State Management
```typescript
// Form state for all editable fields
const [name, setName] = useState('')
const [domain, setDomain] = useState('')
const [allowedDomains, setAllowedDomains] = useState<string[]>([])
const [isActive, setIsActive] = useState(true)
const [enableTracking, setEnableTracking] = useState(true)
const [enableGeoLocation, setEnableGeoLocation] = useState(true)
const [enableBehaviorTracking, setEnableBehaviorTracking] = useState(true)
const [dataRetentionDays, setDataRetentionDays] = useState(90)
```

### GraphQL Integration
```typescript
// Load site data
const { data, loading, error, refetch } = useQuery(GET_SITE, {
  variables: { siteId },
  onCompleted: (data) => {
    // Populate form state
  }
})

// Update site
const [updateSite] = useMutation(UPDATE_SITE, {
  onCompleted: () => {
    alert('Site updated successfully!')
    refetch()
  }
})

// Delete site
const [deleteSite] = useMutation(DELETE_SITE, {
  onCompleted: () => {
    router.push('/dashboard/sites')
  }
})

// Regenerate API key
const [regenerateApiKey] = useMutation(REGENERATE_API_KEY, {
  onCompleted: () => {
    alert('API key regenerated!')
    setShowApiKey(true)
    refetch()
  }
})
```

### Form Submission
```typescript
const handleSave = async () => {
  await updateSite({
    variables: {
      siteId,
      input: {
        name,
        domain: domain || undefined,
        allowedDomains,
        isActive,
        settings: {
          enableTracking,
          enableGeoLocation,
          enableBehaviorTracking,
          dataRetentionDays
        }
      }
    }
  })
}
```

## UI/UX Features

### Visual Feedback
- ✅ Loading states with spinners
- ✅ Success messages
- ✅ Error messages
- ✅ Disabled states during operations
- ✅ Confirmation dialogs
- ✅ Copy-to-clipboard feedback

### Responsive Design
- ✅ Mobile-friendly layout
- ✅ Tablet optimization
- ✅ Desktop full-width
- ✅ Sidebar collapses on mobile

### Accessibility
- ✅ Keyboard navigation
- ✅ ARIA labels
- ✅ Focus states
- ✅ Color contrast
- ✅ Screen reader friendly

## File Structure

```
frontend/app/dashboard/sites/
├── page.tsx                        # Sites list (existing)
└── [siteId]/
    ├── page.tsx                    # Site overview (NEW)
    └── settings/
        └── page.tsx                # Site settings (NEW)

frontend/lib/graphql/
└── site-operations.ts              # Updated with new mutations

backend/src/sites/
├── dto/
│   └── update-site.input.ts        # Enhanced with settings
├── sites.service.ts                # Added regenerateApiKey
└── sites.resolver.ts               # Added regenerateApiKey mutation
```

## Summary

### Pages Created
1. ✅ **Site Overview** - Dashboard with stats and quick actions
2. ✅ **Site Settings** - Complete configuration interface

### Backend Added
1. ✅ **regenerateApiKey** mutation
2. ✅ Enhanced **UpdateSiteInput** with settings
3. ✅ Settings merge logic in service

### Features Implemented
1. ✅ Full CRUD operations
2. ✅ API key management
3. ✅ Domain whitelisting
4. ✅ Tracking configuration
5. ✅ Data retention settings
6. ✅ Soft delete
7. ✅ Status toggling

### Security
1. ✅ JWT authentication on all operations
2. ✅ Owner validation
3. ✅ API key regeneration
4. ✅ Confirmation dialogs
5. ✅ Soft deletes (data preservation)

The Sites module is now **complete and production-ready** with all necessary pages, functionality, and integrations! 🎉
