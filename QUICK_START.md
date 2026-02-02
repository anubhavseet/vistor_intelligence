# Quick Start Guide

## 🚀 Get Started in 5 Minutes

### 1. Prerequisites
```bash
# Install Node.js 18+ and MongoDB
# Start MongoDB and Redis
mongod
redis-server
```

### 2. Backend Setup
```bash
cd backend
npm install
cp .env.example .env
# Edit .env with your MongoDB URI
npm run start:dev
```

Backend runs on `http://localhost:3001`

### 3. Frontend Setup
```bash
cd frontend
npm install
npm run dev
```

Frontend runs on `http://localhost:4000`

### 4. Create Your First Site

1. Open GraphQL Playground: `http://localhost:3001/graphql`

2. Register a user:
```graphql
mutation {
  register(input: {
    email: "user@example.com"
    password: "password123"
    name: "Test User"
  }) {
    accessToken
    user {
      id
      email
    }
  }
}
```

3. Create a site (use the accessToken from step 2):
```graphql
mutation {
  registerClientSite(input: {
    name: "My Website"
    domain: "example.com"
  }) {
    siteId
    apiKey
  }
}
```

4. Copy the `siteId` and `apiKey` - you'll need these!

### 5. Install Tracking Script

Add to your website's HTML:
```html
<script src="http://localhost:3001/sdk/tracker.js" data-site-id="YOUR_SITE_ID"></script>
```

Or use the local SDK file:
```html
<script src="/path/to/sdk/tracker.js" data-site-id="YOUR_SITE_ID"></script>
```

### 6. View Dashboard

1. Visit `http://localhost:4000`
2. Login with your credentials
3. View your site's dashboard
4. See live visitors, analytics, and account intelligence!

## 📊 Key Features to Try

### Live Visitor Map
- Navigate to your site dashboard
- Click "Live Map" tab
- See real-time visitor locations
- Watch the live visitor counter

### Account Intelligence
- Click "Accounts" tab
- Use search to find specific companies
- Filter by category (High Intent, Researching, Looker)
- Click on an account to see detailed timeline
- Export to CSV for analysis

### Webhooks
```graphql
mutation {
  createWebhook(input: {
    siteId: "your_site_id"
    url: "https://your-app.com/webhook"
    eventType: "high_intent"
  }) {
    id
    url
  }
}
```

### Health Check
```bash
curl http://localhost:3001/health
```

## 🎯 Next Steps

1. **Customize Intent Rules**: Edit `backend/src/intent/intent.service.ts`
2. **Add More Dashboards**: Create new components in `frontend/components/`
3. **Configure Webhooks**: Set up your webhook endpoints
4. **Export Data**: Use CSV export for external analysis
5. **Monitor Health**: Set up monitoring for `/health` endpoint

## 🐛 Troubleshooting

### Backend won't start
- Check MongoDB is running: `mongosh` should connect
- Check Redis is running: `redis-cli ping` should return PONG
- Verify `.env` file has correct values

### No visitors showing
- Check browser console for SDK errors
- Verify `siteId` matches your registered site
- Check backend logs for tracking events

### GraphQL errors
- Ensure you're authenticated (include `Authorization: Bearer TOKEN` header)
- Check GraphQL Playground for schema errors

## 📚 Documentation

- [README.md](./README.md) - Full documentation
- [ARCHITECTURE.md](./ARCHITECTURE.md) - System architecture
- [FEATURES.md](./FEATURES.md) - Advanced features guide
