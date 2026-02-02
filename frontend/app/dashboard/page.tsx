'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useQuery, gql } from '@apollo/client'
import Link from 'next/link'
import { useAuthStore } from '@/lib/auth-store'

const GET_SITES = gql`
  query GetSites {
    getSites {
      id
      siteId
      name
      domain
      isActive
    }
  }
`

export default function DashboardPage() {
  const router = useRouter()
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated)
  const logout = useAuthStore((state) => state.logout)
  const user = useAuthStore((state) => state.user)

  const { data, loading, error } = useQuery(GET_SITES, {
    skip: !isAuthenticated(),
  })

  useEffect(() => {
    if (!isAuthenticated()) {
      router.push('/')
    }
  }, [isAuthenticated, router])

  if (!isAuthenticated()) {
    return null
  }

  const handleLogout = () => {
    logout()
    router.push('/')
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <Link href="/dashboard" className="text-xl font-bold text-gray-900">
                Visitor Intelligence
              </Link>
            </div>
            <div className="flex items-center space-x-4">
              <span className="text-sm text-gray-600">Welcome, {user?.name}</span>
              <button
                onClick={handleLogout}
                className="text-gray-700 hover:text-gray-900 px-4 py-2 rounded-lg hover:bg-gray-100"
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Your Sites</h2>
          <p className="text-gray-600">Manage your tracked websites</p>
        </div>

        {loading && <div className="p-8">Loading...</div>}
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
            Error: {error.message}
          </div>
        )}

        {data?.getSites?.length === 0 ? (
          <div className="bg-white rounded-lg shadow p-8 text-center">
            <p className="text-gray-500 mb-4">No sites registered yet.</p>
            <p className="text-sm text-gray-400 mb-4">
              Use GraphQL to register your first site, or create a site registration page.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {data?.getSites?.map((site: any) => (
              <Link
                key={site.id}
                href={`/dashboard/${site.siteId}`}
                className="bg-white rounded-lg shadow hover:shadow-lg transition-shadow p-6"
              >
                <h3 className="text-lg font-semibold text-gray-900 mb-2">{site.name}</h3>
                <p className="text-sm text-gray-500 mb-4">{site.domain || 'No domain set'}</p>
                <span
                  className={`inline-block px-2 py-1 text-xs rounded ${
                    site.isActive
                      ? 'bg-green-100 text-green-800'
                      : 'bg-gray-100 text-gray-800'
                  }`}
                >
                  {site.isActive ? 'Active' : 'Inactive'}
                </span>
              </Link>
            ))}
          </div>
        )}
      </main>
    </div>
  )
}
