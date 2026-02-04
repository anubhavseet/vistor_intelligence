'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useQuery } from '@apollo/client'
import { useAuthStore } from '@/lib/auth-store'
import DashboardLayout from '@/components/DashboardLayout'
import AddWebsiteModal from '@/components/AddWebsiteModal'
import CrawlJobList from '@/components/CrawlJobList'
import { Globe, Zap, Search, Filter } from 'lucide-react'
import { GET_SITES, type GetSitesResponse } from '@/lib/graphql/site-operations'

export default function CrawlingPage() {
    const router = useRouter()
    const isAuthenticated = useAuthStore((state) => state.isAuthenticated)

    const [selectedSite, setSelectedSite] = useState<string | null>(null)
    const [showAddModal, setShowAddModal] = useState(false)
    const [searchTerm, setSearchTerm] = useState('')

    const { data, loading, error, refetch } = useQuery(GET_SITES, {
        skip: !isAuthenticated(),
    })

    useEffect(() => {
        if (!isAuthenticated()) {
            router.push('/')
        }
    }, [isAuthenticated, router])

    useEffect(() => {
        // Auto-select first site if available
        if (data?.getSites?.length > 0 && !selectedSite) {
            setSelectedSite(data.getSites[0].siteId)
        }
    }, [data, selectedSite])

    if (!isAuthenticated()) {
        return null
    }

    const sites = data?.getSites || []
    const filteredSites = sites.filter((site: any) =>
        site.name.toLowerCase().includes(searchTerm.toLowerCase())
    )

    return (
        <DashboardLayout currentSiteId={selectedSite || undefined}>
            <div className="p-8 max-w-7xl mx-auto">
                {/* Header */}
                <div className="mb-8">
                    <div className="flex items-center space-x-3 mb-2">
                        <div className="p-3 bg-gradient-to-br from-blue-600 to-cyan-600 rounded-xl shadow-lg">
                            <Zap className="w-8 h-8 text-white" />
                        </div>
                        <div>
                            <h1 className="text-4xl font-bold text-white">Website Crawling</h1>
                            <p className="text-gray-300 text-lg">
                                AI-powered content indexing for RAG
                            </p>
                        </div>
                    </div>
                </div>

                {/* Info Banner */}
                <div className="bg-gradient-to-r from-blue-900/30 to-cyan-900/30 border border-blue-500/30 rounded-2xl p-6 mb-8">
                    <div className="flex items-start space-x-4">
                        <Zap className="w-6 h-6 text-blue-400 mt-1" />
                        <div>
                            <h3 className="text-lg font-bold text-white mb-2">How it works</h3>
                            <ul className="text-sm text-gray-300 space-y-2">
                                <li>• Select a website and start a crawl with configurable parameters</li>
                                <li>• Our AI crawler discovers pages, extracts content, and generates embeddings</li>
                                <li>• All content is indexed in Qdrant vector database for semantic search</li>
                                <li>• Use the crawled data for RAG (Retrieval-Augmented Generation)</li>
                                <li>• Monitor real-time progress with live updates</li>
                            </ul>
                        </div>
                    </div>
                </div>

                {loading && (
                    <div className="text-center p-12 text-gray-400">
                        Loading websites...
                    </div>
                )}

                {error && (
                    <div className="bg-red-900/20 border border-red-500/30 text-red-300 px-4 py-3 rounded-lg mb-8">
                        Error: {error.message}
                    </div>
                )}

                {!loading && sites.length === 0 && (
                    <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-12 text-center">
                        <Globe className="w-20 h-20 text-gray-600 mx-auto mb-6" />
                        <h3 className="text-2xl font-bold text-white mb-3">No websites registered</h3>
                        <p className="text-gray-400 mb-8 max-w-md mx-auto">
                            You need to add a website before you can start crawling
                        </p>
                        <button
                            onClick={() => router.push('/dashboard/sites')}
                            className="px-8 py-4 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-xl hover:from-purple-700 hover:to-pink-700 transition-all font-medium shadow-lg shadow-purple-500/30 text-lg"
                        >
                            Add a Website
                        </button>
                    </div>
                )}

                {!loading && sites.length > 0 && (
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                        {/* Sites List */}
                        <div className="lg:col-span-1 space-y-4">
                            <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-6">
                                <div className="flex items-center justify-between mb-4">
                                    <h3 className="text-xl font-bold text-white">Select Website</h3>
                                    <button
                                        onClick={() => {
                                            if (selectedSite) {
                                                setShowAddModal(true)
                                            }
                                        }}
                                        className="p-2 bg-gradient-to-r from-purple-600 to-pink-600 rounded-lg hover:from-purple-700 hover:to-pink-700 transition-all shadow-lg shadow-purple-500/30"
                                        title="Start new crawl"
                                    >
                                        <Zap className="w-5 h-5 text-white" />
                                    </button>
                                </div>

                                {/* Search */}
                                <div className="relative mb-4">
                                    <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
                                    <input
                                        type="text"
                                        placeholder="Search sites..."
                                        value={searchTerm}
                                        onChange={(e) => setSearchTerm(e.target.value)}
                                        className="w-full pl-10 pr-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500 text-sm"
                                    />
                                </div>

                                {/* Sites List */}
                                <div className="space-y-2 max-h-96 overflow-y-auto">
                                    {filteredSites.map((site: any) => (
                                        <button
                                            key={site.id}
                                            onClick={() => setSelectedSite(site.siteId)}
                                            className={`w-full text-left p-4 rounded-xl transition-all ${selectedSite === site.siteId
                                                ? 'bg-gradient-to-r from-purple-600/20 to-pink-600/20 border-2 border-purple-500'
                                                : 'bg-gray-800/50 border border-gray-700 hover:bg-gray-800'
                                                }`}
                                        >
                                            <div className="flex items-start justify-between mb-2">
                                                <h4 className="font-semibold text-white text-sm">{site.name}</h4>
                                                <span
                                                    className={`px-2 py-0.5 text-xs rounded-full ${site.isActive
                                                        ? 'bg-green-500/20 text-green-300'
                                                        : 'bg-gray-500/20 text-gray-400'
                                                        }`}
                                                >
                                                    {site.isActive ? 'Active' : 'Inactive'}
                                                </span>
                                            </div>
                                            {site.domain && (
                                                <p className="text-xs text-gray-400">{site.domain}</p>
                                            )}
                                        </button>
                                    ))}
                                </div>

                                {filteredSites.length === 0 && (
                                    <div className="text-center p-8 text-gray-400 text-sm">
                                        No sites found
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Crawl Jobs Panel */}
                        <div className="lg:col-span-2">
                            <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-6">
                                <div className="flex items-center justify-between mb-6">
                                    <div>
                                        <h3 className="text-2xl font-bold text-white mb-1">Crawl Jobs</h3>
                                        <p className="text-sm text-gray-400">
                                            Monitor your website crawling progress
                                        </p>
                                    </div>
                                    {selectedSite && (
                                        <button
                                            onClick={() => setShowAddModal(true)}
                                            className="px-4 py-2 bg-gradient-to-r from-blue-600 to-cyan-600 text-white rounded-lg hover:from-blue-700 hover:to-cyan-700 transition-all font-medium flex items-center space-x-2 shadow-lg"
                                        >
                                            <Zap className="w-4 h-4" />
                                            <span>New Crawl</span>
                                        </button>
                                    )}
                                </div>

                                {selectedSite ? (
                                    <CrawlJobList siteId={selectedSite} />
                                ) : (
                                    <div className="text-center p-12">
                                        <Globe className="w-16 h-16 text-gray-600 mx-auto mb-4" />
                                        <p className="text-gray-400">Select a website to view crawl jobs</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                )}
            </div>

            {/* Add Crawl Modal */}
            {selectedSite && (
                <AddWebsiteModal
                    isOpen={showAddModal}
                    onClose={() => setShowAddModal(false)}
                    siteId={selectedSite}
                    onSuccess={() => {
                        refetch()
                    }}
                />
            )}
        </DashboardLayout>
    )
}
