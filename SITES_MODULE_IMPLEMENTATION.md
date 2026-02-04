# Sites Module - Complete Implementation Guide

## Overview

The Sites module manages website registration, configuration, and API key generation for the Visitor Intelligence platform. This document outlines the complete backend and frontend implementation with all GraphQL operations properly structured.

## Backend Implementation

### 1. **Database Schema** (`backend/src/common/schemas/site.schema.ts`)

```typescript
Site Schema Fields:
- siteId: string (unique identifier)
- name: string (display name)
- domain?: string (primary domain)
- allowedDomains: string[] (tracking allowed domains)
- userId: string (owner user ID)
- isActive: boolean (active status)
- settings: {
    enableTracking: boolean
    enableGeoLocation: boolean
    enableBehaviorTracking: boolean
    dataRetentionDays: number
  }
- apiKey?: string (authentication key)
- createdAt: Date (auto-generated)
- updatedAt: Date (auto-generated)
```

### 2. **GraphQL Type Definitions** (`backend/src/sites/dto/site.type.ts`)

```graphql
type SiteSettings {
  enableTracking: Boolean!
  enableGeoLocation: Boolean!
  enableBehaviorTracking: Boolean!
  dataRetentionDays: Int!
}

type Site {
  id: String!
  siteId: String!
  name: String!
  domain: String
  allowedDomains: [String!]!
  userId: String!
  isActive: Boolean!
  settings: SiteSettings!
  apiKey: String
  createdAt: DateTime!
  updatedAt: DateTime!
}
```

### 3. **Input Types**

**CreateSiteInput** (`backend/src/sites/dto/create-site.input.ts`):
```graphql
input CreateSiteInput {
  name: String!
  domain: String
}
```

**UpdateSiteInput** (`backend/src/sites/dto/update-site.input.ts`):
```graphql
input UpdateSiteInput {
  name: String
  domain: String
  isActive: Boolean
}
```

### 4. **GraphQL Resolvers** (`backend/src/sites/sites.resolver.ts`)

#### Queries:
1. **getSites** - Get all user's sites
   ```graphql
   query GetSites {
     getSites {
       id
       siteId
       name
       domain
       isActive
       # ... other fields
     }
   }
   ```

2. **getSite** - Get single site by siteId
   ```graphql
   query GetSite($siteId: String!) {
     getSite(siteId: $siteId) {
       id
       siteId
       name
       # ... other fields
     }
   }
   ```

#### Mutations:
1. **createSite** - Create new site (returns Site with API key)
   ```graphql
   mutation CreateSite($input: CreateSiteInput!) {
     createSite(input: $input) {
       id
       siteId
       name
       domain
       apiKey
       # ... other fields
     }
   }
   ```

2. **registerClientSite** - Alias for createSite (legacy support)

3. **updateSite** - Update site details
   ```graphql
   mutation UpdateSite($siteId: String!, $input: UpdateSiteInput!) {
     updateSite(siteId: $siteId, input: $input) {
       id
       siteId
       name
       isActive
       # ... other fields
     }
   }
   ```

4. **deleteSite** - Soft delete site (sets isActive = false)
   ```graphql
   mutation DeleteSite($siteId: String!) {
     deleteSite(siteId: $siteId)
   }
   ```

### 5. **Service Layer** (`backend/src/sites/sites.service.ts`)

**Methods:**
- `createSite(userId, name, domain?)` - Creates site with auto-generated siteId and apiKey
- `getSiteBySiteId(siteId)` - Retrieves site by siteId
- `getUserSites(userId)` - Gets all active sites for user
- `validateApiKey(siteId, apiKey)` - Validates API key for site
- `updateSite(userId, siteId, updates)` - Updates site with authorization check
- `deleteSite(userId, siteId)` - Soft deletes site (sets isActive = false)

**Key Features:**
- Auto-generates siteId: `site_${uuid}`
- Auto-generates apiKey: `sk_${uuid without dashes}`
- Authorization checks on all mutations
- Soft delete (preserves data)

## Frontend Implementation

### 1. **Centralized GraphQL Operations** (`frontend/lib/graphql/site-operations.ts`)

**Complete operations file with:**
- All queries (GET_SITES, GET_SITE)
- All mutations (CREATE_SITE, UPDATE_SITE, DELETE_SITE)
- TypeScript interfaces matching backend schema
- Response type definitions

**Usage Example:**
```typescript
import { GET_SITES, CREATE_SITE, type Site } from '@/lib/graphql/site-operations'

// In component
const { data, loading, error } = useQuery(GET_SITES)
const [createSite] = useMutation(CREATE_SITE)
```

### 2. **Updated Components**

#### **AddSiteModal** (`frontend/components/AddSiteModal.tsx`)
- Uses `CREATE_SITE` from centralized operations
- Two-step flow: Create → Show API Key
- API key displayed only once (security)
- Success state with next steps

#### **Dashboard** (`frontend/app/dashboard/page.tsx`)
- Uses `GET_SITES` query
- Displays site cards
- Shows site stats
- Quick actions for site management

#### **Sites Page** (`frontend/app/dashboard/sites/page.tsx`)
- Uses `GET_SITES` query
- Search and filter functionality
- Site cards with status badges
- Links to site details and settings

#### **Crawling Page** (`frontend/app/dashboard/crawling/page.tsx`)
- Uses `GET_SITES` for site selection
- Integrates with crawl operations

