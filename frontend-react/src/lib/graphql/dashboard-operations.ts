import { gql } from '@apollo/client'

// ============================================
// DASHBOARD AGGREGATE QUERY
// ============================================

export const GET_DASHBOARD_DATA = gql`
  query GetDashboardData($siteId: String!, $days: Float!) {
    getAnalyticsDashboard(siteId: $siteId, days: $days) {
      overview {
        totalSessions
        totalPageViews
        avgSessionDuration
        bounceRate
      }
      dailyStats {
        date
        sessions
        pageViews
      }
      referrers {
        source
        count
      }
      topPages {
        url
        views
        visitors
      }
    }
    getTopHighIntentAccounts(siteId: $siteId, limit: 5) {
      id
      accountId
      organizationName
      domain
      intentScore
      engagementScore
      category
      totalSessions
      totalPageViews
      lastSeenAt
    }
    getLiveSessions(siteId: $siteId) {
      sessionId
    }
  }
`

export const GET_SUBSCRIPTION_USAGE = gql`
  query GetSubscriptionUsage {
    getMySubscription {
      id
      plan {
        name
        features {
          maxSites
          maxSessionsPerMonth
          maxAiCallsPerMonth
          maxCrawlPages
        }
      }
      status
      currentPeriodEnd
      currentUsage {
        sitesCreated
        sessionsTracked
        aiCallsMade
        crawlPagesUsed
      }
    }
  }
`

// ============================================
// RESPONSE TYPES
// ============================================

export interface DashboardOverview {
  totalSessions: number
  totalPageViews: number
  avgSessionDuration: number
  bounceRate: number
}

export interface DailyStatItem {
  date: string
  sessions: number
  pageViews: number
}

export interface ReferrerItem {
  source: string
  count: number
}

export interface TopPageItem {
  url: string
  views: number
  visitors: number
}

export interface HighIntentAccount {
  id: string
  accountId: string
  organizationName: string
  domain: string
  intentScore: number
  engagementScore: number
  category: string
  totalSessions: number
  totalPageViews: number
  lastSeenAt: string
}

export interface DashboardAnalytics {
  overview: DashboardOverview
  dailyStats: DailyStatItem[]
  referrers: ReferrerItem[]
  topPages: TopPageItem[]
}

export interface GetDashboardDataResponse {
  getAnalyticsDashboard: DashboardAnalytics
  getTopHighIntentAccounts: HighIntentAccount[]
  getLiveSessions: { sessionId: string }[]
}

export interface SubscriptionUsageResponse {
  getMySubscription: {
    id: string
    plan: {
      name: string
      features: {
        maxSites: number
        maxSessionsPerMonth: number
        maxAiCallsPerMonth: number
        maxCrawlPages: number
      }
    } | null
    status: string
    currentPeriodEnd: string | null
    currentUsage: {
      sitesCreated: number
      sessionsTracked: number
      aiCallsMade: number
      crawlPagesUsed: number
    }
  } | null
}
