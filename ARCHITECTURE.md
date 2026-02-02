# System Architecture

## Overview

The Visitor Intelligence Platform is a B2B SaaS application that provides account-level visitor intelligence while maintaining strict privacy compliance. The system is designed with a modular, event-driven architecture.

## Architecture Principles

1. **Privacy-First**: IP hashing, no cookies, no fingerprinting
2. **Scalable**: Event-driven, async processing, queue-based
3. **Modular**: Clear separation of concerns
4. **Extensible**: Rule-based intent scoring (ready for ML replacement)

## System Components

### Backend (NestJS)

```
┌─────────────────────────────────────────────────────────┐
│                    GraphQL API Layer                     │
│  (Queries, Mutations, Subscriptions)                    │
└─────────────────────────────────────────────────────────┘
                            │
        ┌───────────────────┼───────────────────┐
        │                   │                   │
┌───────▼──────┐   ┌─────────▼─────────┐  ┌────▼──────────┐
│   Auth       │   │   Sites            │  │   Analytics    │
│   Module     │   │   Module           │  │   Module       │
└──────────────┘   └────────────────────┘  └────────────────┘
                            │
        ┌───────────────────┼───────────────────┐
        │                   │                   │
┌───────▼──────┐   ┌─────────▼─────────┐  ┌────▼──────────┐
│   Tracking   │   │   Enrichment       │  │   Intent        │
│   Module     │   │   Module           │  │   Module       │
└───────┬──────┘   └────────────────────┘  └────┬───────────┘
        │                                        │
        │                              ┌────────▼──────────┐
        │                              │   Accounts        │
        │                              │   Module          │
        │                              └───────────────────┘
        │
┌───────▼──────────────────────────────────────────────────┐
│              REST Endpoint (/track)                      │
│         (For client SDK event ingestion)                 │
└──────────────────────────────────────────────────────────┘
```

### Data Flow

1. **Event Ingestion**
   - Client SDK sends events to `/track` endpoint
   - IP address is hashed immediately (SHA-256)
   - Session created/updated in MongoDB
   - Event queued for async enrichment

2. **Enrichment Pipeline**
   - Background job processes enrichment queue
   - IP → Geo-location (country, city, coordinates)
   - IP → Organization (if corporate IP)
   - Flags detected (VPN, mobile, data center)
   - Session updated with enrichment data

3. **Account Linking**
   - Scheduled task (hourly) links sessions to accounts
   - Accounts created/updated based on organization/domain
   - Multiple sessions aggregated per account

4. **Intent Scoring**
   - Rule-based engine calculates:
     - Engagement Score (0-100)
     - Intent Score (0-100)
   - Account categorized: Looker / Researching / High Intent
   - Scores updated periodically

5. **Analytics & Reporting**
   - GraphQL queries aggregate data
   - Real-time subscriptions for live updates
   - Dashboards visualize:
     - Live visitor map
     - Behavior analytics
     - Account intelligence

## Database Schema

### VisitorSession
- Session-level tracking data
- Hashed IP addresses
- Geo-location data
- Page visit history
- Auto-expires after 90 days

### PageEvent
- Individual page events
- View, scroll, click events
- Non-PII metadata only
- Auto-expires after 90 days

### Account
- Company/account level aggregation
- Multiple sessions linked
- Intent and engagement scores
- Behavioral metrics

### Site
- Client website configuration
- API keys for tracking
- Settings and preferences

## Security & Privacy

### Data Protection
- **IP Hashing**: SHA-256 hashing immediately upon ingestion
- **No Cookies**: Session-based tracking only
- **No Fingerprinting**: No device fingerprinting
- **Data Retention**: Automatic deletion after 90 days

### Access Control
- JWT-based authentication
- Role-based access control (admin/user)
- API key validation for tracking endpoint
- Site-level data isolation

## Scalability Considerations

### Current Design
- MongoDB for flexible schema
- Redis/BullMQ for job queues
- In-memory caching for enrichment
- GraphQL subscriptions for real-time updates

### Future Scaling
- **Horizontal Scaling**: Stateless API servers
- **Database Sharding**: By siteId or accountId
- **Caching Layer**: Redis for frequently accessed data
- **CDN**: For static assets and SDK
- **Message Queue**: RabbitMQ/Kafka for high-volume events
- **ML Pipeline**: Separate service for intent prediction

## Technology Stack

### Backend
- **Framework**: NestJS
- **API**: GraphQL (Apollo Server)
- **Database**: MongoDB with Mongoose
- **Queue**: BullMQ (Redis)
- **Auth**: JWT (Passport)

### Frontend
- **Framework**: Next.js 14 (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **GraphQL**: Apollo Client
- **Maps**: Leaflet/React-Leaflet
- **Charts**: Recharts

### Client SDK
- **Language**: Vanilla JavaScript
- **Size**: < 10KB minified
- **Dependencies**: None (zero dependencies)

## Deployment Architecture

```
┌─────────────────┐
│   CDN/Edge      │  (SDK distribution)
└─────────────────┘
         │
┌────────▼─────────┐
│   Load Balancer  │
└────────┬─────────┘
         │
    ┌────┴────┐
    │         │
┌───▼───┐ ┌──▼───┐
│ API 1 │ │ API 2│  (NestJS instances)
└───┬───┘ └──┬───┘
    │        │
    └────┬────┘
         │
    ┌────▼────┐
    │ MongoDB │  (Replica Set)
    └─────────┘
         │
    ┌────▼────┐
    │  Redis  │  (Queue + Cache)
    └─────────┘
```

## Monitoring & Observability

### Recommended
- **Logging**: Structured logging (Winston/Pino)
- **Metrics**: Prometheus + Grafana
- **Tracing**: OpenTelemetry
- **Error Tracking**: Sentry
- **Uptime**: Health check endpoints

## Performance Targets

- **Event Ingestion**: < 100ms latency
- **Enrichment**: Async, non-blocking
- **Query Response**: < 500ms for most queries
- **Real-time Updates**: < 1s latency via subscriptions
- **SDK Size**: < 10KB minified
