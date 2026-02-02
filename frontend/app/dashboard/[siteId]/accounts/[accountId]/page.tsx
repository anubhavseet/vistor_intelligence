'use client'

import { useParams } from 'next/navigation'
import { useQuery, gql } from '@apollo/client'
import Link from 'next/link'

const GET_ACCOUNT = gql`
  query GetAccount($accountId: String!) {
    getAccount(accountId: $accountId) {
      id
      accountId
      organizationName
      domain
      intentScore
      engagementScore
      category
      totalSessions
      totalPageViews
      totalTimeSpent
      behaviorMetrics {
        pricingPageVisits
        docsPageVisits
        apiPageVisits
        repeatVisits
        multiUserActivity
        avgTimePerSession
        avgPagesPerSession
      }
      firstSeenAt
      lastSeenAt
    }
  }
`

const GET_ACCOUNT_TIMELINE = gql`
  query GetAccountTimeline($accountId: String!) {
    getAccountTimeline(accountId: $accountId) {
      id
      sessionId
      startedAt
      endedAt
      totalPageViews
      totalTimeSpent
      pagesVisited
      geo {
        country
        city
      }
    }
  }
`

export default function AccountDetailPage() {
  const params = useParams()
  const accountId = params.accountId as string
  const siteId = params.siteId as string

  const { data: accountData, loading: accountLoading } = useQuery(GET_ACCOUNT, {
    variables: { accountId },
  })

  const { data: timelineData, loading: timelineLoading } = useQuery(GET_ACCOUNT_TIMELINE, {
    variables: { accountId },
  })

  if (accountLoading || timelineLoading) {
    return <div className="p-8">Loading account details...</div>
  }

  const account = accountData?.getAccount
  const sessions = timelineData?.getAccountTimeline || []

  const getScoreColor = (score: number) => {
    if (score >= 70) return 'text-green-600 bg-green-100'
    if (score >= 40) return 'text-yellow-600 bg-yellow-100'
    return 'text-gray-600 bg-gray-100'
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center space-x-4">
              <Link href={`/dashboard/${siteId}`} className="text-primary-600 hover:text-primary-800">
                ← Back to Dashboard
              </Link>
            </div>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <div className="flex justify-between items-start mb-6">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">
                {account?.organizationName || 'Unknown Organization'}
              </h1>
              <p className="text-gray-600">{account?.domain || 'No domain'}</p>
            </div>
            <div className="text-right">
              <div className="mb-2">
                <span className="text-sm text-gray-500">Intent Score</span>
                <div className={`inline-flex px-3 py-1 text-lg font-bold rounded-full ml-2 ${getScoreColor(account?.intentScore || 0)}`}>
                  {account?.intentScore || 0}
                </div>
              </div>
              <div>
                <span className="text-sm text-gray-500">Category</span>
                <span className="ml-2 px-2 py-1 text-sm font-semibold rounded-full bg-blue-100 text-blue-800">
                  {account?.category || 'Looker'}
                </span>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            <div className="p-4 bg-gray-50 rounded-lg">
              <p className="text-sm text-gray-500">Total Sessions</p>
              <p className="text-2xl font-bold text-gray-900">{account?.totalSessions || 0}</p>
            </div>
            <div className="p-4 bg-gray-50 rounded-lg">
              <p className="text-sm text-gray-500">Page Views</p>
              <p className="text-2xl font-bold text-gray-900">{account?.totalPageViews || 0}</p>
            </div>
            <div className="p-4 bg-gray-50 rounded-lg">
              <p className="text-sm text-gray-500">Total Time</p>
              <p className="text-2xl font-bold text-gray-900">
                {Math.round((account?.totalTimeSpent || 0) / 60)}m
              </p>
            </div>
            <div className="p-4 bg-gray-50 rounded-lg">
              <p className="text-sm text-gray-500">Engagement</p>
              <p className="text-2xl font-bold text-gray-900">{account?.engagementScore || 0}</p>
            </div>
          </div>

          <div className="border-t pt-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Behavior Signals</h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {account?.behaviorMetrics?.pricingPageVisits > 0 && (
                <div className="p-3 bg-green-50 rounded-lg">
                  <p className="text-sm text-gray-600">Pricing Visits</p>
                  <p className="text-xl font-bold text-green-600">
                    {account.behaviorMetrics.pricingPageVisits}
                  </p>
                </div>
              )}
              {account?.behaviorMetrics?.docsPageVisits > 0 && (
                <div className="p-3 bg-blue-50 rounded-lg">
                  <p className="text-sm text-gray-600">Docs Visits</p>
                  <p className="text-xl font-bold text-blue-600">
                    {account.behaviorMetrics.docsPageVisits}
                  </p>
                </div>
              )}
              {account?.behaviorMetrics?.apiPageVisits > 0 && (
                <div className="p-3 bg-purple-50 rounded-lg">
                  <p className="text-sm text-gray-600">API Visits</p>
                  <p className="text-xl font-bold text-purple-600">
                    {account.behaviorMetrics.apiPageVisits}
                  </p>
                </div>
              )}
              {account?.behaviorMetrics?.repeatVisits > 0 && (
                <div className="p-3 bg-yellow-50 rounded-lg">
                  <p className="text-sm text-gray-600">Repeat Visits</p>
                  <p className="text-xl font-bold text-yellow-600">
                    {account.behaviorMetrics.repeatVisits}
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4">Visit Timeline</h2>
          <div className="space-y-4">
            {sessions.length === 0 ? (
              <p className="text-gray-500">No sessions found</p>
            ) : (
              sessions.map((session: any) => (
                <div key={session.id} className="border-l-4 border-primary-500 pl-4 py-2">
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="font-semibold text-gray-900">
                        {new Date(session.startedAt).toLocaleString()}
                      </p>
                      <p className="text-sm text-gray-600">
                        {session.geo?.city && session.geo?.country
                          ? `${session.geo.city}, ${session.geo.country}`
                          : 'Unknown location'}
                      </p>
                      <p className="text-sm text-gray-500 mt-1">
                        {session.totalPageViews} pages • {Math.round(session.totalTimeSpent / 60)}m
                      </p>
                    </div>
                    <span className="text-xs text-gray-400">
                      {session.endedAt
                        ? `Ended: ${new Date(session.endedAt).toLocaleTimeString()}`
                        : 'Active'}
                    </span>
                  </div>
                  {session.pagesVisited && session.pagesVisited.length > 0 && (
                    <div className="mt-2">
                      <p className="text-xs text-gray-500">Pages visited:</p>
                      <div className="flex flex-wrap gap-1 mt-1">
                        {session.pagesVisited.slice(0, 5).map((page: string, idx: number) => (
                          <span
                            key={idx}
                            className="text-xs px-2 py-1 bg-gray-100 rounded text-gray-700"
                          >
                            {new URL(page).pathname}
                          </span>
                        ))}
                        {session.pagesVisited.length > 5 && (
                          <span className="text-xs px-2 py-1 bg-gray-100 rounded text-gray-700">
                            +{session.pagesVisited.length - 5} more
                          </span>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      </main>
    </div>
  )
}
