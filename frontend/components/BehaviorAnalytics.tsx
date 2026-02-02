'use client'

import { useQuery, gql } from '@apollo/client'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, BarChart, Bar } from 'recharts'

const GET_ENGAGEMENT_TRENDS = gql`
  query GetEngagementTrends($siteId: String!, $days: Int) {
    getEngagementTrends(siteId: $siteId, days: $days) {
      date
      visitors
      pageViews
      avgTime
    }
  }
`

const GET_PAGE_FLOW = gql`
  query GetPageFlow($siteId: String!) {
    getPageFlow(siteId: $siteId) {
      topTransitions {
        transition
        count
      }
    }
  }
`

interface BehaviorAnalyticsProps {
  siteId: string
}

export default function BehaviorAnalytics({ siteId }: BehaviorAnalyticsProps) {
  const { data: trendsData, loading: trendsLoading } = useQuery(GET_ENGAGEMENT_TRENDS, {
    variables: { siteId, days: 30 },
  })

  const { data: flowData, loading: flowLoading } = useQuery(GET_PAGE_FLOW, {
    variables: { siteId },
  })

  if (trendsLoading || flowLoading) return <div className="p-8">Loading analytics...</div>

  const trends = trendsData?.getEngagementTrends || []
  const topTransitions = flowData?.getPageFlow?.topTransitions || []

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-6">Engagement Trends</h2>
        <ResponsiveContainer width="100%" height={400}>
          <LineChart data={trends}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="date" />
            <YAxis />
            <Tooltip />
            <Legend />
            <Line type="monotone" dataKey="visitors" stroke="#0ea5e9" name="Visitors" />
            <Line type="monotone" dataKey="pageViews" stroke="#10b981" name="Page Views" />
          </LineChart>
        </ResponsiveContainer>
      </div>

      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-6">Top Page Transitions</h2>
        <ResponsiveContainer width="100%" height={400}>
          <BarChart data={topTransitions.slice(0, 10)}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="transition" angle={-45} textAnchor="end" height={150} />
            <YAxis />
            <Tooltip />
            <Bar dataKey="count" fill="#0ea5e9" />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}
