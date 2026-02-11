import { gql } from '@apollo/client'

// ============================================
// QUERIES
// ============================================

export const GET_TOP_HIGH_INTENT_ACCOUNTS = gql`
  query GetTopHighIntentAccounts($siteId: String!, $limit: Int, $search: String, $category: String) {
    getAccountIntentScores(siteId: $siteId, minScore: 0, search: $search, category: $category) {
      id
      accountId
      organizationName
      domain
      intentScore
      engagementScore
      category
      totalSessions      
      totalPageViews
      behaviorMetrics {
        pricingPageVisits
        docsPageVisits
        apiPageVisits
        repeatVisits
      }
      lastSeenAt
    }
  }
`

export const GET_ENGAGEMENT_TRENDS = gql`
  query GetEngagementTrends($siteId: String!, $startDate: DateTime, $endDate: DateTime) {
    getEngagementTrends(siteId: $siteId, startDate: $startDate, endDate: $endDate) {
      date
      sessions
      pageViews
      avgTimeOnSite
    }
  }
`

export const GET_PAGE_FLOW = gql`
  query GetPageFlow($siteId: String!, $startDate: DateTime, $endDate: DateTime) {
    getPageFlow(siteId: $siteId, startDate: $startDate, endDate: $endDate) {
      topTransitions {
        fromPage
        toPage
        count
      }
    }
  }
`

export const GET_VISITOR_MAP = gql`
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
`

export const GET_LIVE_VISITOR_COUNT = gql`
  query GetLiveVisitorCount($siteId: String!) {
    getLiveVisitorCount(siteId: $siteId)
  }
`

// ============================================
// TYPESCRIPT TYPES
// ============================================

export interface BehaviorMetrics {
    pricingPageVisits: number
    docsPageVisits: number
    apiPageVisits: number
    repeatVisits: number
}

export interface AccountIntentScore {
    id: string
    accountId: string
    organizationName: string
    domain: string
    intentScore: number
    engagementScore: number
    category: string
    totalSessions: number
    totalPageViews: number
    behaviorMetrics: BehaviorMetrics
    lastSeenAt: string
}

export interface EngagementTrend {
    date: string
    sessions: number
    pageViews: number
    avgTimeOnSite: number
}

export interface PageTransition {
    fromPage: string
    toPage: string
    count: number
}

export interface PageFlow {
    topTransitions: PageTransition[]
}

export interface VisitorPoint {
    lat: number
    lng: number
    country: string
}

export interface CountryCount {
    country: string
    count: number
}

export interface VisitorMap {
    points: VisitorPoint[]
    countryCounts: CountryCount[]
    totalVisitors: number
}

// ============================================
// QUERY RESPONSE TYPES
// ============================================

export interface GetTopHighIntentAccountsResponse {
    getAccountIntentScores: AccountIntentScore[]
}

export interface GetEngagementTrendsResponse {
    getEngagementTrends: EngagementTrend[]
}

export interface GetPageFlowResponse {
    getPageFlow: PageFlow
}

export interface GetVisitorMapResponse {
    getVisitorMap: VisitorMap
}

export interface GetLiveVisitorCountResponse {
    getLiveVisitorCount: number
}
