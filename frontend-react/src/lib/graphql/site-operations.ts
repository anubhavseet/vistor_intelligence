import { gql } from '@apollo/client'

// ============================================
// QUERIES
// ============================================

// ... (previous code) ...

export const GET_SITES = gql`
  query GetSites {
    getSites {
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
      }
      apiKey
      createdAt
      updatedAt
    }
  }
`

export const GET_SITE = gql`
  query GetSite($siteId: String!) {
    getSite(siteId: $siteId) {
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
      }
      apiKey
      createdAt
      updatedAt
    }
  }
`

export const CREATE_SITE = gql`
  mutation CreateSite($input: CreateSiteInput!) {
    createSite(input: $input) {
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
      }
      apiKey
      createdAt
      updatedAt
    }
  }
`

export const UPDATE_SITE = gql`
  mutation UpdateSite($siteId: String!, $input: UpdateSiteInput!) {
    updateSite(siteId: $siteId, input: $input) {
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
      }
      apiKey
      createdAt
      updatedAt
    }
  }
`

export const DELETE_SITE = gql`
  mutation DeleteSite($siteId: String!) {
    deleteSite(siteId: $siteId)
  }
`

export const REGENERATE_API_KEY = gql`
  mutation RegenerateApiKey($siteId: String!) {
    regenerateApiKey(siteId: $siteId) {
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
      }
      apiKey
      createdAt
      updatedAt
    }
  }
`

// ============================================
// TYPESCRIPT TYPES
// ============================================

export interface SiteSettings {
  enableTracking: boolean
  enableGeoLocation: boolean
  enableBehaviorTracking: boolean
  dataRetentionDays: number
  trackingStartDelay: number
}

export interface UpdateSiteSettings {
  enableTracking?: boolean
  enableGeoLocation?: boolean
  enableBehaviorTracking?: boolean
  dataRetentionDays?: number
  trackingStartDelay?: number
}


export interface Site {
  id: string
  siteId: string
  name: string
  domain?: string
  allowedDomains: string[]
  userId: string
  isActive: boolean
  settings: SiteSettings
  apiKey?: string
  createdAt: Date
  updatedAt: Date
}

export interface CreateSiteInput {
  name: string
  domain?: string
}

export interface UpdateSiteInput {
  name?: string
  domain?: string
  allowedDomains?: string[]
  isActive?: boolean
  settings?: UpdateSiteSettings
}

// ============================================
// QUERY/MUTATION RESPONSE TYPES
// ============================================

export interface GetSitesResponse {
  getSites: Site[]
}

export interface GetSiteResponse {
  getSite: Site
}

export interface CreateSiteResponse {
  createSite: Site
}

export interface UpdateSiteResponse {
  updateSite: Site
}

export interface DeleteSiteResponse {
  deleteSite: boolean
}

export interface RegenerateApiKeyResponse {
  regenerateApiKey: Site
}
