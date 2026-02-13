# Architecture Diagram - Visitor Intelligence Platform

```
┌──────────────────────────────────────────────────────────────────────────────┐
│                          FRONTEND (Next.js + React)                           │
│                          http://localhost:4000                                │
├──────────────────────────────────────────────────────────────────────────────┤
│                                                                                │
│  ┌─────────────────────┐  ┌──────────────────────┐  ┌────────────────────┐  │
│  │   Home Page         │  │   Dashboard          │  │  Site Detail       │  │
│  ├─────────────────────┤  ├──────────────────────┤  ├────────────────────┤  │
│  │ - Feature Showcase  │  │ - Website List       │  │ - Analytics        │  │
│  │ - Login/Signup      │  │ - Crawl Jobs Panel   │  │ - Intent Tracking  │  │
│  │ - Animated Gradients│  │ - Stats Overview     │  │ - Visitor Data     │  │
│  └─────────────────────┘  └──────────────────────┘  └────────────────────┘  │
│                                                                                │
│  ┌─────────────────────┐  ┌──────────────────────┐                           │
│  │ AddWebsiteModal     │  │  CrawlJobList        │                           │
│  ├─────────────────────┤  ├──────────────────────┤                           │
│  │ - URL Input         │  │ - Real-time Polling  │                           │
│  │ - Config Options    │  │ - Progress Bars      │                           │
│  │ - Start Crawl       │  │ - Status Indicators  │                           │
│  └─────────────────────┘  └──────────────────────┘                           │
│                                                                                │
└────────────────────────┬───────────────────────────────────────────────────────┘
                         │
                         │ Apollo Client (GraphQL over HTTP)
                         │
                         ▼
┌──────────────────────────────────────────────────────────────────────────────┐
│                    BACKEND (NestJS + GraphQL + REST)                          │
│                        http://localhost:3001                                  │
├──────────────────────────────────────────────────────────────────────────────┤
│                                                                                │
│  ┌────────────────────────────────────────────────────────────────────────┐  │
│  │                          GraphQL Layer                                  │  │
│  ├────────────────────────────────────────────────────────────────────────┤  │
│  │  AuthResolver│ SitesResolver │ CrawlerResolver │ IntentResolver        │  │
│  │  TrackingResolver │ AnalyticsResolver │ WebhooksResolver              │  │
│  └────────────────────────────────────────────────────────────────────────┘  │
│                                    │                                           │
│                                    ▼                                           │
│  ┌────────────────────────────────────────────────────────────────────────┐  │
│  │                         Service Layer                                   │  │
│  ├────────────────────────────────────────────────────────────────────────┤  │
│  │  ┌──────────────┐  ┌──────────────┐  ┌───────────────────────────┐    │  │
│  │  │AuthService   │  │SitesService  │  │  CrawlerService           │    │  │
│  │  ├──────────────┤  ├──────────────┤  ├───────────────────────────┤    │  │
│  │  │- JWT Auth    │  │- CRUD Sites  │  │- startCrawl()             │    │  │
│  │  │- User Mgmt   │  │- API Keys    │  │- getCrawlStatus()         │    │  │
│  │  └──────────────┘  └──────────────┘  │- cancelCrawl()            │    │  │
│  │                                       │- retryCrawl()             │    │  │
│  │  ┌──────────────┐  ┌──────────────┐  │- getQueueStats()          │    │  │
│  │  │TrackingServ  │  │IntentService │  └───────────────────────────┘    │  │
│  │  ├──────────────┤  ├──────────────┤  ┌───────────────────────────┐    │  │
│  │  │- Events      │  │- AI Analysis │  │  QdrantService            │    │  │
│  │  │- Sessions    │  │- Predictions │  ├───────────────────────────┤    │  │
│  │  └──────────────┘  └──────────────┘  │- upsertPoint()            │    │  │
│  │                                       │- search()                 │    │  │
│  │  ┌──────────────┐  ┌──────────────┐  │- ensureCollection()       │    │  │
│  │  │AnalyticsSrv  │  │GeminiService │  └───────────────────────────┘    │  │
│  │  ├──────────────┤  ├──────────────┤                                     │  │
│  │  │- Reports     │  │- Embeddings  │                                     │  │
│  │  │- Exports     │  │- Descriptions│                                     │  │
│  │  └──────────────┘  └──────────────┘                                     │  │
│  └────────────────────────────────────────────────────────────────────────┘  │
│                                    │                                           │
│                                    ▼                                           │
│  ┌────────────────────────────────────────────────────────────────────────┐  │
│  │                        BullMQ Job Queue                                 │  │
│  ├────────────────────────────────────────────────────────────────────────┤  │
│  │  Queue: 'website-crawler'                                              │  │
│  │  ┌─────────────────────────────────────────────────────────────┐      │  │
│  │  │  WebsiteCrawlerProcessor                                     │      │  │
│  │  ├─────────────────────────────────────────────────────────────┤      │  │
│  │  │  @Process('crawl-website')                                  │      │  │
│  │  │  async handleCrawl(job: Job) {                              │      │  │
│  │  │    1. Launch Playwright browser                             │      │  │
│  │  │    2. Navigate to start URL                                 │      │  │
│  │  │    3. Discover links recursively                            │      │  │
│  │  │    4. Extract content sections                              │      │  │
│  │  │    5. Generate AI descriptions (Gemini)                     │      │  │
│  │  │    6. Create embeddings (Gemini)                            │      │  │
│  │  │    7. Store in Qdrant                                       │      │  │
│  │  │    8. Update MongoDB progress                               │      │  │
│  │  │    9. Repeat for next URL                                   │      │  │
│  │  │  }                                                           │      │  │
│  │  └─────────────────────────────────────────────────────────────┘      │  │
│  └────────────────────────────────────────────────────────────────────────┘  │
│                                                                                │
└┬──────────────┬──────────────┬──────────────┬──────────────┬────────────────┘
 │              │              │              │              │
 ▼              ▼              ▼              ▼              ▼
┌─────────┐ ┌────────┐ ┌──────────┐ ┌─────────────┐ ┌────────────────┐
│MongoDB  │ │ Redis  │ │ Qdrant   │ │ Gemini AI   │ │  Playwright    │
├─────────┤ ├────────┤ ├──────────┤ ├─────────────┤ ├────────────────┤
│         │ │        │ │          │ │             │ │                │
│ Sites   │ │ Queue  │ │ Vectors  │ │ Embeddings  │ │ Browser        │
│ Users   │ │ Jobs   │ │ Metadata │ │ Descriptions│ │ Content        │
│CrawlJobs│ │ State  │ │ Search   │ │ Generation  │ │ Extraction     │
│Accounts │ │        │ │          │ │             │ │                │
│Sessions │ │        │ │          │ │             │ │                │
│Events   │ │        │ │          │ │             │ │                │
│         │ │        │ │          │ │             │ │                │
└─────────┘ └────────┘ └──────────┘ └─────────────┘ └────────────────┘
    :27017      :6379     :6333      API Key           Headless
```

