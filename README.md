# Visitor Intelligence Platform

A B2B SaaS platform that provides account-level visitor intelligence for client websites. Track anonymous visitors, visualize geographical distribution, analyze behavioral patterns, and predict buyer intent - all while maintaining privacy compliance (GDPR, DPDP, CCPA).

## 🎯 Features

### Core Features
- **Anonymous Visitor Tracking**: Session-based tracking without individual identity
- **Live World Map**: Real-time visualization of visitor locations with live counter
- **Behavioral Analytics**: Page flows, engagement trends, and user journeys
- **Intent Scoring**: Rule-based engine to predict buyer intent (0-100 score)
- **Account Intelligence**: Company-level aggregation and insights
- **Privacy-First**: IP hashing, no cookies, no fingerprinting, GDPR-compliant
- **Real-time Updates**: GraphQL subscriptions for live data

### Advanced Features
- **Account Detail Pages**: Complete timeline view with session history
- **Webhook Integration**: Simple webhook system for high-intent alerts
- **CSV Export**: Export account data for analysis
- **Search & Filters**: Search accounts by name/domain, filter by category
- **Health Checks**: Monitoring endpoints for system status
- **Real-time Visitor Counter**: Live visitor count on dashboard

## 🏗️ Architecture

### Backend (NestJS + GraphQL + MongoDB)
- **Tracking Module**: Ingests events from client websites
- **Enrichment Module**: Resolves IP to geo-location and organization
- **Intent Module**: Calculates engagement and intent scores
- **Analytics Module**: Aggregates and analyzes visitor data
- **Accounts Module**: Manages company-level intelligence

### Frontend (Next.js + TypeScript + Tailwind)
- **Live Visitor Map**: Interactive world map with real-time dots
- **Behavior Analytics**: Charts and visualizations
- **Account Intelligence**: Table view of high-intent accounts
- **Alerts Dashboard**: Notifications for high-intent accounts

### Client SDK
- Lightweight JavaScript tracking script
- Privacy-compliant (no cookies, no fingerprinting)
- Session-based tracking only

## 🚀 Getting Started

### Prerequisites

- Node.js 18+
- MongoDB 6+
- Redis (for BullMQ queues)

### Backend Setup

```bash
cd backend
npm install

# Create .env file (see backend/.env.example)
cp .env.example .env

# Update .env with your configuration
# MONGODB_URI=mongodb://localhost:27017/visitor-intelligence
# JWT_SECRET=your-secret-key
# REDIS_HOST=localhost
# REDIS_PORT=6379

# Start backend
npm run start:dev
```

Backend will run on `http://localhost:3001`

### Frontend Setup

```bash
cd frontend
npm install

# Create .env.local (optional, defaults work for local dev)
# NEXT_PUBLIC_GRAPHQL_URL=http://localhost:3001/graphql
# NEXT_PUBLIC_GRAPHQL_WS_URL=ws://localhost:3001/graphql

# Start frontend
npm run dev
```

Frontend will run on `http://localhost:4000`

### Client SDK

Include the tracking script on your client website:

```html
<script src="https://cdn.myapp.com/tracker.js" data-site-id="YOUR_SITE_ID"></script>
```

Or use the local file:

```html
<script src="/path/to/sdk/tracker.js" data-site-id="YOUR_SITE_ID"></script>
```

## 📊 GraphQL API

### Queries

```graphql
# Get live active visitors
query GetLiveVisitors($siteId: String!) {
  getLiveVisitors(siteId: $siteId) {
    sessionId
    geo {
      country
      city
      lat
      lng
    }
    startedAt
    isActive
  }
}

# Get visitor map data
query GetVisitorMap($siteId: String!, $startDate: DateTime, $endDate: DateTime) {
  getVisitorMap(siteId: $siteId, startDate: $startDate, endDate: $endDate) {
    points {
      lat
      lng
      country
    }
    countryCounts {
      country
      count
    }
    totalVisitors
  }
}

# Get high-intent accounts
query GetTopHighIntentAccounts($siteId: String!, $limit: Int) {
  getTopHighIntentAccounts(siteId: $siteId, limit: $limit) {
    accountId
    organizationName
    intentScore
    engagementScore
    category
    behaviorMetrics {
      pricingPageVisits
      docsPageVisits
      repeatVisits
    }
  }
}
```

### Mutations

```graphql
# Register a new client site
mutation RegisterClientSite($input: CreateSiteInput!) {
  registerClientSite(input: $input) {
    siteId
    name
    apiKey
  }
}

# Ingest tracking event (usually called by SDK)
mutation IngestTrackingEvent($siteId: String!, $input: TrackingEventInput!) {
  ingestTrackingEvent(siteId: $siteId, input: $input)
}
```

