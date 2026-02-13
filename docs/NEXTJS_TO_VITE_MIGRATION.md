# 🚀 Next.js to React + Vite Migration Guide

## Overview

This document outlines the complete migration from Next.js to React + Vite for the Visitor Intelligence platform frontend.

## Migration Completed

### ✅ Project Setup
- [x] Vite project with React + TypeScript
- [x] Path aliases configured (`@/`, `@components/`, etc.)
- [x] Environment variables setup
- [x] Dependencies installed:
  - react-router-dom (routing)
  - @apollo/client (GraphQL)
  - zustand (state management)
  - lucide-react (icons)
  - framer-motion (animations)

### ✅ Configuration Files
- [x] `vite.config.ts` - Vite configuration with aliases and proxy
- [x] `tsconfig.json` - TypeScript with path mappings
- [x] `.env` & `.env.example` - Environment variables
- [x] Custom CSS preserved

## Professional Folder Structure

```
frontend-react/
├── public/                    # Static assets
├── src/
│   ├── assets/               # Images, fonts, etc.
│   ├── components/           # Reusable components
│   │   ├── common/          # Generic UI components
│   │   ├── layout/          # Layout components
│   │   ├── forms/           # Form components
│   │   └── modals/          # Modal components
│   ├── pages/               # Page components (routes)
│   │   ├── Home.tsx
│   │   ├── Dashboard.tsx
│   │   ├── Sites.tsx
│   │   ├── SiteOverview.tsx
│   │   ├── SiteSettings.tsx
│   │   ├── Crawling.tsx
│   │   ├── TrackingCode.tsx
│   │   ├── Integrations.tsx
│   │   ├── Reports.tsx
│   │   ├── Settings.tsx
│   │   └── SiteDetail.tsx
│   ├── lib/                 # Core library code
│   │   ├── apollo-client.ts
│   │   └── graphql/
│   │       ├── site-operations.ts
│   │       ├── crawler-operations.ts
│   │       └── auth-operations.ts
│   ├── store/               # Zustand stores
│   │   └── auth-store.ts
│   ├── hooks/               # Custom React hooks
│   │   ├── useAuth.ts
│   │   └── useSites.ts
│   ├── types/               # TypeScript type definitions
│   │   └── index.ts
│   ├── utils/               # Utility functions
│   │   └── helpers.ts
│   ├── App.tsx              # Main app with routing
│   ├── main.tsx             # Entry point
│   └── index.css            # Global styles
├── .env                     # Environment variables
├── .env.example             # Environment template
├── vite.config.ts           # Vite configuration
├── tsconfig.json            # TypeScript configuration
└── package.json             # Dependencies
```

## Key Changes from Next.js

### 1. Routing
**Next.js (File-based):**
```
app/
├── page.tsx              → /
├── dashboard/
│   ├── page.tsx         → /dashboard
│   └── [siteId]/
│       └── page.tsx     → /dashboard/[siteId]
```

**React Router (Component-based):**
```typescript
<Routes>
  <Route path="/" element={<HomePage />} />
  <Route path="/dashboard" element={<DashboardPage />} />
  <Route path="/dashboard/:siteId" element={<SiteDetailPage />} />
</Routes>
```

### 2. Navigation
**Next.js:**
```typescript
import Link from 'next/link'
import { useRouter } from 'next/navigation'

<Link href="/dashboard">Dashboard</Link>
router.push('/dashboard')
```

**React Router:**
```typescript
import { Link, useNavigate } from 'react-router-dom'

<Link to="/dashboard">Dashboard</Link>
navigate('/dashboard')
```

### 3. Params and Query
**Next.js:**
```typescript
import { useParams, useSearchParams } from 'next/navigation'

const params = useParams()
const searchParams = useSearchParams()
const siteId = params.siteId
const tab = searchParams.get('tab')
```

**React Router:**
```typescript
import { useParams, useSearchParams } from 'react-router-dom'

const { siteId } = useParams()
const [searchParams] = useSearchParams()
const tab = searchParams.get('tab')
```

### 4. Environment Variables
**Next.js:**
```typescript
process.env.NEXT_PUBLIC_API_URL
```

**Vite:**
```typescript
import.meta.env.VITE_API_URL
```

### 5. Image Handling
**Next.js:**
```typescript
import Image from 'next/image'
```

**Vite/React:**
```typescript
<img src="/path/to/image.png" alt="Description" />
```

### 6. Metadata/Head
**Next.js:**
```typescript
export const metadata = {
  title: 'Page Title'
}
```

**React + Vite:**
```typescript
import { useEffect } from 'react'

useEffect(() => {
  document.title = 'Page Title'
}, [])

// Or use react-helmet-async
```

## Migration Checklist

