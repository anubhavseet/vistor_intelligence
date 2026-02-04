import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import AddWebsiteModal from '@/components/AddWebsiteModal'

import CrawlJobList from '@/components/CrawlJobList'
import { Globe, Zap, Search, Plus } from 'lucide-react'
import { useSites } from '@/hooks/use-sites'
import { useAuth } from '@/hooks/use-auth'
import { cn } from '@/lib/utils'

export default function CrawlingPage() {
    const navigate = useNavigate()
    const { isAuthenticated } = useAuth()

    const [selectedSite, setSelectedSite] = useState<string | null>(null)
    const [showAddModal, setShowAddModal] = useState(false)
    const [searchTerm, setSearchTerm] = useState('')

    const { sites, loading, error, refetch } = useSites()

    useEffect(() => {
        if (!isAuthenticated) {
            navigate('/')
        }
    }, [isAuthenticated, navigate])

    useEffect(() => {
        // Auto-select first site if available
        if (sites.length > 0 && !selectedSite) {
            setSelectedSite(sites[0].siteId)
        }
    }, [sites, selectedSite])

    if (!isAuthenticated) {
        return null
    }

    const filteredSites = sites.filter((site: any) =>
        site.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (site.domain || '').toLowerCase().includes(searchTerm.toLowerCase())
    )

    return (
        <div className="space-y-6">
            {/* Header */}
            <div>
                <h1 className="text-3xl font-bold tracking-tight">Website Crawling</h1>
                <p className="text-muted-foreground">
                    AI-powered content indexing for RAG.
                </p>
            </div>

            {/* Info Banner */}
            <div className="rounded-lg bg-blue-50/50 dark:bg-blue-500/10 border border-blue-200 dark:border-blue-900 p-4 flex gap-3">
                <Zap className="h-5 w-5 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
                <div>
                    <h3 className="text-sm font-medium text-blue-900 dark:text-blue-300">How it works</h3>
                    <ul className="mt-1 text-sm text-blue-800 dark:text-blue-400 list-disc pl-4 space-y-1">
                        <li>Select a website and start a crawl with configurable parameters.</li>
                        <li>Our AI crawler discovers pages, extracts content, and generates embeddings.</li>
                        <li>All content is indexed in Qdrant vector database for semantic search.</li>
                    </ul>
                </div>
            </div>

            {loading && !sites.length && (
                <div className="flex justify-center p-8">
                    <div className="h-6 w-6 animate-spin rounded-full border-b-2 border-primary"></div>
                </div>
            )}

            {error && (
                <div className="rounded-md bg-destructive/15 p-4 text-sm text-destructive">
                    Error loading sites: {error.message}
                </div>
            )}

            {!loading && sites.length === 0 && (
                <div className="rounded-lg border border-dashed bg-card p-12 text-center">
                    <Globe className="mx-auto mb-4 h-12 w-12 text-muted-foreground opacity-50" />
                    <h3 className="text-lg font-semibold">No websites registered</h3>
                    <p className="text-muted-foreground mb-4">
                        You need to add a website before you can start crawling.
                    </p>
                    <button
                        onClick={() => navigate('/dashboard/sites')}
                        className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
                    >
                        Add a Website
                    </button>
                </div>
            )}

            {!loading && sites.length > 0 && (
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Sites List */}
                    <div className="lg:col-span-1 space-y-4">
                        <div className="rounded-lg border bg-card shadow-sm p-4">
                            <div className="flex items-center justify-between mb-4">
                                <h3 className="font-semibold">Select Website</h3>
                                <button
                                    onClick={() => {
                                        if (selectedSite) {
                                            setShowAddModal(true)
                                        }
                                    }}
                                    disabled={!selectedSite}
                                    className="p-1.5 rounded-md hover:bg-accent text-muted-foreground hover:text-foreground disabled:opacity-50"
                                    title="Start new crawl"
                                >
                                    <Plus className="w-4 h-4" />
                                </button>
                            </div>

                            {/* Search */}
                            <div className="relative mb-4">
                                <Search className="w-4 h-4 text-muted-foreground absolute left-3 top-1/2 -translate-y-1/2" />
                                <input
                                    type="text"
                                    placeholder="Search sites..."
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    className="w-full pl-9 pr-4 py-2 text-sm rounded-md border border-input bg-transparent placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                                />
                            </div>

                            {/* Sites List */}
                            <div className="space-y-1 max-h-[400px] overflow-y-auto">
                                {filteredSites.map((site: any) => (
                                    <button
                                        key={site.id}
                                        onClick={() => setSelectedSite(site.siteId)}
                                        className={cn(
                                            "w-full text-left p-3 rounded-md transition-colors text-sm",
                                            selectedSite === site.siteId
                                                ? "bg-primary/10 text-primary font-medium"
                                                : "hover:bg-accent hover:text-accent-foreground"
                                        )}
                                    >
                                        <div className="flex items-center justify-between">
                                            <span>{site.name}</span>
                                            {site.isActive && (
                                                <span className="h-1.5 w-1.5 rounded-full bg-green-500" />
                                            )}
                                        </div>
                                        {site.domain && (
                                            <p className="text-xs text-muted-foreground mt-0.5 truncate">{site.domain}</p>
                                        )}
                                    </button>
                                ))}
                            </div>

                            {filteredSites.length === 0 && (
                                <div className="text-center p-4 text-muted-foreground text-sm">
                                    No sites found
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Crawl Jobs Panel */}
                    <div className="lg:col-span-2">
                        <div className="rounded-lg border bg-card shadow-sm p-6 min-h-[500px]">
                            <div className="flex items-center justify-between mb-6">
                                <div>
                                    <h3 className="text-lg font-semibold">Crawl Jobs</h3>
                                    <p className="text-sm text-muted-foreground">
                                        Monitor your website crawling progress
                                    </p>
                                </div>
                                {selectedSite && (
                                    <button
                                        onClick={() => setShowAddModal(true)}
                                        className="rounded-md bg-primary px-3 py-1.5 text-sm font-medium text-primary-foreground hover:bg-primary/90 flex items-center gap-2"
                                    >
                                        <Zap className="w-3.5 h-3.5" />
                                        <span>New Crawl</span>
                                    </button>
                                )}
                            </div>

                            {selectedSite ? (
                                <CrawlJobList siteId={selectedSite} />
                            ) : (
                                <div className="flex flex-col items-center justify-center h-64 text-center">
                                    <Globe className="w-10 h-10 text-muted-foreground mb-4 opacity-50" />
                                    <p className="text-muted-foreground">Select a website to view crawl jobs</p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}

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
        </div>
    )
}