### Subscriptions

```graphql
# Subscribe to high-intent account alerts
subscription HighIntentAccountDetected($siteId: String!) {
  highIntentAccountDetected(siteId: $siteId) {
    accountId
    organizationName
    intentScore
  }
}
```

## 🔒 Privacy & Security

### Data Collection
- **Collected**: Page views, session duration, scroll depth, click events (non-PII), referrer, UTM params
- **NOT Collected**: Personal information, email addresses, names, phone numbers, individual identities

### Privacy Features
- **IP Hashing**: All IP addresses are SHA-256 hashed immediately upon ingestion
- **No Cookies**: Session-based tracking only, no persistent identifiers
- **No Fingerprinting**: No device fingerprinting or cross-site tracking
- **Data Retention**: Automatic deletion after 90 days (configurable)
- **Account-Level Only**: Aggregation at company level, not individual level

### Compliance
- GDPR compliant
- CCPA compliant
- DPDP compliant
- Privacy-by-design architecture

## 🧠 Intent Scoring Logic

### Engagement Score (0-100)
- Total sessions (max 30 points)
- Page views (max 20 points)
- Time spent (max 20 points)
- Repeat visits (max 15 points)
- Multi-user activity (max 15 points)

### Intent Score (0-100)
- Pricing page visits (max 30 points) - Strong buying signal
- Documentation/API visits (max 25 points) - Research signal
- Repeat visits (max 20 points) - Commitment signal
- Multi-user activity (max 15 points) - Team evaluation
- Time decay: Recent activity weighted higher
- Average time per session (max 10 points) - Depth signal

### Categories
- **Looker (0-40)**: Casual browsing
- **Researching (41-69)**: Active research, evaluating
- **High Intent (70-100)**: Strong buying signals

## 📁 Project Structure

```
tracker/
├── backend/
│   ├── src/
│   │   ├── auth/           # JWT authentication & RBAC
│   │   ├── sites/          # Client site management
│   │   ├── tracking/       # Event ingestion
│   │   ├── enrichment/     # Geo-location & org resolution
│   │   ├── intent/         # Intent scoring engine
│   │   ├── analytics/      # Analytics & reporting
│   │   ├── accounts/       # Account intelligence
│   │   └── common/         # Shared schemas & utilities
│   └── package.json
├── frontend/
│   ├── app/                # Next.js app router pages
│   ├── components/         # React components
│   └── package.json
├── sdk/
│   └── tracker.js          # Client tracking script
└── README.md
```

## 🔧 Configuration

### Backend Environment Variables

```env
MONGODB_URI=mongodb://localhost:27017/visitor-intelligence
JWT_SECRET=your-secret-key
JWT_EXPIRES_IN=7d
REDIS_HOST=localhost
REDIS_PORT=6379
GEOIP_SERVICE_URL=
GEOIP_API_KEY=
PORT=3001
CORS_ORIGIN=http://localhost:4000
```

### Frontend Environment Variables

```env
NEXT_PUBLIC_GRAPHQL_URL=http://localhost:3001/graphql
NEXT_PUBLIC_GRAPHQL_WS_URL=ws://localhost:3001/graphql
```

## 🚦 API Endpoints

### REST Endpoint (for tracking script)

```
POST /track
Headers:
  x-site-id: YOUR_SITE_ID
  x-api-key: YOUR_API_KEY
Body:
  {
    "sessionId": "sess_...",
    "eventType": "page_view",
    "pageUrl": "https://example.com/page",
    "referrer": "https://google.com",
    "userAgent": "...",
    "metadata": {}
  }
```

## 🎨 Frontend Dashboards

1. **Live Visitor Map**: Real-time world map showing visitor locations
2. **Behavior Analytics**: Engagement trends, page flows, top transitions
3. **Account Intelligence**: Table of accounts with intent scores and signals
4. **Alerts**: High-intent account notifications and traffic spike alerts

## 🔮 Future Enhancements

- ML-based intent prediction (replace rule engine)
- Advanced behavioral segmentation
- Email/Slack notifications (optional)
- Custom dashboard widgets
- Additional export formats (JSON, Excel)
- Multi-site aggregation
- A/B testing insights
- Webhook retry logic with exponential backoff

## 📝 License

MIT

## 🤝 Contributing

This is a production-grade MVP. Contributions welcome!

---

**Built with**: NestJS, Next.js, GraphQL, MongoDB, TypeScript, Tailwind CSS
