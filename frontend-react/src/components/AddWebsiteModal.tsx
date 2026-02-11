import { useState } from 'react'
import { X, Loader2, Zap, AlertCircle } from 'lucide-react'
import { useCrawler } from '@/hooks/use-crawler'
import { cn } from '@/lib/utils'

interface AddWebsiteModalProps {
    isOpen: boolean
    onClose: () => void
    siteId: string
    onSuccess: () => void
}

// NOTE: This component is actually "Start Crawl Modal"
export default function AddWebsiteModal({ isOpen, onClose, siteId, onSuccess }: AddWebsiteModalProps) {
    const [url, setUrl] = useState('')
    const [maxPages, setMaxPages] = useState(50)
    const [maxDepth, setMaxDepth] = useState(3)
    const [sameDomainOnly, setSameDomainOnly] = useState(true)

    const { startCrawl, starting: loading, error } = useCrawler(siteId)

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()

        try {
            await startCrawl({
                startUrl: url,
                maxPages: parseInt(maxPages.toString()),
                maxDepth: parseInt(maxDepth.toString()),
                sameDomainOnly,
            })
            onSuccess()
            onClose()
            setUrl('')
        } catch (err) {
            console.error('Failed to start crawl:', err)
        }
    }

    if (!isOpen) return null

    return (
        <div className="fixed inset-0 bg-background/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-card text-card-foreground rounded-xl shadow-lg max-w-2xl w-full border border-border overflow-hidden">
                {/* Header */}
                <div className="border-b p-6 flex justify-between items-center">
                    <div className="flex items-center space-x-3">
                        <div className="p-2 bg-primary/10 rounded-lg">
                            <Zap className="w-6 h-6 text-primary" />
                        </div>
                        <div>
                            <h2 className="text-xl font-bold">Start New Crawl</h2>
                            <p className="text-muted-foreground text-sm">AI-powered content indexing</p>
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 hover:bg-accent hover:text-accent-foreground rounded-lg transition-colors"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-6 space-y-6">
                    {/* URL Input */}
                    <div>
                        <label className="block text-sm font-medium mb-2">
                            Starting URL
                        </label>
                        <input
                            type="url"
                            value={url}
                            onChange={(e) => setUrl(e.target.value)}
                            placeholder="https://example.com"
                            required
                            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                        />
                        <p className="mt-2 text-xs text-muted-foreground">
                            Enter the starting URL. Our AI will discover and crawl linked pages.
                        </p>
                    </div>

                    {/* Configuration Grid */}
                    <div className="grid md:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium mb-2">
                                Max Pages
                            </label>
                            <input
                                type="number"
                                value={maxPages}
                                onChange={(e) => setMaxPages(parseInt(e.target.value))}
                                min="1"
                                max="500"
                                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                            />
                            <p className="mt-1 text-xs text-muted-foreground">1-500 pages</p>
                        </div>

                        <div>
                            <label className="block text-sm font-medium mb-2">
                                Max Depth
                            </label>
                            <input
                                type="number"
                                value={maxDepth}
                                onChange={(e) => setMaxDepth(parseInt(e.target.value))}
                                min="1"
                                max="10"
                                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                            />
                            <p className="mt-1 text-xs text-muted-foreground">1-10 levels</p>
                        </div>
                    </div>

                    {/* Same Domain Toggle */}
                    <div className="flex items-center justify-between p-4 bg-muted/30 border rounded-lg">
                        <div>
                            <h4 className="text-sm font-medium">Same Domain Only</h4>
                            <p className="text-xs text-muted-foreground mt-1">
                                Only crawl pages from the same domain
                            </p>
                        </div>
                        <button
                            type="button"
                            onClick={() => setSameDomainOnly(!sameDomainOnly)}
                            className={cn(
                                "relative inline-flex h-6 w-11 items-center rounded-full transition-colors",
                                sameDomainOnly ? 'bg-primary' : 'bg-muted-foreground'
                            )}
                        >
                            <span
                                className={cn(
                                    "inline-block h-4 w-4 transform rounded-full bg-white transition-transform",
                                    sameDomainOnly ? 'translate-x-6' : 'translate-x-1'
                                )}
                            />
                        </button>
                    </div>

                    {/* Feature Info */}
                    <div className="bg-primary/5 border border-primary/20 rounded-lg p-4 space-y-2">
                        <div className="flex items-center space-x-2">
                            <Zap className="w-4 h-4 text-primary" />
                            <span className="text-sm font-medium">Powered by AI & RAG</span>
                        </div>
                        <ul className="text-xs text-muted-foreground space-y-1 ml-6 list-disc">
                            <li>Extracts and indexes HTML content to Qdrant vector database</li>
                            <li>AI-generated embeddings for semantic search</li>
                            <li>Non-blocking background processing with BullMQ</li>
                            <li>Real-time progress tracking</li>
                        </ul>
                    </div>

                    {/* Error Display */}
                    {error && (
                        <div className="p-4 bg-destructive/10 border border-destructive/20 rounded-lg flex items-start space-x-3">
                            <AlertCircle className="w-5 h-5 text-destructive mt-0.5" />
                            <div className="flex-1">
                                <h4 className="text-sm font-medium text-destructive">Error</h4>
                                <p className="text-xs text-destructive/80 mt-1">{error.message}</p>
                            </div>
                        </div>
                    )}

                    {/* Actions */}
                    <div className="flex justify-end space-x-4 pt-4">
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-4 py-2 text-sm font-medium hover:bg-accent hover:text-accent-foreground rounded-md transition-colors"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={loading || !url}
                            className="flex items-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
                        >
                            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            {loading ? 'Starting...' : 'Start Crawling'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    )
}
