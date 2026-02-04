# 🚀 Quick Start Guide - Website Crawling Feature

## Prerequisites

Ensure these services are running:

### 1. MongoDB
```bash
# Start MongoDB
mongod

# Or with Docker
docker run -d -p 27017:27017 --name mongodb mongo:latest
```

### 2. Redis
```bash
# Start Redis
redis-server

# Or with Docker
docker run -d -p 6379:6379 --name redis redis:latest
```

### 3. Qdrant
```bash
# Start Qdrant with Docker
docker run -d -p 6333:6333 --name qdrant qdrant/qdrant:latest

# Verify it's running
curl http://localhost:6333/healthz
```

## Environment Variables

Update `.env` in the backend directory:

```env
# MongoDB
MONGODB_URI=mongodb://localhost:27017/visitor-intelligence

# Redis
REDIS_HOST=localhost
REDIS_PORT=6379

# Qdrant
QDRANT_URL=http://localhost:6333
QDRANT_API_KEY=

# Gemini AI
GEMINI_API_KEY=your_gemini_api_key_here

# GraphQL
GRAPHQL_ENDPOINT=http://localhost:3001/graphql
```

## Installation & Start

### Backend

```bash
cd backend

# Install dependencies (if needed)
npm install

# Start development server
npm run start:dev

# Backend will start on http://localhost:3001
```

### Frontend

```bash
cd frontend

# Install dependencies (if needed)
npm install

# Start development server
npm run dev

# Frontend will start on http://localhost:4000
```

## 🎯 Using the Feature

### Step 1: Access the Dashboard

1. Open http://localhost:4000
2. Sign up or login
3. You'll be redirected to the dashboard

### Step 2: Create a Site (First Time Only)

If you don't have sites yet, create one via GraphQL:

```bash
# Open GraphQL Playground: http://localhost:3001/graphql

# Run this mutation (replace YOUR_TOKEN with your JWT)
mutation CreateSite {
  createSite(input: {
    name: "My Website"
    domain: "example.com"
  }) {
    siteId
    name
    domain
    apiKey
  }
}
```

### Step 3: Start Crawling

1. **Select a Website**: Click on a site card in the dashboard
2. **Click the "+" Button**: Opens the crawl configuration modal
3. **Enter URL**: e.g., `https://example.com`
4. **Configure Settings** (optional):
   - Max Pages: 1-500 (default: 50)
   - Max Depth: 1-10 (default: 3)
   - Same Domain Only: Toggle on/off (default: on)
5. **Click "Start Crawling"**: Job starts immediately
6. **Monitor Progress**: Watch real-time updates every 5 seconds

### Step 4: View Results

- **Dashboard**: See crawl status in the right panel
- **Progress Bar**: Track pages crawled vs discovered
- **Statistics**: View pages crawled, discovered, and failed
- **Qdrant**: All content is now indexed and ready for RAG!

## 🧪 Testing the RAG Integration

Once crawling is complete, test the Qdrant integration:

```bash
# Open GraphQL Playground
# Run a semantic search (example query)

query SearchContent {
  # You'll need to implement this query in IntentService
  # The crawled content is now available in Qdrant
}
```

## 📊 Monitoring

### Check Job Status

```graphql
query GetCrawlStatus {
  getCrawlJobStatus(jobId: "crawl_123...") {
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

### List All Jobs for a Site

```graphql
query GetSiteJobs {
  getSiteCrawlJobs(siteId: "site_123...") {
    jobId
    status
    pagesCrawled
    pagesDiscovered
  }
}
```

### Get Active Jobs

```graphql
query GetActiveJobs {
  getActiveCrawlJobs(siteId: "site_123...") {
    jobId
    status
    pagesCrawled
  }
}
```

## 🐛 Troubleshooting

### Jobs Stuck in PENDING

**Problem**: Jobs don't start processing

**Solutions**:
1. Check Redis is running: `redis-cli ping` should return `PONG`
2. Restart backend: `npm run start:dev`
3. Check backend logs for errors

### Qdrant Connection Error

**Problem**: "Cannot connect to Qdrant"

**Solutions**:
1. Verify Qdrant is running: `curl http://localhost:6333/healthz`
2. Check QDRANT_URL in `.env`
3. Restart Qdrant container

### MongoDB Connection Error

**Problem**: "MongoDB connection failed"

**Solutions**:
1. Check MongoDB is running: `mongosh`
2. Verify MONGODB_URI in `.env`
3. Check MongoDB logs

### Pages Not Crawling

**Problem**: Job starts but no pages are crawled

**Solutions**:
1. Check the URL is accessible
2. Verify robots.txt doesn't block crawling
3. Check backend logs for errors
4. Try with `sameDomainOnly: false`

## 🎨 Customization

### Change Crawl Defaults

Edit `backend/src/crawler/dto/start-crawl.input.ts`:

```typescript
@Field(() => Int, { nullable: true, defaultValue: 100 }) // Change from 50
maxPages?: number;

@Field(() => Int, { nullable: true, defaultValue: 5 }) // Change from 3
maxDepth?: number;
```

### Change Polling Interval

Edit `frontend/components/CrawlJobList.tsx`:

```typescript
const { data, loading, error, refetch } = useQuery(GET_SITE_CRAWL_JOBS, {
  variables: { siteId },
  pollInterval: 3000, // Change from 5000 (3 seconds)
});
```

### Change Theme Colors

Edit `frontend/app/page.tsx` or `frontend/app/dashboard/page.tsx`:

```typescript
// Change gradient colors
className="bg-gradient-to-br from-blue-900 via-indigo-900 to-blue-900"

// Change accent colors
className="bg-gradient-to-r from-blue-600 to-cyan-600"
```

## 📖 GraphQL API Reference

### Mutations

```graphql
# Start a new crawl
mutation StartCrawl($input: StartCrawlInput!) {
  startWebsiteCrawl(input: $input) {
    jobId
    siteId
    status
    pagesDiscovered
    pagesCrawled
  }
}

# Cancel a crawl
mutation CancelCrawl($jobId: String!) {
  cancelCrawlJob(jobId: $jobId)
}

# Retry a failed crawl
mutation RetryCrawl($jobId: String!) {
  retryCrawlJob(jobId: $jobId) {
    jobId
    status
  }
}
```

### Queries

```graphql
# Get specific job status
query GetJobStatus($jobId: String!) {
  getCrawlJobStatus(jobId: $jobId) {
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

# Get all jobs for a site
query GetSiteJobs($siteId: String!) {
  getSiteCrawlJobs(siteId: $siteId) {
    jobId
    status
    pagesCrawled
  }
}

# Get only active jobs
query GetActiveJobs($siteId: String!) {
  getActiveCrawlJobs(siteId: $siteId) {
    jobId
    status
    pagesCrawled
  }
}
```

## 🎉 Success!

If you've followed all steps, you should now have:

- ✅ A running backend with crawling capabilities
- ✅ A beautiful frontend dashboard
- ✅ Real-time crawl job monitoring
- ✅ Content indexed in Qdrant for RAG
- ✅ Background job processing with BullMQ

Enjoy your AI-powered visitor intelligence platform! 🚀
