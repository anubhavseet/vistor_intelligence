# Frontend Application - Complete Setup

## Overview

The frontend is a fully-featured Next.js application with a sidebar navigation, site management, and all necessary features for visitor intelligence tracking.

## Features Implemented

### 🎨 **Layout & Navigation**

#### **Sidebar Component** (`components/Sidebar.tsx`)
- Collapsible sidebar with smooth transitions
- Icon-based navigation with descriptions
- Active state indicators
- Context-aware navigation (some pages require site selection)
- Beautiful gradient backgrounds
- Logout functionality

#### **DashboardLayout Component** (`components/DashboardLayout.tsx`)
- Wrapper layout that includes sidebar
- Used across all dashboard pages for consistency
- Responsive design

### 📄 **Pages**

#### **1. Dashboard** (`/dashboard`)
- **Main Features:**
  - Stats overview cards (Total Sites, Active Visitors, Pageviews, Accounts)
  - Quick action cards (Add New Website, Start Crawling)
  - Recent sites grid with status badges
  - Quick navigation to all features
  
- **Key Components:**
  - Uses `DashboardLayout`
  - Responsive grid layouts
  - Animated cards with hover effects
  - Integration with `AddSiteModal`

#### **2. Websites** (`/dashboard/sites`)
- **Main Features:**
  - List all registered websites
  - Search functionality
  - Filter by status (All, Active, Inactive)
  - Site cards with quick actions
  - Add new website functionality
  
- **Key Components:**
  - Search bar with real-time filtering
  - Status toggle filters
  - Site detail cards
  - `AddSiteModal` integration

#### **3. Crawling** (`/dashboard/crawling`)
- **Main Features:**
  - Select website to crawl
  - View all crawl jobs for selected site
  - Start new crawl jobs
  - Real-time job monitoring
  - Search sites
  
- **Key Components:**
  - Site selector sidebar  
  - `CrawlJobList` component
  - `AddWebsiteModal` for crawl configuration
  - Real-time updates (5s polling)

#### **4. Settings** (`/dashboard/settings`)
- **Main Features:**
  - Account settings
  - Notification preferences
  - Security options
  - Appearance customization
  - API & Integration settings
  - Danger zone (Export/Delete)
  
- **Key Components:**
  - Settings cards grid
  - Configuration sections
  - Action buttons

#### **5. Site Detail** (`/dashboard/[siteId]`)
- **Main Features:**
  - Tab-based navigation (Live Map, Intent Stream, Analytics, Accounts, Alerts)
  - Smooth tab transitions
  - Site-specific data
  
- **Key Components:**
  - Premium tab navigation
  - Component switching based on active tab
  - Fade-in animations

### 🔧 **Components**

#### **Sidebar** (`components/Sidebar.tsx`)
```tsx
Features:
- Collapsible (20px → 256px)
- Icon + text navigation
- Active link highlighting
- Requires site context for some links
- Logout button
- Smooth animations
```

#### **AddSiteModal** (`components/AddSiteModal.tsx`)
```tsx
Features:
- Two-step process (Create → Show API Key)
- Form validation
- GraphQL mutation integration
- API key display with copy button
- Success state with next steps
- Premium design
```

#### **AddWebsiteModal** (`components/AddWebsiteModal.tsx`)
```tsx
Features:
- Configure crawl parameters
- URL validation
- Max pages (1-500)
- Max depth (1-10)
- Same domain toggle
- Start crawl mutation
- Feature info box
```

#### **CrawlJobList** (`components/CrawlJobList.tsx`)
```tsx
Features:
- Real-time updates (5s polling)
- Status indicators (Pending, In Progress, Completed, Failed)
- Progress bars for active jobs
-Stats display (discovered, crawled, failed)
- Timestamps
- Error messages
- Premium card design
```

## Navigation Structure

```
/
├── / (Home Page - Premium landing)
└── /dashboard
    ├── /dashboard (Main Dashboard)
    ├── /dashboard/sites (Websites Management)
    ├── /dashboard/crawling (Website Crawling)
    ├── /dashboard/settings (Settings)
    └── /dashboard/[siteId]
        ├── /dashboard/[siteId]/live (Live Tracking - via sidebar/tabs)
        ├── /dashboard/[siteId]/accounts (Accounts - via sidebar/tabs)
        ├── /dashboard/[siteId]/analytics (Analytics - via sidebar/tabs)
        └── /dashboard/[siteId]/intent (Intent Engine - via sidebar/tabs)
```

## GraphQL Queries & Mutations Used

### Queries
```graphql
# Get all sites
query GetSites {
  getSites {
    id
    siteId
    name
    domain
    isActive
    apiKey
  }
}

# Get crawl jobs
query GetSiteCrawlJobs($siteId: String!) {
  getSiteCrawlJobs(siteId: $siteId) {
    jobId
    status
    pagesCrawled
    pagesDiscovered
    pagesFailed
    startedAt
    completedAt
    error
  }
}
```

