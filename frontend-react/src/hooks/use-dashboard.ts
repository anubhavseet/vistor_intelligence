import { useQuery } from '@apollo/client/react'
import {
    GET_DASHBOARD_DATA,
    GET_SUBSCRIPTION_USAGE,
    type GetDashboardDataResponse,
    type SubscriptionUsageResponse,
} from '@/lib/graphql/dashboard-operations'

export function useDashboardData(siteId: string | null, days: number) {
    const {
        data: analyticsData,
        loading: analyticsLoading,
        error: analyticsError,
    } = useQuery<GetDashboardDataResponse>(GET_DASHBOARD_DATA, {
        variables: { siteId, days },
        skip: !siteId,
        fetchPolicy: 'cache-and-network',
    })

    const {
        data: subscriptionData,
        loading: subscriptionLoading,
    } = useQuery<SubscriptionUsageResponse>(GET_SUBSCRIPTION_USAGE, {
        fetchPolicy: 'cache-and-network',
    })

    const analytics = analyticsData?.getAnalyticsDashboard ?? null
    const topAccounts = analyticsData?.getTopHighIntentAccounts ?? []
    const liveVisitors = analyticsData?.getLiveSessions?.length ?? 0
    const subscription = subscriptionData?.getMySubscription ?? null

    return {
        // Analytics
        overview: analytics?.overview ?? null,
        dailyStats: analytics?.dailyStats ?? [],
        referrers: analytics?.referrers ?? [],
        topPages: analytics?.topPages ?? [],

        // Accounts
        topAccounts,

        // Live
        liveVisitors,

        // Subscription
        subscription,

        // Loading & error
        loading: analyticsLoading,
        subscriptionLoading,
        error: analyticsError,
    }
}
