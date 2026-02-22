import { gql } from '@apollo/client'

// ============================================
// ADMIN QUERIES
// ============================================

export const ADMIN_GET_ALL_USERS = gql`
  query AdminGetAllUsers {
    users {
      id
      email
      name
      role
      isActive
      lastLoginAt
      createdAt
      updatedAt
    }
  }
`

export const ADMIN_GET_ALL_SITES = gql`
  query AdminGetAllSites {
    adminGetAllSites {
      id
      siteId
      name
      domain
      allowedDomains
      userId
      isActive
      settings {
        enableTracking
        enableGeoLocation
        enableBehaviorTracking
        dataRetentionDays
        trackingStartDelay
        usePreGeneratedIntentUI
        isUiInjectionEnabled
        maxInjectionsPerIntent {
          intent
          limit
        }
      }
      apiKey
      createdAt
      updatedAt
    }
  }
`

export const ADMIN_GET_LIVE_SESSIONS = gql`
  query AdminGetLiveSessions($siteId: String!) {
    getLiveSessions(siteId: $siteId) {
      sessionId
      siteId
      intentScore
      intentCategory
      isActive
      startedAt
      lastActivityAt
      pagesVisited
      totalPageViews
      totalTimeSpent
      referrer
      browser
      os
      deviceType
      organizationName
      geo {
        country
        city
        region
      }
    }
  }
`

export const ADMIN_GET_ANALYTICS = gql`
  query AdminGetAnalytics($siteId: String!, $days: Float!) {
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
      topPages {
        url
        views
        visitors
      }
      geoStats {
        country
        count
      }
      referrers {
        source
        count
      }
    }
  }
`

export const ADMIN_GET_SYSTEM_HEALTH = gql`
  query AdminSystemHealth {
    adminSystemHealth {
      overallStatus
      timestamp
      services {
        name
        status
        latencyMs
        version
        details
      }
      collections {
        name
        documentCount
        storageSizeBytes
        indexCount
      }
      database {
        name
        dataSize
        storageSize
        collections
        indexes
        avgObjSize
        objects
      }
      process {
        uptimeSeconds
        memoryUsedMb
        memoryRssMb
        heapUsedMb
        heapTotalMb
        nodeVersion
        platform
        arch
        cpuCount
        totalMemoryGb
        freeMemoryGb
        hostname
        loadAvg1m
      }
      environment {
        key
        value
        detail
      }
    }
  }
`

export const ADMIN_GET_WEBHOOKS = gql`
  query AdminGetWebhooks($siteId: String!) {
    getWebhooks(siteId: $siteId) {
      id
      siteId
      url
      eventType
      isActive
      successCount
      failureCount
      lastTriggeredAt
    }
  }
`

// ============================================
// ADMIN MUTATIONS
// ============================================

export const ADMIN_UPDATE_USER = gql`
  mutation AdminUpdateUser($updateUserInput: UpdateUserInput!) {
    updateUser(updateUserInput: $updateUserInput) {
      id
      email
      name
      role
      isActive
    }
  }
`

export const ADMIN_CREATE_USER = gql`
  mutation AdminCreateUser($createUserInput: CreateUserInput!) {
    createUser(createUserInput: $createUserInput) {
      id
      email
      name
      role
      isActive
    }
  }
`

export const ADMIN_DELETE_USER = gql`
  mutation AdminDeleteUser($id: String!) {
    deleteUser(id: $id) {
      id
    }
  }
`

export const ADMIN_UPDATE_SITE = gql`
  mutation AdminUpdateSite($siteId: String!, $input: UpdateSiteInput!) {
    updateSite(siteId: $siteId, input: $input) {
      id
      siteId
      name
      isActive
    }
  }
`

export const ADMIN_DELETE_SITE = gql`
  mutation AdminDeleteSite($siteId: String!) {
    deleteSite(siteId: $siteId)
  }
`

// ============================================
// TYPESCRIPT TYPES
// ============================================

export interface AdminUser {
  id: string
  email: string
  name: string
  role: string
  isActive: boolean
  lastLoginAt?: string
  createdAt: string
  updatedAt: string
}

export interface AdminSite {
  id: string
  siteId: string
  name: string
  domain?: string
  allowedDomains: string[]
  userId: string
  isActive: boolean
  settings: {
    enableTracking: boolean
    enableGeoLocation: boolean
    enableBehaviorTracking: boolean
    dataRetentionDays: number
    trackingStartDelay: number
    usePreGeneratedIntentUI: boolean
    isUiInjectionEnabled: boolean
    maxInjectionsPerIntent: { intent: string; limit: number }[]
  }
  apiKey?: string
  createdAt: string
  updatedAt: string
}

export interface AdminSession {
  sessionId: string
  siteId: string
  intentScore: number
  intentCategory: string
  isActive: boolean
  startedAt: string
  lastActivityAt?: string
  pagesVisited: string[]
  totalPageViews: number
  totalTimeSpent: number
  referrer?: string
  browser?: string
  os?: string
  deviceType?: string
  organizationName?: string
  geo?: {
    country?: string
    city?: string
    region?: string
  }
}

export interface AdminWebhook {
  id: string
  siteId: string
  url: string
  eventType: string
  isActive: boolean
  successCount: number
  failureCount: number
  lastTriggeredAt?: string
}

export interface AdminAnalyticsOverview {
  totalSessions: number
  totalPageViews: number
  avgSessionDuration: number
  bounceRate: number
}

export interface AdminDailyStat {
  date: string
  sessions: number
  pageViews: number
}

export interface AdminAnalyticsDashboard {
  overview: AdminAnalyticsOverview
  dailyStats: AdminDailyStat[]
  topPages: { url: string; views: number; visitors: number }[]
  geoStats: { country: string; count: number }[]
  referrers: { source: string; count: number }[]
}

export interface AdminSystemHealthResponse {
  adminSystemHealth: {
    overallStatus: string
    timestamp: string
    services: {
      name: string
      status: string
      latencyMs?: number
      version?: string
      details?: string
    }[]
    collections: {
      name: string
      documentCount: number
      storageSizeBytes: number
      indexCount: number
    }[]
    database?: {
      name: string
      dataSize: number
      storageSize: number
      collections: number
      indexes: number
      avgObjSize: number
      objects: number
    }
    process: {
      uptimeSeconds: number
      memoryUsedMb: number
      memoryRssMb: number
      heapUsedMb: number
      heapTotalMb: number
      nodeVersion: string
      platform: string
      arch: string
      cpuCount: number
      totalMemoryGb: number
      freeMemoryGb: number
      hostname: string
      loadAvg1m: number
    }
    environment: {
      key: string
      value: string
      detail?: string
    }[]
  }
}

// ============================================
// RESPONSE TYPES
// ============================================

export interface AdminGetAllUsersResponse {
  users: AdminUser[]
}

export interface AdminGetAllSitesResponse {
  adminGetAllSites: AdminSite[]
}

export interface AdminGetLiveSessionsResponse {
  getLiveSessions: AdminSession[]
}

export interface AdminGetAnalyticsResponse {
  getAnalyticsDashboard: AdminAnalyticsDashboard
}

export interface AdminGetWebhooksResponse {
  getWebhooks: AdminWebhook[]
}
