# Visitor Intelligence Backend

NestJS backend with GraphQL API for visitor intelligence platform.

## Setup

1. Install dependencies:
```bash
npm install
```

2. Configure environment variables (see `.env.example`)

3. Start MongoDB and Redis

4. Run the application:
```bash
npm run start:dev
```

## API

- GraphQL: `http://localhost:3001/graphql`
- REST Tracking Endpoint: `http://localhost:3001/track`

## Modules

- **Auth**: JWT authentication and role-based access control
- **Sites**: Client site management
- **Tracking**: Event ingestion from client websites
- **Enrichment**: Geo-location and organization resolution
- **Intent**: Intent scoring engine
- **Analytics**: Analytics and reporting
- **Accounts**: Account-level intelligence
