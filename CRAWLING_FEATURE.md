# Website Crawling & RAG Integration

## Overview

This feature allows users to add websites and automatically crawl them using AI-powered background jobs. All HTML content is indexed in Qdrant for Retrieval-Augmented Generation (RAG) capabilities.

## Architecture

### Backend Components

1. **CrawlerService** (`backend/src/crawler/crawler.service.ts`)
   - Manages crawl job lifecycle
   - Integrates with BullMQ for background processing
   - Tracks crawl status in MongoDB

2. **WebsiteCrawlerProcessor** (`backend/src/crawler/processors/website-crawler.processor.ts`)
   - Processes crawl jobs asynchronously
   - Discovers pages recursively
   - Extracts content using Playwright
   - Generates embeddings with Gemini AI
   - Stores vectors in Qdrant

3. **MongoDB Schemas**
   - `CrawlJob`: Tracks job status, progress, and configuration
   - Indexes for efficient querying by site and status

4. **GraphQL API**
   - `startWebsiteCrawl`: Start a new crawl job
   - `getCrawlJobStatus`: Get status of a specific job
   - `getSiteCrawlJobs`: List all jobs for a site
   - `getActiveCrawlJobs`: Get active/pending jobs
   - `cancelCrawlJob`: Cancel a running job
   - `retryCrawlJob`: Retry a failed job

### Frontend Components

1. **AddWebsiteModal** (`frontend/components/AddWebsiteModal.tsx`)
   - Premium modal for initiating crawls
   - Configurable parameters: max pages, max depth, domain filtering
   - Real-time validation

2. **CrawlJobList** (`frontend/components/CrawlJobList.tsx`)
   - Displays crawl jobs with status
   - Real-time progress tracking (5s polling)
   - Visual indicators for job states

3. **Enhanced Dashboard** (`frontend/app/dashboard/page.tsx`)
   - Integrated website and crawl management
   - Dark theme with premium design
   - Stats overview

4. **Premium Home Page** (`frontend/app/page.tsx`)
   - Showcases all platform features
   - Animated background with glassmorphism
   - Feature highlights

## Features

### AI-Powered Crawling
- **Playwright Integration**: Headless browser for JavaScript-rendered content
- **Recursive Discovery**: Automatically finds linked pages
- **Content Extraction**: Extracts meaningful sections (main, article, section tags)
- **AI Descriptions**: Gemini generates semantic descriptions
- **Vector Embeddings**: 768-dimensional embeddings for semantic search

### Background Processing
- **BullMQ**: Non-blocking job queue
- **Redis**: Queue persistence and job state
- **Retry Logic**: Exponential backoff for failures
- **Progress Tracking**: Real-time updates via polling

### Configuration Options
- **Max Pages**: 1-500 pages per crawl
- **Max Depth**: 1-10 levels of recursion
- **Same Domain Only**: Optional domain restriction
- **Concurrent Processing**: Multiple jobs can run simultaneously

### RAG Integration
- **Qdrant Storage**: Vector database for semantic search
- **Metadata**: Stores URL, selector, HTML, description, siteId
- **Semantic Search**: Query by natural language
- **Context Retrieval**: Get relevant page sections for AI responses

## Usage

### Starting a Crawl (GraphQL)

```graphql
mutation StartCrawl {
  startWebsiteCrawl(input: {
    siteId: "site_123"
    startUrl: "https://example.com"
    maxPages: 50
    maxDepth: 3
    sameDomainOnly: true
  }) {
    jobId
    status
    pagesDiscovered
    pagesCrawled
  }
}
```

### Checking Status

```graphql
query GetJobStatus {
  getCrawlJobStatus(jobId: "crawl_abc123") {
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

### Frontend Usage

1. Navigate to Dashboard
2. Select a website
3. Click the "+" button
4. Enter website URL and configuration
5. Click "Start Crawling"
6. Monitor progress in real-time

## Data Flow

```
User Input (URL) 
  → GraphQL Mutation (startWebsiteCrawl)
  → CrawlerService creates MongoDB record
  → BullMQ queues background job
  → WebsiteCrawlerProcessor processes job
  → Playwright crawls pages
  → Gemini generates embeddings
  → Qdrant stores vectors
  → MongoDB updates progress
  → Frontend polls for updates
```

## Database Schema

### CrawlJob Collection

```typescript
{
  jobId: string           // Unique identifier
  siteId: string          // Reference to site
  startUrl: string        // Starting URL
  status: enum            // PENDING | IN_PROGRESS | COMPLETED | FAILED
  pagesDiscovered: number // Total pages found
  pagesCrawled: number    // Successfully crawled
  pagesFailed: number     // Failed pages
  urlsQueued: string[]    // Pending URLs
  urlsCrawled: string[]   // Completed URLs
  maxPages: number        // Configuration
  maxDepth: number        // Configuration
  sameDomainOnly: boolean // Configuration
  startedAt: Date         // Timestamp
  completedAt: Date       // Timestamp
  error: string           // Error message (if failed)
}
```

### Qdrant Payload

```typescript
{
  url: string           // Page URL
  pageTitle: string     // Page title
  selector: string      // HTML selector
  raw_html: string      // HTML content (truncated)
  description: string   // AI-generated description
  siteId: string        // Reference
  crawlJobId: string    // Reference
  crawledAt: string     // ISO timestamp
}
```

## Performance Considerations

- **Rate Limiting**: 1-second delay between pages
- **Timeout**: 30-second page load timeout
- **Memory**: HTML truncated to 5000 characters
- **Concurrency**: Jobs run in parallel (Redis queue)
- **Retries**: 3 attempts with exponential backoff

## Future Enhancements

1. **Sitemap Support**: Auto-discover from sitemap.xml
2. **Content Filtering**: Skip navigation, ads, etc.
3. **Image Processing**: Extract and index images
4. **PDF Support**: Crawl and index PDF documents
5. **Incremental Crawls**: Update only changed pages
6. **Webhooks**: Notify on completion
7. **Scheduled Crawls**: Recurring jobs
8. **Custom Selectors**: User-defined content extraction

## Troubleshooting

### Job Stuck in PENDING
- Check Redis connection
- Verify BullMQ worker is running
- Check server logs for errors

### Pages Not Being Crawled
- Verify URL is accessible
- Check for robots.txt blocking
- Verify JavaScript is not preventing access

### Qdrant Errors
- Check Qdrant connection (default: http://localhost:6333)
- Verify collection exists
- Check embedding dimensions (768)

## Environment Variables

```env
# Qdrant Configuration
QDRANT_URL=http://localhost:6333
QDRANT_API_KEY=your_api_key

# Redis Configuration
REDIS_HOST=localhost
REDIS_PORT=6379

# Gemini API
GEMINI_API_KEY=your_gemini_key
```

## Code Quality

This implementation follows clean code principles:

- **Separation of Concerns**: Service, processor, and resolver layers
- **Error Handling**: Comprehensive try-catch blocks
- **Logging**: Detailed logs for debugging
- **Type Safety**: Full TypeScript typing
- **Validation**: Input validation with class-validator
- **Maintainability**: Well-documented and modular code
