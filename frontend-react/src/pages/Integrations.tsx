import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '@/hooks/use-auth'
import { Webhook, Key, Copy, Check, ExternalLink, Plus } from 'lucide-react'
import { cn } from '@/lib/utils'

export default function IntegrationsPage() {
    const navigate = useNavigate()
    const { isAuthenticated } = useAuth()
    const [copiedId, setCopiedId] = useState<string | null>(null)

    useEffect(() => {
        if (!isAuthenticated) {
            navigate('/')
        }
    }, [isAuthenticated, navigate])

    if (!isAuthenticated) {
        return null
    }

    const handleCopy = (text: string, id: string) => {
        navigator.clipboard.writeText(text)
        setCopiedId(id)
        setTimeout(() => setCopiedId(null), 2000)
    }

    const apiEndpoints = [
        {
            name: 'GraphQL Endpoint',
            url: 'https://api.visitorintel.com/graphql',
            method: 'POST',
            description: 'Main GraphQL API endpoint for all queries and mutations'
        },
        {
            name: 'Webhook Receiver',
            url: 'https://api.visitorintel.com/webhooks',
            method: 'POST',
            description: 'Receive webhooks for events like visitor identification'
        },
        {
            name: 'REST API',
            url: 'https://api.visitorintel.com/v1',
            method: 'GET/POST',
            description: 'RESTful endpoints for common operations'
        }]

    const webhookEvents = [
        { name: 'visitor.identified', description: 'Triggered when a visitor is identified' },
        { name: 'account.detected', description: 'Triggered when an account is detected' },
        { name: 'intent.high', description: 'Triggered when high intent is detected' },
        { name: 'crawl.completed', description: 'Triggered when a crawl job completes' }]

    return (
        <div className="space-y-6">
            {/* Header */}
            <div>
                <h1 className="text-3xl font-bold tracking-tight">API & Webhooks</h1>
                <p className="text-muted-foreground">
                    Integrate with external tools and services.
                </p>
            </div>

            {/* API Keys Section */}
            <div className="rounded-lg border bg-card text-card-foreground shadow-sm p-6">
                <div className="flex items-center justify-between mb-6">
                    <div>
                        <h2 className="text-lg font-semibold">API Keys</h2>
                        <p className="text-sm text-muted-foreground">
                            Manage your API keys for authentication
                        </p>
                    </div>
                    <button className="inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 bg-primary text-primary-foreground shadow hover:bg-primary/90 h-9 px-4 py-2">
                        <Plus className="mr-2 h-4 w-4" />
                        Generate New Key
                    </button>
                </div>

                <div className="space-y-4">
                    <div className="rounded-md border p-4 bg-muted/50">
                        <div className="flex items-start justify-between mb-4">
                            <div>
                                <div className="flex items-center space-x-2 mb-1">
                                    <Key className="w-4 h-4 text-primary" />
                                    <h3 className="font-medium">Production Key</h3>
                                </div>
                                <p className="text-xs text-muted-foreground">Created on Jan 15, 2026 • Last used 2 hours ago</p>
                            </div>
                            <span className="inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 border-transparent bg-green-500/15 text-green-700 dark:text-green-400">
                                Active
                            </span>
                        </div>

                        <div className="flex items-center space-x-3">
                            <div className="flex-1 rounded-md border bg-background px-3 py-2 font-mono text-xs text-muted-foreground">
                                sk_live_••••••••••••••••••••••••1234
                            </div>
                            <button
                                onClick={() => handleCopy('sk_live_1234567890abcdef', 'prod')}
                                className="inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 border border-input bg-background shadow-sm hover:bg-accent hover:text-accent-foreground h-9 px-3"
                            >
                                {copiedId === 'prod' ? (
                                    <Check className="w-4 h-4 text-green-500" />
                                ) : (
                                    <Copy className="w-4 h-4 text-muted-foreground" />
                                )}
                            </button>
                            <button className="inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 border border-input bg-background shadow-sm hover:bg-destructive/10 hover:text-destructive h-9 px-3 text-destructive">
                                Revoke
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            {/* API Endpoints */}
            <div className="rounded-lg border bg-card text-card-foreground shadow-sm p-6">
                <h2 className="text-lg font-semibold mb-6">API Endpoints</h2>
                <div className="space-y-4">
                    {apiEndpoints.map((endpoint, idx) => (
                        <div key={idx} className="rounded-md border p-4 bg-gray-50 dark:bg-muted/50">
                            <div className="flex items-start justify-between mb-3">
                                <div>
                                    <h3 className="font-medium mb-1 text-foreground">{endpoint.name}</h3>
                                    <p className="text-sm text-muted-foreground mb-3">{endpoint.description}</p>
                                </div>
                                <span className={cn(
                                    "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 border-transparent",
                                    "bg-blue-100 text-blue-800 dark:bg-blue-500/15 dark:text-blue-400"
                                )}>
                                    {endpoint.method}
                                </span>
                            </div>
                            <div className="flex items-center space-x-3">
                                <div className="flex-1 rounded-md border bg-white dark:bg-background px-3 py-2 font-mono text-xs text-foreground">
                                    {endpoint.url}
                                </div>
                                <button
                                    onClick={() => handleCopy(endpoint.url, `endpoint-${idx}`)}
                                    className="inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 border border-input bg-background shadow-sm hover:bg-accent hover:text-accent-foreground h-9 px-3"
                                >
                                    {copiedId === `endpoint-${idx}` ? (
                                        <Check className="w-4 h-4 text-green-600 dark:text-green-500" />
                                    ) : (
                                        <Copy className="w-4 h-4 text-muted-foreground" />
                                    )}
                                </button>
                            </div>
                        </div>
                    ))}
                </div>

                <div className="mt-6">
                    <a
                        href="https://docs.visitorintel.com/api"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 text-primary hover:text-primary/80"
                    >
                        <span>View Full API Documentation</span>
                        <ExternalLink className="ml-2 w-4 h-4" />
                    </a>
                </div>
            </div>

            {/* Webhooks */}
            <div className="rounded-lg border bg-card text-card-foreground shadow-sm p-6">
                <div className="flex items-center justify-between mb-6">
                    <div>
                        <h2 className="text-lg font-semibold">Webhooks</h2>
                        <p className="text-sm text-muted-foreground">
                            Configure webhooks to receive real-time events
                        </p>
                    </div>
                    <button className="inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 bg-secondary text-secondary-foreground shadow-sm hover:bg-secondary/80 h-9 px-4 py-2">
                        <Plus className="mr-2 h-4 w-4" />
                        Add Webhook
                    </button>
                </div>

                {/* Available Events */}
                <div className="mb-6">
                    <h3 className="text-sm font-semibold mb-4">Available Events</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {webhookEvents.map((event, idx) => (
                            <div key={idx} className="rounded-md border p-3 bg-muted/30">
                                <div className="font-mono text-xs text-primary mb-1">{event.name}</div>
                                <div className="text-xs text-muted-foreground">{event.description}</div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* No Webhooks State */}
                <div className="rounded-lg border border-dashed p-12 text-center">
                    <Webhook className="mx-auto mb-4 h-12 w-12 text-muted-foreground opacity-50" />
                    <h3 className="text-lg font-semibold">No webhooks configured</h3>
                    <p className="text-muted-foreground mb-6">
                        Add a webhook URL to start receiving real-time event notifications
                    </p>
                    <button className="inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 bg-primary text-primary-foreground shadow hover:bg-primary/90 h-9 px-4 py-2">
                        Configure Your First Webhook
                    </button>
                </div>
            </div>
        </div>
    )
}