### Mutations
```graphql
# Create new site
mutation CreateSite($input: CreateSiteInput!) {
  createSite(input: $input) {
    id
    siteId
    name
    domain
    apiKey
    isActive
  }
}

# Start website crawl
mutation StartWebsiteCrawl($input: StartCrawlInput!) {
  startWebsiteCrawl(input: $input) {
    jobId
    status
    pagesCrawled
    pagesDiscovered
  }
}
```

## Styling & Design

### Color Palette
- **Primary:** Purple gradient (`from-purple-600 to-pink-600`)
- **Background:** Dark gradient (`from-slate-900 via-purple-900 to-slate-900`)
- **Accent:** Various gradient combinations for different sections
- **Status Colors:**
  - Green: Active/Success
  - Yellow: Pending/Warning
  - Blue: In Progress
  - Red: Failed/Error

### Design Principles
1. **Dark Theme First:** Premium dark theme throughout
2. **Glassmorphism:** `backdrop-blur` with transparency
3. **Gradients:** Smooth color transitions
4. **Animations:** Hover effects, transitions, fade-ins
5. **Responsive:** Mobile-first, works on all screen sizes
6. **Consistency:** Same design language across all pages

## Authentication Flow

```
User lands on Home Page (/)
  ├─ Not Authenticated
  │   └─ Show login/signup forms
  │       ├─ Login → Store JWT → Redirect to /dashboard
  │       └─ Signup → Store JWT → Redirect to /dashboard
  │
  └─ Authenticated
      └─ Can access all /dashboard/* pages
          ├─ Auth check on each page
          ├─ Redirect to / if not authenticated
          └─ Sidebar available on all pages
```

## State Management

### Zustand Store (`lib/auth-store.ts`)
```tsx
- isAuthenticated()
- user (name, email)
- token (JWT)
- login(token, user)
- logout()
```

### Apollo Client
- GraphQL queries and mutations
- Cache management
- Error handling
- Polling for real-time updates

## Responsive Breakpoints

```css
- Mobile: < 640px
- Tablet: 640px - 1024px
- Desktop: > 1024px

Grid Columns:
- Stats: 1 → 2 → 4 columns
- Sites: 1 → 2 → 3 columns
- Layout: 1 column → sidebar + content
```

## Icons (Lucide React)

```tsx
- LayoutDashboard - Dashboard
- Globe - Websites
- Activity - Live Tracking
- Users - Accounts
- TrendingUp - Analytics
- Sparkles - Intent Engine
- Zap - Crawling
- Settings - Settings
- Plus - Add actions
- Search - Search
- Filter - Filters
- ArrowRight - Navigation
- LogOut - Logout
```

## Running the Application

```bash
# Install dependencies
npm install

# Run  development server
npm run dev

# Build for production
npm run build

# Start production server
npm start
```

## Environment Variables

```env
# Backend GraphQL Endpoint
NEXT_PUBLIC_GRAPHQL_URI=http://localhost:3001/graphql
```

## Browser Support

- Chrome/Edge: Latest 2 versions
- Firefox: Latest 2 versions
- Safari: Latest 2 versions
- Mobile browsers: iOS Safari, Chrome Android

## Performance

- **Code Splitting:** automatic with Next.js
- **Image Optimization:** Next/Image component
- **CSS:** Tailwind JIT compilation
- **Bundle Size:** Optimized with tree shaking

## Accessibility

- Semantic HTML elements
- ARIA labels where needed
- Keyboard navigation support
- Focus states on interactive elements
- Color contrast ratios meet WCAG AA

## Future Enhancements

- [ ] Dark/Light theme toggle
- [ ] More customization options in Settings
- [ ] Drag-and-drop site ordering
- [ ] Bulk actions for sites
- [ ] Export data functionality
- [ ] Keyboard shortcuts
- [ ] Notification center
- [ ] Real-time WebSocket updates (replace polling)

## Folder Structure

```
frontend/
├── app/
│   ├── page.tsx (Home)
│   └── dashboard/
│       ├── page.tsx (Main Dashboard)
│       ├── sites/
│       │   └── page.tsx (Websites)
│       ├── crawling/
│       │   └── page.tsx (Crawling)
│       ├── settings/
│       │   └── page.tsx (Settings)
│       └── [siteId]/
│           └── page.tsx (Site Detail)
├── components/
│   ├── Sidebar.tsx
│   ├── DashboardLayout.tsx
│   ├── AddSiteModal.tsx
│   ├── AddWebsiteModal.tsx
│   ├── CrawlJobList.tsx
│   ├── LiveVisitorMap.tsx
│   ├── AccountIntelligence.tsx
│   ├── BehaviorAnalytics.tsx
│   ├── AlertsDashboard.tsx
│   └── IntentStream.tsx
└── lib/
    ├── apollo-client.ts
    └── auth-store.ts
```

## 🎉 Complete!

The frontend application is now fully set up with:
- ✅ Sidebar navigation
- ✅ All dashboard pages
- ✅ Site management with Add Site modal
- ✅ Website crawling interface
- ✅ Settings page
- ✅ Premium dark theme design
- ✅ Real-time updates
- ✅ Responsive layouts
- ✅ Complete feature set

Navigate through the app using the sidebar and enjoy the premium user experience!
