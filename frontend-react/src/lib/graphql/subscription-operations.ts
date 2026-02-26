import { gql } from '@apollo/client'

// ============================================
// USER QUERIES
// ============================================

export const GET_MY_SUBSCRIPTION = gql`
  query GetMySubscription {
    getMySubscription {
      id
      subscriptionId
      razorpaySubscriptionId
      userId
      plan {
        id
        planId
        name
        description
        amount
        currency
        period
        interval
        isCustom
        features {
          maxSites
          maxWebhooks
          maxSessionsPerMonth
          maxAiCallsPerMonth
          maxCrawlPages
          dataRetentionDays
          enableBehaviorTracking
          enableGeoLocation
          enableUiInjection
          enableEnrichment
          enableCustomWebhooks
        }
        trialDays
      }
      status
      currentPeriodStart
      currentPeriodEnd
      startedAt
      endedAt
      cancelledAt
      cancelAtPeriodEnd
      paidCount
      shortUrl
      currentUsage {
        sitesCreated
        webhooksCreated
        sessionsTracked
        aiCallsMade
        crawlPagesUsed
      }
      createdAt
      updatedAt
    }
  }
`

export const GET_PUBLIC_PLANS = gql`
  query GetPublicPlans {
    getPublicPlans {
      id
      planId
      name
      description
      amount
      currency
      period
      interval
      isActive
      isCustom
      features {
        maxSites
        maxWebhooks
        maxSessionsPerMonth
        maxAiCallsPerMonth
        maxCrawlPages
        dataRetentionDays
        enableBehaviorTracking
        enableGeoLocation
        enableUiInjection
        enableEnrichment
        enableCustomWebhooks
      }
      trialDays
      sortOrder
    }
  }
`

export const GET_AVAILABLE_PLANS = gql`
  query GetAvailablePlans {
    getAvailablePlans {
      id
      planId
      name
      description
      amount
      currency
      period
      interval
      isActive
      isCustom
      features {
        maxSites
        maxWebhooks
        maxSessionsPerMonth
        maxAiCallsPerMonth
        maxCrawlPages
        dataRetentionDays
        enableBehaviorTracking
        enableGeoLocation
        enableUiInjection
        enableEnrichment
        enableCustomWebhooks
      }
      trialDays
      sortOrder
    }
  }
`

export const GET_MY_INVOICES = gql`
  query GetMyInvoices {
    getMyInvoices {
      id
      invoiceId
      razorpayPaymentId
      userId
      plan {
        id
        name
        amount
      }
      amount
      currency
      status
      billingPeriodStart
      billingPeriodEnd
      paidAt
      receiptUrl
      createdAt
    }
  }
`

export const GET_INVOICE_DOWNLOAD_URL = gql`
  query GetInvoiceDownloadUrl($invoiceId: String!) {
    getInvoiceDownloadUrl(invoiceId: $invoiceId)
  }
`

// ============================================
// USER MUTATIONS
// ============================================

export const CREATE_SUBSCRIPTION = gql`
  mutation CreateSubscription($planId: String!) {
    createSubscription(planId: $planId) {
      subscriptionId
      razorpaySubscriptionId
      shortUrl
      razorpayKeyId
      status
    }
  }
`

export const CANCEL_SUBSCRIPTION = gql`
  mutation CancelSubscription($subscriptionId: String!, $cancelAtPeriodEnd: Boolean!) {
    cancelSubscription(subscriptionId: $subscriptionId, cancelAtPeriodEnd: $cancelAtPeriodEnd) {
      id
      subscriptionId
      status
      cancelledAt
      cancelAtPeriodEnd
    }
  }
`

export const PAUSE_SUBSCRIPTION = gql`
  mutation PauseSubscription($subscriptionId: String!) {
    pauseSubscription(subscriptionId: $subscriptionId) {
      id
      subscriptionId
      status
    }
  }
`

export const RESUME_SUBSCRIPTION = gql`
  mutation ResumeSubscription($subscriptionId: String!) {
    resumeSubscription(subscriptionId: $subscriptionId) {
      id
      subscriptionId
      status
    }
  }
`

export const CHANGE_PLAN = gql`
  mutation ChangePlan($newPlanId: String!) {
    changePlan(newPlanId: $newPlanId) {
      subscriptionId
      razorpaySubscriptionId
      shortUrl
      razorpayKeyId
      status
    }
  }
`

// ============================================
// ADMIN QUERIES
// ============================================

export const ADMIN_GET_ALL_PLANS = gql`
  query AdminGetAllPlans {
    adminGetAllPlans {
      id
      planId
      razorpayPlanId
      name
      description
      amount
      currency
      period
      interval
      isActive
      isCustom
      assignedUserId
      features {
        maxSites
        maxWebhooks
        maxSessionsPerMonth
        maxAiCallsPerMonth
        maxCrawlPages
        dataRetentionDays
        enableBehaviorTracking
        enableGeoLocation
        enableUiInjection
        enableEnrichment
        enableCustomWebhooks
      }
      trialDays
      sortOrder
      createdAt
      updatedAt
    }
  }
`

