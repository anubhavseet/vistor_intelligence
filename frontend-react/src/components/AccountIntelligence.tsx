import { useState } from 'react'
import { gql } from '@apollo/client'
import { useQuery } from '@apollo/client/react'
import { Link } from 'react-router-dom'

const GET_TOP_HIGH_INTENT_ACCOUNTS = gql`
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

interface AccountIntelligenceProps {
  siteId: string
}

export default function AccountIntelligence({ siteId }: AccountIntelligenceProps) {
  const [search, setSearch] = useState('')
  const [category, setCategory] = useState<string>('')
  const [showFilters, setShowFilters] = useState(false)

  const { data, loading, error } = useQuery(GET_TOP_HIGH_INTENT_ACCOUNTS, {
    variables: { siteId, limit: 50, search: search || undefined, category: category || undefined },
    pollInterval: 60000,
  })

  if (loading) return <div className="p-8">Loading accounts...</div>
  if (error) return <div className="p-8 text-red-500">Error: {error.message}</div>

  const accounts = (data as any)?.getAccountIntentScores || []

  const getScoreColor = (score: number) => {
    if (score >= 70) return 'text-green-600 bg-green-100'
    if (score >= 40) return 'text-yellow-600 bg-yellow-100'
    return 'text-gray-600 bg-gray-100'
  }

  const getCategoryColor = (category: string) => {
    if (category === 'High Intent') return 'bg-red-100 text-red-800'
    if (category === 'Researching') return 'bg-yellow-100 text-yellow-800'
    return 'bg-gray-100 text-gray-800'
  }

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-gray-900">Account Intelligence</h2>
          <div className="flex space-x-2">
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200"
            >
              Filters
            </button>
            <a
              href={`/api/accounts/${siteId}/export`}
              download
              className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700"
            >
              Export CSV
            </a>
          </div>
        </div>

        {showFilters && (
          <div className="mb-6 p-4 bg-gray-50 rounded-lg space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Search</label>
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search by company or domain..."
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Category</label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
              >
                <option value="">All Categories</option>
                <option value="High Intent">High Intent</option>
                <option value="Researching">Researching</option>
                <option value="Looker">Looker</option>
              </select>
            </div>
          </div>
        )}

        {accounts.length === 0 ? (
          <p className="text-gray-500">No accounts detected yet.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Company
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Intent Score
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Category
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Sessions
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Signals
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Last Seen
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Action
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {accounts.map((account: any) => (
                  <tr key={account.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <div className="text-sm font-medium text-gray-900">
                          {account.organizationName || 'Unknown'}
                        </div>
                        <div className="text-sm text-gray-500">{account.domain || 'N/A'}</div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span
                        className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getScoreColor(
                          account.intentScore
                        )}`}
                      >
                        {account.intentScore}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span
                        className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getCategoryColor(
                          account.category
                        )}`}
                      >
                        {account.category}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {account.totalSessions}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      <div className="space-y-1">
                        {account.behaviorMetrics?.pricingPageVisits > 0 && (
                          <div>💰 Pricing: {account.behaviorMetrics.pricingPageVisits}</div>
                        )}
                        {account.behaviorMetrics?.docsPageVisits > 0 && (
                          <div>📚 Docs: {account.behaviorMetrics.docsPageVisits}</div>
                        )}
                        {account.behaviorMetrics?.apiPageVisits > 0 && (
                          <div>🔌 API: {account.behaviorMetrics.apiPageVisits}</div>
                        )}
                        {account.behaviorMetrics?.repeatVisits > 0 && (
                          <div>🔄 Repeat: {account.behaviorMetrics.repeatVisits}</div>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {new Date(account.lastSeenAt).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      <Link
                        to={`/dashboard/${siteId}/accounts/${account.accountId}`}
                        className="text-primary-600 hover:text-primary-900"
                      >
                        View Details
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