#### **Tracking Code Page** (`frontend/app/dashboard/tracking-code/page.tsx`)
- Uses `GET_SITES` for site selection
- Displays tracking code with API keys
- Multiple framework examples

## Data Flow

### Creating a New Site

```
Frontend                    Backend                     Database
--------                    -------                     ---------
1. User fills form
2. Submit CREATE_SITE  -->  3. Validate input
                            4. Generate siteId, apiKey
                            5. Create site document  --> 6. Save to MongoDB
                        <-- 7. Return site with apiKey
8. Display API key
```

### Retrieving Sites

```
Frontend                    Backend                     Database
--------                    -------                     ---------
1. Component mounts
2. Execute GET_SITES   -->  3. Extract userId from JWT
                            4. Query sites           --> 5. Find by userId
                        <-- 6. Return sites array
7. Render site list
```

### Updating a Site

```
Frontend                    Backend                     Database
--------                    -------                     ---------
1. User edits site
2. Submit UPDATE_SITE  -->  3. Validate authorization
                            4. Apply updates         --> 5. Save changes
                        <-- 6. Return updated site
7. Update UI
```

## Security Features

1. **JWT Authentication** - All resolvers protected with `@UseGuards(JwtAuthGuard)`
2. **Authorization Checks** - Verify userId matches before mutations
3. **API Key Generation** - Unique, secure keys for each site
4. **Soft Delete** - Preserve data when "deleting" sites
5. **Owner Validation** - Only site owner can modify/delete

## Best Practices Implemented

1. **Centralized Operations** - Single source of truth for GraphQL
2. **Type Safety** - Full TypeScript coverage
3. **Error Handling** - Proper error states in UI
4. **Loading States** - User feedback during async operations
5. **Optimistic Updates** - Refetch after mutations
6. **Consistent Naming** - Matching backend/frontend conventions

## Usage Examples

### Frontend: Create Site
```typescript
import { useMutation } from '@apollo/client'
import { CREATE_SITE } from '@/lib/graphql/site-operations'

const [createSite, { loading, error }] = useMutation(CREATE_SITE, {
  onCompleted: (data) => {
    console.log('Created site:', data.createSite)
    // API key is in data.createSite.apiKey
  }
})

// Execute
await createSite({
  variables: {
    input: {
      name: 'My Website',
      domain: 'example.com'
    }
  }
})
```

### Frontend: Get All Sites
```typescript
import { useQuery } from '@apollo/client'
import { GET_SITES, type GetSitesResponse } from '@/lib/graphql/site-operations'

const { data, loading, error } = useQuery<GetSitesResponse>(GET_SITES)

const sites = data?.getSites || []
```

### Frontend: Update Site
```typescript
import { useMutation } from '@apollo/client'
import { UPDATE_SITE, GET_SITES } from '@/lib/graphql/site-operations'

const [updateSite] = useMutation(UPDATE_SITE, {
  refetchQueries: [{ query: GET_SITES }]
})

await updateSite({
  variables: {
    siteId: 'site_123',
    input: {
      name: 'Updated Name',
      isActive: false
    }
  }
})
```

### Frontend: Delete Site
```typescript
import { useMutation } from '@apollo/client'
import { DELETE_SITE, GET_SITES } from '@/lib/graphql/site-operations'

const [deleteSite] = useMutation(DELETE_SITE, {
  refetchQueries: [{ query: GET_SITES }]
})

await deleteSite({
  variables: {
    siteId: 'site_123'
  }
})
```

## File Structure

```
backend/
├── src/
│   ├── common/schemas/
│   │   └── site.schema.ts          # Mongoose schema
│   └── sites/
│       ├── dto/
│       │   ├── site.type.ts        # GraphQL type
│       │   ├── create-site.input.ts
│       │   └── update-site.input.ts
│       ├── sites.module.ts
│       ├── sites.resolver.ts       # GraphQL resolvers
│       └── sites.service.ts        # Business logic

frontend/
├── lib/graphql/
│   └── site-operations.ts          # Centralized operations
├── components/
│   └── AddSiteModal.tsx           # Create site UI
└── app/dashboard/
    ├── page.tsx                   # Dashboard with sites
    ├── sites/page.tsx             # Sites management
    ├── crawling/page.tsx          # Crawling (uses sites)
    └── tracking-code/page.tsx     # Tracking code (uses sites)
```

## Testing

### Backend Tests
```bash
# Test site creation
POST /graphql
{
  "query": "mutation { createSite(input: { name: \"Test\" }) { siteId apiKey } }"
}

# Test query
POST /graphql
{
  "query": "query { getSites { siteId name domain } }"
}
```

### Frontend Tests
```typescript
// Mock query
const mocks = [{
  request: {
    query: GET_SITES
  },
  result: {
    data: {
      getSites: [{ id: '1', siteId: 'site_123', name: 'Test' }]
    }
  }
}]
```

## Summary

✅ **Backend Complete:**
- Full CRUD operations
- Secure with JWT auth
- Auto-generated IDs and API keys
- Soft delete implementation

✅ **Frontend Complete:**
- Centralized GraphQL operations
- All pages using standard imports
- Type-safe with TypeScript
- Consistent error handling

✅ **Integration:**
- Matching field names
- Proper data flow
- Security implemented
- Production-ready

The sites module is now fully implemented with best practices, type safety, and complete documentation!