export const ADMIN_GET_ALL_SUBSCRIPTIONS = gql`
  query AdminGetAllSubscriptions($status: String) {
    adminGetAllSubscriptions(status: $status) {
      id
      subscriptionId
      razorpaySubscriptionId
      userId
      userName
      userEmail
      plan {
        id
        name
        amount
        period
      }
      status
      currentPeriodStart
      currentPeriodEnd
      startedAt
      endedAt
      cancelledAt
      cancelAtPeriodEnd
      paidCount
      currentUsage {
        sitesCreated
        webhooksCreated
        sessionsTracked
        aiCallsMade
        crawlPagesUsed
      }
      createdAt
      updatedAt
    }
  }
`

// ============================================
// ADMIN MUTATIONS
// ============================================

export const ADMIN_CREATE_PLAN = gql`
  mutation AdminCreatePlan($input: CreatePlanInput!) {
    adminCreatePlan(input: $input) {
      id
      planId
      razorpayPlanId
      name
      amount
      isActive
      trialDays
    }
  }
`

export const ADMIN_UPDATE_PLAN = gql`
  mutation AdminUpdatePlan($id: ID!, $input: UpdatePlanInput!) {
    adminUpdatePlan(id: $id, input: $input) {
      id
      planId
      name
      isActive
      features {
        maxSites
        maxWebhooks
        maxSessionsPerMonth
        maxAiCallsPerMonth
        maxCrawlPages
        dataRetentionDays
        enableBehaviorTracking
        enableGeoLocation
        enableUiInjection
        enableEnrichment
        enableCustomWebhooks
      }
      trialDays
    }
  }
`

export const ADMIN_DELETE_PLAN = gql`
  mutation AdminDeletePlan($id: ID!) {
    adminDeletePlan(id: $id)
  }
`

export const ADMIN_ASSIGN_CUSTOM_PLAN = gql`
  mutation AdminAssignCustomPlan($planId: String!, $userId: String!) {
    adminAssignCustomPlan(planId: $planId, userId: $userId) {
      id
      planId
      name
      amount
      isActive
      isCustom
      assignedUserId
    }
  }
`

export const ADMIN_CANCEL_SUBSCRIPTION = gql`
  mutation AdminCancelSubscription($subscriptionId: String!, $cancelAtPeriodEnd: Boolean!) {
    adminCancelSubscription(subscriptionId: $subscriptionId, cancelAtPeriodEnd: $cancelAtPeriodEnd) {
      id
      subscriptionId
      status
    }
  }
`

// ============================================
// TYPESCRIPT TYPES
// ============================================

export interface PlanFeatures {
  maxSites: number
  maxWebhooks: number
  maxSessionsPerMonth: number
  maxAiCallsPerMonth: number
  maxCrawlPages: number
  dataRetentionDays: number
  enableBehaviorTracking: boolean
  enableGeoLocation: boolean
  enableUiInjection: boolean
  enableEnrichment: boolean
  enableCustomWebhooks: boolean
}

export interface SubscriptionPlan {
  id: string
  planId: string
  razorpayPlanId?: string
  name: string
  description: string
  amount: number
  currency: string
  period: 'monthly' | 'yearly'
  interval: number
  isActive: boolean
  isCustom: boolean
  assignedUserId?: string
  features: PlanFeatures
  trialDays: number
  sortOrder: number
  createdAt?: string
  updatedAt?: string
}

export interface SubscriptionUsage {
  sitesCreated: number
  webhooksCreated: number
  sessionsTracked: number
  aiCallsMade: number
  crawlPagesUsed: number
}

export interface UserSubscription {
  id: string
  subscriptionId: string
  razorpaySubscriptionId?: string
  userId: string
  plan?: SubscriptionPlan
  status: string
  currentPeriodStart?: string
  currentPeriodEnd?: string
  startedAt?: string
  endedAt?: string
  cancelledAt?: string
  cancelAtPeriodEnd: boolean
  paidCount: number
  shortUrl?: string
  currentUsage: SubscriptionUsage
  createdAt: string
  updatedAt: string
}

export interface SubscriptionInvoice {
  id: string
  invoiceId: string
  razorpayPaymentId?: string
  userId: string
  plan?: { id: string; name: string; amount: number }
  amount: number
  currency: string
  status: string
  billingPeriodStart?: string
  billingPeriodEnd?: string
  paidAt?: string
  receiptUrl?: string
  createdAt: string
}

export interface AdminSubscription extends UserSubscription {
  userName?: string
  userEmail?: string
}

export interface CreateSubscriptionResponse {
  createSubscription: {
    subscriptionId: string
    razorpaySubscriptionId?: string
    shortUrl?: string
    razorpayKeyId: string
    status: string
  }
}

export interface ChangePlanResponse {
  changePlan: {
    subscriptionId: string
    razorpaySubscriptionId?: string
    shortUrl?: string
    razorpayKeyId: string
    status: string
  }
}

export interface GetMySubscriptionResponse {
  getMySubscription: UserSubscription | null
}

export interface GetAvailablePlansResponse {
  getAvailablePlans: SubscriptionPlan[]
}

export interface GetPublicPlansResponse {
  getPublicPlans: SubscriptionPlan[]
}

export interface GetMyInvoicesResponse {
  getMyInvoices: SubscriptionInvoice[]
}

export interface AdminGetAllPlansResponse {
  adminGetAllPlans: SubscriptionPlan[]
}

export interface AdminGetAllSubscriptionsResponse {
  adminGetAllSubscriptions: AdminSubscription[]
}

export interface GetInvoiceDownloadUrlResponse {
  getInvoiceDownloadUrl: string
}
