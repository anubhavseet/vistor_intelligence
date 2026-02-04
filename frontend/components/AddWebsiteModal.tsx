'use client'

import { useState } from 'react'
import { gql, useMutation, useQuery } from '@apollo/client'
import { Globe, Plus, X, Loader2, CheckCircle, AlertCircle, Zap } from 'lucide-react'

const START_CRAWL = gql`
  mutation StartWebsiteCrawl($input: StartCrawlInput!) {
    startWebsiteCrawl(input: $input) {
      jobId
      siteId
      status
      pagesDiscovered
      pagesCrawled
    }
  }
`

const GET_SITE_CRAWL_JOBS = gql`
  query GetSiteCrawlJobs($siteId: String!) {
    getSiteCrawlJobs(siteId: $siteId) {
      jobId
      siteId
      status
      pagesDiscovered
      pagesCrawled
      pagesFailed
      startedAt
      completedAt
      error
    }
  }
`

interface AddWebsiteModalProps {
    isOpen: boolean
    onClose: () => void
    siteId: string
    onSuccess: () => void
}

export default function AddWebsiteModal({ isOpen, onClose, siteId, onSuccess }: AddWebsiteModalProps) {
    const [url, setUrl] = useState('')
    const [maxPages, setMaxPages] = useState(50)
    const [maxDepth, setMaxDepth] = useState(3)
    const [sameDomainOnly, setSameDomainOnly] = useState(true)

    const [startCrawl, { loading, error }] = useMutation(START_CRAWL, {
        onCompleted: () => {
            onSuccess()
            onClose()
            setUrl('')
        },
    })

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()

        await startCrawl({
            variables: {
                input: {
                    siteId,
                    startUrl: url,
                    maxPages: parseInt(maxPages.toString()),
                    maxDepth: parseInt(maxDepth.toString()),
                    sameDomainOnly,
                },
            },
        })
    }

    if (!isOpen) return null

    return (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-gradient-to-br from-gray-900 to-gray-800 rounded-2xl shadow-2xl max-w-2xl w-full border border-gray-700 overflow-hidden">
                {/* Header */}
                <div className="bg-gradient-to-r from-purple-600 to-pink-600 p-6 flex justify-between items-center">
                    <div className="flex items-center space-x-3">
                        <div className="p-2 bg-white/20 rounded-lg">
                            <Globe className="w-6 h-6 text-white" />
                        </div>
                        <div>
                            <h2 className="text-2xl font-bold text-white">Crawl Website</h2>
                            <p className="text-purple-100 text-sm">AI-powered content indexing</p>
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 hover:bg-white/20 rounded-lg transition-colors"
                    >
                        <X className="w-6 h-6 text-white" />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-6 space-y-6">
                    {/* URL Input */}
                    <div>
                        <label className="block text-sm font-medium text-gray-300 mb-2">
                            Website URL
                        </label>
                        <input
                            type="url"
                            value={url}
                            onChange={(e) => setUrl(e.target.value)}
                            placeholder="https://example.com"
                            required
                            className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
                        />
                        <p className="mt-2 text-xs text-gray-400">
                            Enter the starting URL. Our AI will discover and crawl linked pages.
                        </p>
                    </div>

                    {/* Configuration Grid */}
                    <div className="grid md:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-300 mb-2">
                                Max Pages
                            </label>
                            <input
                                type="number"
                                value={maxPages}
                                onChange={(e) => setMaxPages(parseInt(e.target.value))}
                                min="1"
                                max="500"
                                className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
                            />
                            <p className="mt-1 text-xs text-gray-400">1-500 pages</p>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-300 mb-2">
                                Max Depth
                            </label>
                            <input
                                type="number"
                                value={maxDepth}
                                onChange={(e) => setMaxDepth(parseInt(e.target.value))}
                                min="1"
                                max="10"
                                className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
                            />
                            <p className="mt-1 text-xs text-gray-400">1-10 levels</p>
                        </div>
                    </div>

                    {/* Same Domain Toggle */}
                    <div className="flex items-center justify-between p-4 bg-gray-800 border border-gray-700 rounded-xl">
                        <div>
                            <h4 className="text-sm font-medium text-white">Same Domain Only</h4>
                            <p className="text-xs text-gray-400 mt-1">
                                Only crawl pages from the same domain
                            </p>
                        </div>
                        <button
                            type="button"
                            onClick={() => setSameDomainOnly(!sameDomainOnly)}
                            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${sameDomainOnly ? 'bg-purple-600' : 'bg-gray-600'
                                }`}
                        >
                            <span
                                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${sameDomainOnly ? 'translate-x-6' : 'translate-x-1'
                                    }`}
                            />
                        </button>
                    </div>

                    {/* Feature Info */}
                    <div className="bg-gradient-to-r from-purple-900/30 to-pink-900/30 border border-purple-500/30 rounded-xl p-4 space-y-2">
                        <div className="flex items-center space-x-2">
                            <Zap className="w-4 h-4 text-yellow-400" />
                            <span className="text-sm font-medium text-white">Powered by AI & RAG</span>
                        </div>
                        <ul className="text-xs text-gray-300 space-y-1 ml-6 list-disc">
                            <li>Extracts and indexes HTML content to Qdrant vector database</li>
                            <li>AI-generated embeddings for semantic search</li>
                            <li>Non-blocking background processing with BullMQ</li>
                            <li>Real-time progress tracking</li>
                        </ul>
                    </div>

                    {/* Error Display */}
                    {error && (
                        <div className="p-4 bg-red-900/30 border border-red-500/50 rounded-xl flex items-start space-x-3">
                            <AlertCircle className="w-5 h-5 text-red-400 mt-0.5" />
                            <div className="flex-1">
                                <h4 className="text-sm font-medium text-red-300">Error</h4>
                                <p className="text-xs text-red-400 mt-1">{error.message}</p>
                            </div>
                        </div>
                    )}

                    {/* Actions */}
                    <div className="flex space-x-4 pt-4">
                        <button
                            type="button"
                            onClick={onClose}
                            className="flex-1 px-6 py-3 bg-gray-700 text-white rounded-xl hover:bg-gray-600 transition-colors font-medium"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={loading || !url}
                            className="flex-1 px-6 py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-xl hover:from-purple-700 hover:to-pink-700 transition-all font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2 shadow-lg shadow-purple-500/30"
                        >
                            {loading ? (
                                <>
                                    <Loader2 className="w-5 h-5 animate-spin" />
                                    <span>Starting Crawl...</span>
                                </>
                            ) : (
                                <>
                                    <Zap className="w-5 h-5" />
                                    <span>Start Crawling</span>
                                </>
                            )}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    )
}