## Data Flow: Website Crawling

```
┌─────────────┐
│   User      │
│ Dashboard   │
└──────┬──────┘
       │ 1. Click "+" to add website
       │
       ▼
┌────────────────────┐
│ AddWebsiteModal    │
│ - Enter URL        │
│ - Configure params │
└──────┬─────────────┘
       │ 2. Submit form
       │
       ▼
┌──────────────────────────────┐
│ GraphQL Mutation             │
│ startWebsiteCrawl(input)     │
└──────┬───────────────────────┘
       │ 3. Send to backend
       │
       ▼
┌──────────────────────────────┐
│ CrawlerResolver              │
│ @Mutation startWebsiteCrawl  │
└──────┬───────────────────────┘
       │ 4. Call service
       │
       ▼
┌──────────────────────────────┐
│ CrawlerService               │
│ .startCrawl(input)           │
├──────────────────────────────┤
│ 5a. Create MongoDB record    │
│ 5b. Add to BullMQ queue      │
└──────┬──────────┬────────────┘
       │          │
       │          │ 6. Job queued (non-blocking)
       │          │
       │          ▼
       │    ┌─────────────────────────┐
       │    │ Redis Queue             │
       │    │ - Job stored            │
       │    │ - Waiting for worker    │
       │    └──────┬──────────────────┘
       │           │
       │           │ 7. Worker picks up job
       │           │
       │           ▼
       │    ┌─────────────────────────┐
       │    │ WebsiteCrawlerProcessor │
       │    │ @Process('crawl-website')│
       │    ├─────────────────────────┤
       │    │ 8. Launch Playwright    │
       │    │ 9. Navigate to URL      │
       │    │ 10. Extract content     │
       │    │     │                   │
       │    │     ├─► 11. Gemini AI   │
       │    │     │    (Description)  │
       │    │     │                   │
       │    │     ├─► 12. Gemini AI   │
       │    │     │    (Embedding)    │
       │    │     │                   │
       │    │     └─► 13. Qdrant      │
       │    │          (Store Vector) │
       │    │                         │
       │    │ 14. Update MongoDB job  │
       │    │     (progress++)        │
       │    │                         │
       │    │ 15. Discover links      │
       │    │ 16. Repeat 8-14         │
       │    │                         │
       │    │ 17. Mark complete       │
       │    └─────────┬───────────────┘
       │              │
       │              │ 18. Job done
       │              │
       ▼              ▼
┌─────────────────────────────────┐
│ MongoDB CrawlJob Updated        │
│ - status: COMPLETED             │
│ - pagesCrawled: 47              │
│ - completedAt: now()            │
└─────────────────────────────────┘
       │
       │ 19. Frontend polls (every 5s)
       │
       ▼
┌─────────────────────────────────┐
│ CrawlJobList Component          │
│ - Query: getSiteCrawlJobs       │
│ - Display status & progress     │
│ - Show completion               │
└─────────────────────────────────┘
       │
       ▼
┌─────────────────────────────────┐
│ User sees: ✅ Completed          │
│ - 47 pages crawled              │
│ - Ready for RAG queries!        │
└─────────────────────────────────┘
```

