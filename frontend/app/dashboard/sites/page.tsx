'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useQuery } from '@apollo/client'
import { useAuthStore } from '@/lib/auth-store'
import DashboardLayout from '@/components/DashboardLayout'
import AddSiteModal from '@/components/AddSiteModal'
import { Globe, Plus, Search, Filter, ArrowRight, ExternalLink } from 'lucide-react'
import Link from 'next/link'
import { GET_SITES, type GetSitesResponse } from '@/lib/graphql/site-operations'

export default function SitesPage() {
    const router = useRouter()
    const isAuthenticated = useAuthStore((state) => state.isAuthenticated)

    const [showAddModal, setShowAddModal] = useState(false)
    const [searchTerm, setSearchTerm] = useState('')
    const [filterStatus, setFilterStatus] = useState<'all' | 'active' | 'inactive'>('all')

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

    // Filter sites
    const filteredSites = sites.filter((site: any) => {
        const matchesSearch = site.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            (site.domain || '').toLowerCase().includes(searchTerm.toLowerCase())
        const matchesFilter = filterStatus === 'all' ||
            (filterStatus === 'active' && site.isActive) ||
            (filterStatus === 'inactive' && !site.isActive)
        return matchesSearch && matchesFilter
    })

    return (
        <DashboardLayout>
            <div className="p-8 max-w-7xl mx-auto">
                {/* Header */}
                <div className="mb-8">
                    <h1 className="text-4xl font-bold text-white mb-2">Websites</h1>
                    <p className="text-gray-300 text-lg">
                        Manage all your tracked websites and tracking scripts
                    </p>
                </div>

                {/* Actions Bar */}
                <div className="flex flex-col md:flex-row gap-4 mb-8">
                    {/* Search */}
                    <div className="flex-1 relative">
                        <Search className="w-5 h-5 text-gray-400 absolute left-4 top-1/2 -translate-y-1/2" />
                        <input
                            type="text"
                            placeholder="Search websites..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full pl-12 pr-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
                        />
                    </div>

                    {/* Filter */}
                    <div className="flex items-center space-x-2 bg-white/5 border border-white/10 rounded-xl p-1">
                        {['all', 'active', 'inactive'].map((status) => (
                            <button
                                key={status}
                                onClick={() => setFilterStatus(status as any)}
                                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${filterStatus === status
                                    ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white'
                                    : 'text-gray-400 hover:text-white'
                                    }`}
                            >
                                {status.charAt(0).toUpperCase() + status.slice(1)}
                            </button>
                        ))}
                    </div>

                    {/* Add Button */}
                    <button
                        onClick={() => setShowAddModal(true)}
                        className="px-6 py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-xl hover:from-purple-700 hover:to-pink-700 transition-all font-medium flex items-center space-x-2 shadow-lg shadow-purple-500/30"
                    >
                        <Plus className="w-5 h-5" />
                        <span>Add Website</span>
                    </button>
                </div>

                {/* Loading State */}
                {loading && (
                    <div className="text-center p-12 text-gray-400">
                        Loading websites...
                    </div>
                )}

                {/* Error State */}
                {error && (
                    <div className="bg-red-900/20 border border-red-500/30 text-red-300 px-4 py-3 rounded-lg">
                        Error loading websites: {error.message}
                    </div>
                )}

                {/* Empty State */}
                {!loading && !error && sites.length === 0 && (
                    <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-12 text-center">
                        <Globe className="w-20 h-20 text-gray-600 mx-auto mb-6" />
                        <h3 className="text-2xl font-bold text-white mb-3">No websites yet</h3>
                        <p className="text-gray-400 mb-8 max-w-md mx-auto">
                            Start tracking visitor intelligence by adding your first website
                        </p>
                        <button
                            onClick={() => setShowAddModal(true)}
                            className="px-8 py-4 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-xl hover:from-purple-700 hover:to-pink-700 transition-all font-medium shadow-lg shadow-purple-500/30 text-lg"
                        >
                            Add Your First Website
                        </button>
                    </div>
                )}

                {/* Sites Grid */}
                {!loading && filteredSites.length > 0 && (
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        {filteredSites.map((site: any) => (
                            <div
                                key={site.id}
                                className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-6 hover:bg-white/10 hover:border-purple-500/50 transition-all"
                            >
                                {/* Header */}
                                <div className="flex items-start justify-between mb-6">
                                    <div className="flex items-start space-x-4">
                                        <div className="p-3 bg-gradient-to-br from-purple-600/20 to-pink-600/20 rounded-xl">
                                            <Globe className="w-6 h-6 text-purple-400" />
                                        </div>
                                        <div>
                                            <h3 className="text-xl font-bold text-white mb-1">{site.name}</h3>
                                            {site.domain && (
                                                <p className="text-sm text-gray-400 flex items-center space-x-1">
                                                    <ExternalLink className="w-3 h-3" />
                                                    <span>{site.domain}</span>
                                                </p>
                                            )}
                                        </div>
                                    </div>
                                    <span
                                        className={`px-3 py-1 text-xs rounded-full font-medium ${site.isActive
                                            ? 'bg-green-500/20 text-green-300 border border-green-500/30'
                                            : 'bg-gray-500/20 text-gray-400 border border-gray-500/30'
                                            }`}
                                    >
                                        {site.isActive ? 'Active' : 'Inactive'}
                                    </span>
                                </div>

                                {/* Site ID */}
                                <div className="mb-4 bg-gray-800/50 rounded-lg p-3">
                                    <label className="block text-xs font-medium text-gray-400 mb-1">Site ID</label>
                                    <div className="text-white font-mono text-sm">{site.siteId}</div>
                                </div>

                                {/* Actions */}
                                <div className="flex space-x-3 pt-4 border-t border-white/10">
                                    <Link
                                        href={`/dashboard/${site.siteId}`}
                                        className="flex-1 px-4 py-2 bg-gradient-to-r from-purple-600/20 to-pink-600/20 border border-purple-500/50 text-purple-300 rounded-lg hover:from-purple-600/30 hover:to-pink-600/30 transition-all font-medium text-center flex items-center justify-center space-x-2"
                                    >
                                        <span>View Dashboard</span>
                                        <ArrowRight className="w-4 h-4" />
                                    </Link>
                                    <Link
                                        href={`/dashboard/sites/${site.siteId}/settings`}
                                        className="px-4 py-2 bg-white/5 border border-white/10 text-gray-300 rounded-lg hover:bg-white/10 transition-all font-medium"
                                    >
                                        Settings
                                    </Link>
                                </div>
                            </div>
                        ))}
                    </div>
                )}

                {/* No Results */}
                {!loading && sites.length > 0 && filteredSites.length === 0 && (
                    <div className="text-center p-12">
                        <Filter className="w-16 h-16 text-gray-600 mx-auto mb-4" />
                        <h3 className="text-xl font-semibold text-white mb-2">No websites found</h3>
                        <p className="text-gray-400">
                            Try adjusting your search or filter criteria
                        </p>
                    </div>
                )}
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