### Phase 1: Core Setup ✅
- [x] Create Vite project
- [x] Install dependencies
- [x] Configure path aliases
- [x] Set up environment variables
- [x] Configure Apollo Client
- [x] Set up React Router

### Phase 2: Library Migration (TO DO)
- [ ] Copy `lib/graphql/` operations
- [ ] Copy `lib/auth-store.ts` (Zustand)
- [ ] Update imports in store files

### Phase 3: Component Migration (TO DO)
- [ ] Copy all components from `frontend/components/`
- [ ] Update imports (Next.js → React Router)
- [ ] Remove `'use client'` directives
- [ ] Update `useRouter` to `useNavigate`
- [ ] Update `Link` components

Components to migrate:
- [ ] Sidebar.tsx
- [ ] DashboardLayout.tsx
- [ ] AddSiteModal.tsx
- [ ] AddWebsiteModal.tsx
- [ ] CrawlJobList.tsx

### Phase 4: Pages Migration (TO DO)
Pages to migrate from `frontend/app/`:
- [ ] page.tsx → Home.tsx
- [ ] dashboard/page.tsx → Dashboard.tsx
- [ ] dashboard/sites/page.tsx → Sites.tsx
- [ ] dashboard/sites/[siteId]/page.tsx → SiteOverview.tsx
- [ ] dashboard/sites/[siteId]/settings/page.tsx → SiteSettings.tsx
- [ ] dashboard/crawling/page.tsx → Crawling.tsx
- [ ] dashboard/tracking-code/page.tsx → TrackingCode.tsx
- [ ] dashboard/integrations/page.tsx → Integrations.tsx
- [ ] dashboard/reports/page.tsx → Reports.tsx
- [ ] dashboard/settings/page.tsx → Settings.tsx
- [ ] dashboard/[siteId]/page.tsx → SiteDetail.tsx

### Phase 5: Styles Migration (TO DO)
- [ ] Copy `globals.css` → `index.css`
- [ ] Ensure Tailwind CSS is configured
- [ ] Copy custom animations and styles

### Phase 6: Testing & Validation
- [ ] Test all routes
- [ ] Test authentication flow
- [ ] Test GraphQL queries/mutations
- [ ] Test site CRUD operations
- [ ] Test responsive design
- [ ] Test protected routes

## Migration Steps for Each File

### Step 1: Update Imports
```typescript
// Remove
'use client'

// Change
import { useRouter } from 'next/navigation'
import { useParams } from 'next/navigation'
import Link from 'next/link'

// To
import { useNavigate, useParams, Link } from 'react-router-dom'
```

### Step 2: Update Navigation
```typescript
// Change
const router = useRouter()
router.push('/dashboard')

// To
const navigate = useNavigate()
navigate('/dashboard')
```

### Step 3: Update Links
```typescript
// Change
<Link href="/dashboard">Dashboard</Link>

// To
<Link to="/dashboard">Dashboard</Link>
```

### Step 4: Update Path Aliases
```typescript
// Change (if using relative paths)
import Component from '../../components/Component'

// To
import Component from '@/components/Component'
```

## Development Commands

```bash
# Install dependencies
npm install

# Run development server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview

# Type check
npm run type-check
```

## Port Configuration

- **Development:** http://localhost:3000
- **API Proxy:** Configured for http://localhost:4000

## Environment Variables

Create `.env` file:
```bash
VITE_API_URL=http://localhost:4000
VITE_GRAPHQL_URI=http://localhost:4000/graphql
VITE_APP_NAME=Visitor Intelligence
```

## Benefits of Vite over Next.js

1. **Faster Development:**
   - Instant HMR (Hot Module Replacement)
   - No build step for dev server
   - Lightning-fast rebuilds

2. **Simpler Routing:**
   - Explicit routing with React Router
   - More control over route logic
   - Easier to understand and debug

3. **Better Performance:**
   - Optimized production builds
   - Tree-shaking by default
   - Smaller bundle sizes

4. **Framework Flexibility:**
   - Not tied to Next.js conventions
   - Use any routing library
   - More control over app structure

5. **Developer Experience:**
   - Simpler configuration
   - Less magic, more explicit
   - Better TypeScript integration

## Next Steps

1. Run migration script (when created)
2. Manually update each component
3. Test each route
4. Update documentation
5. Deploy to production

## Important Notes

- All GraphQL operations remain the same
- Zustand store works identically
- Apollo Client configuration is similar
- Component logic remains unchanged
- Only routing and imports change

## Support

For issues during migration:
1. Check import statements
2. Verify path aliases
3. Check React Router docs
4. Test in isolation

---

**Migration Status:** 🟡 In Progress
**Estimated Completion:** Follow checklist above
**Priority:** High
