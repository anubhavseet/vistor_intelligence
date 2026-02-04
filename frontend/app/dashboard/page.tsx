'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useQuery } from '@apollo/client'
import Link from 'next/link'
import { useAuthStore } from '@/lib/auth-store'
import { Plus, Globe, Activity, TrendingUp, Users, Zap, ArrowRight } from 'lucide-react'
import DashboardLayout from '@/components/DashboardLayout'
import AddSiteModal from '@/components/AddSiteModal'
import { GET_SITES, type GetSitesResponse } from '@/lib/graphql/site-operations'

export default function DashboardPage() {
  const router = useRouter()
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated)
  const user = useAuthStore((state) => state.user)

  const [showAddModal, setShowAddModal] = useState(false)

  const { data, loading, error, refetch } = useQuery(GET_SITES, {
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

  const sites = data?.getSites || []

  return (
    <DashboardLayout>
      <div className="p-8 max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-white mb-2">
            Welcome back, {user?.name}! 👋
          </h1>
          <p className="text-gray-300 text-lg">
            Here's what's happening with your visitor intelligence
          </p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {[
            {
              label: 'Total Sites',
              value: sites.length,
              icon: Globe,
              color: 'purple',
              gradient: 'from-purple-500 to-purple-600',
              change: '+2 this month'
            },
            {
              label: 'Active Visitors',
              value: '1,234',
              icon: Activity,
              color: 'blue',
              gradient: 'from-blue-500 to-blue-600',
              change: '+12% from yesterday'
            },
            {
              label: 'Total Pageviews',
              value: '45.2K',
              icon: TrendingUp,
              color: 'green',
              gradient: 'from-green-500 to-green-600',
              change: '+23% this week'
            },
            {
              label: 'Identified Accounts',
              value: '892',
              icon: Users,
              color: 'pink',
              gradient: 'from-pink-500 to-pink-600',
              change: '+156 this month'
            },
          ].map((stat, idx) => (
            <div
              key={idx}
              className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-6 hover:bg-white/10 transition-all hover:scale-105"
            >
              <div className="flex items-center justify-between mb-4">
                <div className={`p-3 bg-gradient-to-br ${stat.gradient} rounded-xl shadow-lg`}>
                  <stat.icon className="w-6 h-6 text-white" />
                </div>
              </div>
              <div>
                <p className="text-gray-400 text-sm mb-1">{stat.label}</p>
                <p className="text-3xl font-bold text-white mb-2">{stat.value}</p>
                <p className="text-xs text-green-400">{stat.change}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {/* Add New Site Card */}
          <button
            onClick={() => setShowAddModal(true)}
            className="bg-gradient-to-br from-purple-600/20 to-pink-600/20 border-2 border-purple-500/50 rounded-2xl p-8 hover:from-purple-600/30 hover:to-pink-600/30 transition-all hover:scale-105 text-left group"
          >
            <div className="flex items-center justify-between mb-4">
              <div className="p-4 bg-gradient-to-br from-purple-600 to-pink-600 rounded-xl shadow-lg shadow-purple-500/50 group-hover:shadow-purple-500/70 transition-shadow">
                <Plus className="w-8 h-8 text-white" />
              </div>
              <ArrowRight className="w-6 h-6 text-purple-400 group-hover:translate-x-2 transition-transform" />
            </div>
            <h3 className="text-xl font-bold text-white mb-2">Add New Website</h3>
            <p className="text-gray-300">
              Register a new site to start tracking visitor intelligence and behavior
            </p>
          </button>

          {/* Start Crawling Card */}
          <Link
            href="/dashboard/crawling"
            className="bg-gradient-to-br from-blue-600/20 to-cyan-600/20 border-2 border-blue-500/50 rounded-2xl p-8 hover:from-blue-600/30 hover:to-cyan-600/30 transition-all hover:scale-105 text-left group"
          >
            <div className="flex items-center justify-between mb-4">
              <div className="p-4 bg-gradient-to-br from-blue-600 to-cyan-600 rounded-xl shadow-lg shadow-blue-500/50 group-hover:shadow-blue-500/70 transition-shadow">
                <Zap className="w-8 h-8 text-white" />
              </div>
              <ArrowRight className="w-6 h-6 text-blue-400 group-hover:translate-x-2 transition-transform" />
            </div>
            <h3 className="text-xl font-bold text-white mb-2">Website Crawling</h3>
            <p className="text-gray-300">
              Crawl and index your website content for AI-powered insights
            </p>
          </Link>
        </div>

        {/* Recent Sites */}
        <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-white">Your Websites</h2>
            <Link
              href="/dashboard/sites"
              className="text-purple-400 hover:text-purple-300 text-sm font-medium flex items-center space-x-2 transition-colors"
            >
              <span>View All</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>

          {loading && (
            <div className="text-center p-12 text-gray-400">
              Loading your sites...
            </div>
          )}

          {error && (
            <div className="bg-red-900/20 border border-red-500/30 text-red-300 px-4 py-3 rounded-lg">
              Error loading sites: {error.message}
            </div>
          )}

          {!loading && !error && sites.length === 0 && (
            <div className="text-center p-12">
              <Globe className="w-16 h-16 text-gray-600 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-white mb-2">No websites yet</h3>
              <p className="text-gray-400 mb-6">
                Get started by adding your first website
              </p>
              <button
                onClick={() => setShowAddModal(true)}
                className="px-6 py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-xl hover:from-purple-700 hover:to-pink-700 transition-all font-medium shadow-lg shadow-purple-500/30"
              >
                Add Your First Site
              </button>
            </div>
          )}

          {!loading && sites.length > 0 && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {sites.slice(0, 6).map((site: any) => (
                <Link
                  key={site.id}
                  href={`/dashboard/${site.siteId}`}
                  className="bg-white/5 border border-white/10 rounded-xl p-6 hover:bg-white/10 hover:border-purple-500/50 transition-all group"
                >
                  <div className="flex items-start justify-between mb-4">
                    <div className="p-3 bg-gradient-to-br from-purple-600/20 to-pink-600/20 rounded-lg group-hover:from-purple-600/30 group-hover:to-pink-600/30 transition-all">
                      <Globe className="w-6 h-6 text-purple-400" />
                    </div>
                    <span
                      className={`px-2 py-1 text-xs rounded-full font-medium ${site.isActive
                        ? 'bg-green-500/20 text-green-300 border border-green-500/30'
                        : 'bg-gray-500/20 text-gray-400 border border-gray-500/30'
                        }`}
                    >
                      {site.isActive ? 'Active' : 'Inactive'}
                    </span>
                  </div>
                  <h3 className="text-lg font-semibold text-white mb-2 group-hover:text-purple-400 transition-colors">
                    {site.name}
                  </h3>
                  <p className="text-sm text-gray-400 mb-4">
                    {site.domain || 'No domain set'}
                  </p>
                  <div className="flex items-center text-purple-400 text-sm font-medium group-hover:translate-x-2 transition-transform">
                    View Details <ArrowRight className="w-4 h-4 ml-1" />
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Add Site Modal */}
      <AddSiteModal
        isOpen={showAddModal}
        onClose={() => setShowAddModal(false)}
        onSuccess={() => {
          refetch()
          setShowAddModal(false)
        }}
      />
    </DashboardLayout>
  )
}
