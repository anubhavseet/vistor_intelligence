import { useState } from 'react'
import { useQuery } from '@apollo/client/react'
import { motion } from 'framer-motion'
import {
    Webhook, Search, Globe, CheckCircle2, XCircle,
    ExternalLink, Clock, AlertTriangle,
    Zap, RefreshCw
} from 'lucide-react'
import {
    ADMIN_GET_ALL_SITES, ADMIN_GET_WEBHOOKS,
    AdminGetAllSitesResponse, AdminGetWebhooksResponse
} from '@/lib/graphql/admin-operations'

export default function AdminWebhooksPage() {
    const [selectedSiteId, setSelectedSiteId] = useState<string>('')
    const [search, setSearch] = useState('')

    const { data: sitesData, loading: sitesLoading } = useQuery<AdminGetAllSitesResponse>(ADMIN_GET_ALL_SITES)
    const { data: webhooksData, loading: webhooksLoading, refetch } = useQuery<AdminGetWebhooksResponse>(
        ADMIN_GET_WEBHOOKS,
        { variables: { siteId: selectedSiteId }, skip: !selectedSiteId }
    )

    const sites = sitesData?.adminGetAllSites || []
    const webhooks = webhooksData?.getWebhooks || []

    if (sites.length > 0 && !selectedSiteId) {
        setSelectedSiteId(sites[0].siteId)
    }

    const filtered = webhooks.filter(w =>
        w.url.toLowerCase().includes(search.toLowerCase()) ||
        w.eventType.toLowerCase().includes(search.toLowerCase())
    )

    const totalSuccess = webhooks.reduce((a, w) => a + w.successCount, 0)
    const totalFailure = webhooks.reduce((a, w) => a + w.failureCount, 0)
    const activeWebhooks = webhooks.filter(w => w.isActive).length

    return (
        <div className="space-y-6 max-w-[1400px]">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight">Webhook Management</h1>
                    <p className="text-sm text-gray-500 mt-1">Monitor and manage webhook configurations across sites</p>
                </div>
                <button
                    onClick={() => refetch()}
                    className="flex items-center gap-2 px-3 py-2 bg-white/[0.04] border border-white/[0.06] rounded-xl text-xs text-gray-400 hover:text-white hover:bg-white/[0.06] transition-all cursor-pointer"
                >
                    <RefreshCw className="w-3.5 h-3.5" />
                    Refresh
                </button>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                {[
                    { label: 'Total Webhooks', value: webhooks.length, icon: Webhook, color: 'text-blue-400', bgColor: 'bg-blue-500/10' },
                    { label: 'Active', value: activeWebhooks, icon: Zap, color: 'text-emerald-400', bgColor: 'bg-emerald-500/10' },
                    { label: 'Total Deliveries', value: totalSuccess, icon: CheckCircle2, color: 'text-green-400', bgColor: 'bg-green-500/10' },
                    { label: 'Total Failures', value: totalFailure, icon: AlertTriangle, color: 'text-red-400', bgColor: 'bg-red-500/10' },
                ].map(stat => (
                    <div key={stat.label} className="bg-[#0a0a0a] border border-white/[0.06] rounded-xl px-4 py-3.5 flex items-center gap-3">
                        <div className={`p-2 rounded-lg ${stat.bgColor}`}>
                            <stat.icon className={`w-4 h-4 ${stat.color}`} />
                        </div>
                        <div>
                            <p className="text-xs text-gray-500">{stat.label}</p>
                            <p className={`text-lg font-bold ${stat.color}`}>
                                {webhooksLoading ? <span className="inline-block w-6 h-5 bg-white/[0.04] rounded animate-pulse" /> : stat.value}
                            </p>
                        </div>
                    </div>
                ))}
            </div>

            {/* Site Selector */}
            <div className="flex items-center gap-3 overflow-x-auto pb-1 custom-scrollbar">
                {sitesLoading ? (
                    Array.from({ length: 3 }).map((_, i) => (
                        <div key={i} className="w-40 h-10 bg-white/[0.04] rounded-xl animate-pulse flex-shrink-0" />
                    ))
                ) : sites.map(site => (
                    <button
                        key={site.siteId}
                        onClick={() => setSelectedSiteId(site.siteId)}
                        className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-medium transition-all flex-shrink-0 cursor-pointer ${selectedSiteId === site.siteId
                            ? 'bg-red-500/10 text-red-400 border border-red-500/20'
                            : 'bg-[#0a0a0a] text-gray-500 border border-white/[0.06] hover:border-white/[0.1] hover:text-gray-300'
                            }`}
                    >
                        <Globe className="w-3.5 h-3.5" />
                        {site.name}
                    </button>
                ))}
            </div>

            {/* Search */}
            <div className="relative">
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                <input
                    type="text"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder="Search webhooks by URL or event type..."
                    className="w-full pl-10 pr-4 py-2.5 bg-[#0a0a0a] border border-white/[0.08] rounded-xl text-sm text-white placeholder-gray-600 focus:outline-none focus:border-red-500/30 transition-colors"
                />
            </div>

            {/* Webhooks List */}
            <div className="space-y-3">
                {webhooksLoading || !selectedSiteId ? (
                    Array.from({ length: 3 }).map((_, i) => (
                        <div key={i} className="bg-[#0a0a0a] border border-white/[0.06] rounded-2xl p-5 animate-pulse">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 bg-white/[0.04] rounded-xl" />
                                <div className="flex-1">
                                    <div className="w-48 h-4 bg-white/[0.04] rounded" />
                                    <div className="w-24 h-3 bg-white/[0.04] rounded mt-1.5" />
                                </div>
                            </div>
                        </div>
                    ))
                ) : filtered.length === 0 ? (
                    <div className="bg-[#0a0a0a] border border-white/[0.06] rounded-2xl py-16 text-center">
                        <Webhook className="w-10 h-10 mx-auto mb-3 text-gray-700" />
                        <p className="text-sm text-gray-500">No webhooks configured for this site</p>
                    </div>
                ) : filtered.map((webhook, i) => (
                    <motion.div
                        key={webhook.id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: i * 0.05 }}
                        className="bg-[#0a0a0a] border border-white/[0.06] rounded-2xl p-5 hover:border-white/[0.1] transition-all group"
                    >
                        <div className="flex items-start justify-between">
                            <div className="flex items-start gap-4">
                                <div className={`p-2.5 rounded-xl ${webhook.isActive ? 'bg-emerald-500/10' : 'bg-gray-500/10'}`}>
                                    <Webhook className={`w-5 h-5 ${webhook.isActive ? 'text-emerald-400' : 'text-gray-500'}`} />
                                </div>
                                <div>
                                    <div className="flex items-center gap-2">
                                        <p className="text-sm font-medium font-mono text-gray-200 break-all">{webhook.url}</p>
                                        <a href={webhook.url} target="_blank" rel="noopener noreferrer" className="text-gray-600 hover:text-blue-400 cursor-pointer">
                                            <ExternalLink className="w-3 h-3" />
                                        </a>
                                    </div>
                                    <div className="flex items-center gap-3 mt-2">
                                        <span className={`inline-flex items-center gap-1 text-[10px] font-medium px-2 py-0.5 rounded-full ${webhook.isActive
                                            ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                                            : 'bg-gray-500/10 text-gray-500 border border-gray-500/20'
                                            }`}>
                                            <span className={`w-1.5 h-1.5 rounded-full ${webhook.isActive ? 'bg-emerald-400' : 'bg-gray-500'}`} />
                                            {webhook.isActive ? 'Active' : 'Inactive'}
                                        </span>
                                        <span className="text-[10px] text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded-full border border-amber-500/20 font-medium">
                                            {webhook.eventType}
                                        </span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Stats row */}
                        <div className="mt-4 pt-3 border-t border-white/[0.04] grid grid-cols-3 gap-3">
                            <div className="flex items-center gap-2">
                                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                                <div>
                                    <p className="text-[10px] text-gray-600">Success</p>
                                    <p className="text-sm font-bold text-emerald-400">{webhook.successCount}</p>
                                </div>
                            </div>
                            <div className="flex items-center gap-2">
                                <XCircle className="w-3.5 h-3.5 text-red-400" />
                                <div>
                                    <p className="text-[10px] text-gray-600">Failures</p>
                                    <p className="text-sm font-bold text-red-400">{webhook.failureCount}</p>
                                </div>
                            </div>
                            <div className="flex items-center gap-2">
                                <Clock className="w-3.5 h-3.5 text-gray-500" />
                                <div>
                                    <p className="text-[10px] text-gray-600">Last Triggered</p>
                                    <p className="text-xs font-mono text-gray-400">
                                        {webhook.lastTriggeredAt ? new Date(webhook.lastTriggeredAt).toLocaleDateString() : '—'}
                                    </p>
                                </div>
                            </div>
                        </div>

                        {/* Success rate bar */}
                        {(webhook.successCount + webhook.failureCount) > 0 && (
                            <div className="mt-3">
                                <div className="flex items-center justify-between text-[10px] text-gray-500 mb-1">
                                    <span>Delivery rate</span>
                                    <span className="font-mono">
                                        {Math.round((webhook.successCount / (webhook.successCount + webhook.failureCount)) * 100)}%
                                    </span>
                                </div>
                                <div className="w-full h-1.5 bg-white/[0.06] rounded-full overflow-hidden">
                                    <div
                                        className="h-full bg-gradient-to-r from-emerald-500 to-green-400 rounded-full"
                                        style={{ width: `${(webhook.successCount / (webhook.successCount + webhook.failureCount)) * 100}%` }}
                                    />
                                </div>
                            </div>
                        )}
                    </motion.div>
                ))}
            </div>
        </div>
    )
}