## Component Hierarchy

```
App (/)
├── Home Page (/)
│   ├── Hero Section
│   │   ├── Feature Grid (6 features)
│   │   └── Stats (10K+, 95%, Real-time)
│   ├── Auth Forms
│   │   ├── LoginForm
│   │   └── SignupForm
│   └── Features Showcase (3 cards)
│
└── Dashboard (/dashboard)
    ├── Navigation Bar
    ├── Stats Grid (4 stats)
    │   ├── Total Sites
    │   ├── Active Crawls
    │   ├── Pages Indexed
    │   └── Visitors Today
    │
    ├── Sites Panel (Left - 1/3)
    │   ├── Website List
    │   │   └── Site Card (clickable)
    │   └── "+" Add Button → Opens Modal
    │
    ├── Crawl Jobs Panel (Right - 2/3)
    │   └── CrawlJobList Component
    │       ├── Job Card (for each job)
    │       │   ├── Status Badge
    │       │   ├── Progress Stats
    │       │   ├── Progress Bar
    │       │   └── Timestamps
    │       └── Empty State
    │
    └── AddWebsiteModal (Overlay)
        ├── URL Input
        ├── Config Controls
        │   ├── Max Pages Slider
        │   ├── Max Depth Input
        │   └── Same Domain Toggle
        ├── Info Box (RAG features)
        └── Actions (Cancel / Start)

Site Detail (/dashboard/[siteId])
├── Account Intelligence
├── Live Visitor Map
├── Intent Tracking
└── Analytics
```

## Technology Stack

```
┌─────────────────────────────────────────────────────────┐
│                    Technology Stack                      │
├─────────────────────────────────────────────────────────┤
│                                                         │
│  Frontend                                               │
│  ├─ Next.js 14 (React Framework)                       │
│  ├─ TypeScript (Type Safety)                           │
│  ├─ Apollo Client (GraphQL Client)                     │
│  ├─ Tailwind CSS (Styling)                             │
│  ├─ Framer Motion (Animations)                         │
│  ├─ Lucide React (Icons)                               │
│  └─ Zustand (State Management)                         │
│                                                         │
│  Backend                                                │
│  ├─ NestJS (Node.js Framework)                         │
│  ├─ TypeScript (Type Safety)                           │
│  ├─ GraphQL + Apollo Server (API Layer)                │
│  ├─ Mongoose (MongoDB ODM)                             │
│  ├─ BullMQ + Redis (Job Queue)                         │
│  ├─ Passport + JWT (Authentication)                    │
│  └─ Class Validator (Input Validation)                 │
│                                                         │
│  AI & ML                                                │
│  ├─ Google Gemini AI (Embeddings & Descriptions)       │
│  ├─ Qdrant (Vector Database)                           │
│  └─ Playwright (Web Scraping)                          │
│                                                         │
│  Databases                                              │
│  ├─ MongoDB (Primary Database)                         │
│  ├─ Redis (Job Queue Persistence)                      │
│  └─ Qdrant (Vector Store for RAG)                      │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

This architecture provides:
- ✅ Scalability (BullMQ for background jobs)
- ✅ Real-time updates (GraphQL subscriptions + polling)
- ✅ AI-powered insights (Gemini + Qdrant RAG)
- ✅ Clean separation of concerns
- ✅ Type safety throughout the stack
- ✅ Premium user experience
