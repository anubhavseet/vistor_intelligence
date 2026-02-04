'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuthStore } from '@/lib/auth-store'
import DashboardLayout from '@/components/DashboardLayout'
import { Webhook, Key, Copy, Check, ExternalLink, Plus } from 'lucide-react'

export default function IntegrationsPage() {
    const router = useRouter()
    const isAuthenticated = useAuthStore((state) => state.isAuthenticated)
    const [copiedId, setCopiedId] = useState<string | null>(null)

    useEffect(() => {
        if (!isAuthenticated()) {
            router.push('/')
        }
    }, [isAuthenticated, router])

    if (!isAuthenticated()) {
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
        },
    ]

    const webhookEvents = [
        { name: 'visitor.identified', description: 'Triggered when a visitor is identified' },
        { name: 'account.detected', description: 'Triggered when an account is detected' },
        { name: 'intent.high', description: 'Triggered when high intent is detected' },
        { name: 'crawl.completed', description: 'Triggered when a crawl job completes' },
    ]

    return (
        <DashboardLayout>
            <div className="p-8 max-w-7xl mx-auto">
                {/* Header */}
                <div className="mb-8">
                    <div className="flex items-center space-x-3 mb-2">
                        <div className="p-3 bg-gradient-to-br from-blue-600 to-cyan-600 rounded-xl shadow-lg">
                            <Webhook className="w-8 h-8 text-white" />
                        </div>
                        <div>
                            <h1 className="text-4xl font-bold text-white">API & Webhooks</h1>
                            <p className="text-gray-300 text-lg">
                                Integrate with external tools and services
                            </p>
                        </div>
                    </div>
                </div>

                {/* API Keys Section */}
                <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-6 mb-8">
                    <div className="flex items-center justify-between mb-6">
                        <div>
                            <h2 className="text-2xl font-bold text-white mb-1">API Keys</h2>
                            <p className="text-sm text-gray-400">
                                Manage your API keys for authentication
                            </p>
                        </div>
                        <button className="px-4 py-2 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-lg hover:from-purple-700 hover:to-pink-700 transition-all font-medium flex items-center space-x-2">
                            <Plus className="w-4 h-4" />
                            <span>Generate New Key</span>
                        </button>
                    </div>

                    <div className="space-y-4">
                        <div className="bg-gray-800/50 rounded-xl p-6 border border-white/10">
                            <div className="flex items-start justify-between mb-4">
                                <div>
                                    <div className="flex items-center space-x-2 mb-2">
                                        <Key className="w-5 h-5 text-purple-400" />
                                        <h3 className="text-lg font-semibold text-white">Production Key</h3>
                                    </div>
                                    <p className="text-sm text-gray-400">Created on Jan 15, 2026 • Last used 2 hours ago</p>
                                </div>
                                <span className="px-3 py-1 text-xs font-medium rounded-full bg-green-500/20 text-green-300 border border-green-500/30">
                                    Active
                                </span>
                            </div>

                            <div className="flex items-center space-x-3">
                                <div className="flex-1 bg-gray-900 border border-gray-700 rounded-lg px-4 py-3 font-mono text-sm text-gray-300">
                                    sk_live_••••••••••••••••••••••••1234
                                </div>
                                <button
                                    onClick={() => handleCopy('sk_live_1234567890abcdef', 'prod')}
                                    className="px-4 py-3 bg-white/5 border border-white/10 rounded-lg hover:bg-white/10 transition-all"
                                >
                                    {copiedId === 'prod' ? (
                                        <Check className="w-5 h-5 text-green-400" />
                                    ) : (
                                        <Copy className="w-5 h-5 text-gray-400" />
                                    )}
                                </button>
                                <button className="px-4 py-3 bg-red-500/10 border border-red-500/30 text-red-400 rounded-lg hover:bg-red-500/20 transition-all">
                                    Revoke
                                </button>
                            </div>
                        </div>
                    </div>
                </div>

                {/* API Endpoints */}
                <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-6 mb-8">
                    <h2 className="text-2xl font-bold text-white mb-6">API Endpoints</h2>
                    <div className="space-y-4">
                        {apiEndpoints.map((endpoint, idx) => (
                            <div key={idx} className="bg-gray-800/50 rounded-xl p-6 border border-white/10">
                                <div className="flex items-start justify-between mb-3">
                                    <div>
                                        <h3 className="text-lg font-semibold text-white mb-2">{endpoint.name}</h3>
                                        <p className="text-sm text-gray-400 mb-3">{endpoint.description}</p>
                                    </div>
                                    <span className="px-3 py-1 text-xs font-medium rounded-lg bg-blue-500/20 text-blue-300 border border-blue-500/30">
                                        {endpoint.method}
                                    </span>
                                </div>
                                <div className="flex items-center space-x-3">
                                    <div className="flex-1 bg-gray-900 border border-gray-700 rounded-lg px-4 py-3 font-mono text-sm text-gray-300">
                                        {endpoint.url}
                                    </div>
                                    <button
                                        onClick={() => handleCopy(endpoint.url, `endpoint-${idx}`)}
                                        className="px-4 py-3 bg-white/5 border border-white/10 rounded-lg hover:bg-white/10 transition-all"
                                    >
                                        {copiedId === `endpoint-${idx}` ? (
                                            <Check className="w-5 h-5 text-green-400" />
                                        ) : (
                                            <Copy className="w-5 h-5 text-gray-400" />
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
                            className="inline-flex items-center space-x-2 px-4 py-2 bg-gradient-to-r from-purple-600/20 to-pink-600/20 border border-purple-500/50 text-purple-300 rounded-lg hover:from-purple-600/30 hover:to-pink-600/30 transition-all"
                        >
                            <span>View Full API Documentation</span>
                            <ExternalLink className="w-4 h-4" />
                        </a>
                    </div>
                </div>

                {/* Webhooks */}
                <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-6">
                    <div className="flex items-center justify-between mb-6">
                        <div>
                            <h2 className="text-2xl font-bold text-white mb-1">Webhooks</h2>
                            <p className="text-sm text-gray-400">
                                Configure webhooks to receive real-time events
                            </p>
                        </div>
                        <button className="px-4 py-2 bg-gradient-to-r from-blue-600 to-cyan-600 text-white rounded-lg hover:from-blue-700 hover:to-cyan-700 transition-all font-medium flex items-center space-x-2">
                            <Plus className="w-4 h-4" />
                            <span>Add Webhook</span>
                        </button>
                    </div>

                    {/* Available Events */}
                    <div className="mb-6">
                        <h3 className="text-lg font-semibold text-white mb-4">Available Events</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {webhookEvents.map((event, idx) => (
                                <div key={idx} className="bg-gray-800/50 rounded-lg p-4 border border-white/10">
                                    <div className="font-mono text-sm text-purple-400 mb-1">{event.name}</div>
                                    <div className="text-xs text-gray-400">{event.description}</div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* No Webhooks State */}
                    <div className="bg-gray-800/30 rounded-xl p-12 text-center border border-dashed border-white/20">
                        <Webhook className="w-16 h-16 text-gray-600 mx-auto mb-4" />
                        <h3 className="text-xl font-semibold text-white mb-2">No webhooks configured</h3>
                        <p className="text-gray-400 mb-6">
                            Add a webhook URL to start receiving real-time event notifications
                        </p>
                        <button className="px-6 py-3 bg-gradient-to-r from-blue-600 to-cyan-600 text-white rounded-xl hover:from-blue-700 hover:to-cyan-700 transition-all font-medium shadow-lg">
                            Configure Your First Webhook
                        </button>
                    </div>
                </div>
            </div>
        </DashboardLayout>
    )
}
