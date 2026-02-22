import { useState, useMemo } from 'react'
import { useQuery } from '@apollo/client/react'
import { motion } from 'framer-motion'
import {
    Activity, Search, Globe, MapPin, Monitor,
    Smartphone, Tablet, ArrowUpRight, Eye,
    Zap, RefreshCw, X
} from 'lucide-react'
import {
    ADMIN_GET_ALL_SITES, ADMIN_GET_LIVE_SESSIONS,
    AdminGetAllSitesResponse, AdminGetLiveSessionsResponse, AdminSession
} from '@/lib/graphql/admin-operations'

function formatDuration(seconds: number): string {
    if (seconds < 60) return `${Math.round(seconds)}s`
    if (seconds < 3600) return `${Math.floor(seconds / 60)}m ${Math.round(seconds % 60)}s`
    return `${Math.floor(seconds / 3600)}h ${Math.floor((seconds % 3600) / 60)}m`
}

function getTimeAgo(dateStr: string): string {
    const diff = Date.now() - new Date(dateStr).getTime()
    const minutes = Math.floor(diff / 60000)
    if (minutes < 1) return 'Just now'
    if (minutes < 60) return `${minutes}m ago`
    const hours = Math.floor(minutes / 60)
    if (hours < 24) return `${hours}h ago`
    return `${Math.floor(hours / 24)}d ago`
}

function getIntentColor(category: string): string {
    switch (category?.toLowerCase()) {
        case 'high_intent': return 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20'
        case 'researcher': return 'text-blue-400 bg-blue-500/10 border-blue-500/20'
        case 'hesitation': return 'text-amber-400 bg-amber-500/10 border-amber-500/20'
        case 'bounce_risk': return 'text-red-400 bg-red-500/10 border-red-500/20'
        default: return 'text-gray-400 bg-gray-500/10 border-gray-500/20'
    }
}

function getDeviceIcon(deviceType?: string) {
    switch (deviceType?.toLowerCase()) {
        case 'mobile': return Smartphone
        case 'tablet': return Tablet
        default: return Monitor
    }
}

export default function AdminSessionsPage() {
    const [selectedSiteId, setSelectedSiteId] = useState<string>('')
    const [search, setSearch] = useState('')
    const [intentFilter, setIntentFilter] = useState<string>('all')
    const [selectedSession, setSelectedSession] = useState<AdminSession | null>(null)

    const { data: sitesData, loading: sitesLoading } = useQuery<AdminGetAllSitesResponse>(ADMIN_GET_ALL_SITES)
    const { data: sessionsData, loading: sessionsLoading, refetch } = useQuery<AdminGetLiveSessionsResponse>(
        ADMIN_GET_LIVE_SESSIONS,
        { variables: { siteId: selectedSiteId }, skip: !selectedSiteId, pollInterval: 10000 }
    )

    const sites = sitesData?.adminGetAllSites || []
    const sessions = sessionsData?.getLiveSessions || []

    // Auto-select first site
    if (sites.length > 0 && !selectedSiteId) {
        setSelectedSiteId(sites[0].siteId)
    }

    const filtered = useMemo(() => {
        return sessions.filter(s => {
            const matchesSearch = s.sessionId.toLowerCase().includes(search.toLowerCase()) ||
                (s.organizationName || '').toLowerCase().includes(search.toLowerCase()) ||
                (s.geo?.country || '').toLowerCase().includes(search.toLowerCase())
            const matchesIntent = intentFilter === 'all' || s.intentCategory?.toLowerCase() === intentFilter.toLowerCase()
            return matchesSearch && matchesIntent
        })
    }, [sessions, search, intentFilter])

    const activeSessions = filtered.filter(s => s.isActive)


    return (
        <div className="space-y-6 max-w-[1400px]">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight">Session Monitor</h1>
                    <p className="text-sm text-gray-500 mt-1">Live and recent visitor sessions across all sites</p>
                </div>
                <button
                    onClick={() => refetch()}
                    className="flex items-center gap-2 px-3 py-2 bg-white/[0.04] border border-white/[0.06] rounded-xl text-xs text-gray-400 hover:text-white hover:bg-white/[0.06] transition-all cursor-pointer"
                >
                    <RefreshCw className="w-3.5 h-3.5" />
                    Refresh
                </button>
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

            {/* Filters */}
            <div className="flex items-center gap-3">
                <div className="flex-1 relative">
                    <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                    <input
                        type="text"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        placeholder="Search sessions by ID, org, or country..."
                        className="w-full pl-10 pr-4 py-2.5 bg-[#0a0a0a] border border-white/[0.08] rounded-xl text-sm text-white placeholder-gray-600 focus:outline-none focus:border-red-500/30 transition-colors"
                    />
                </div>
                <div className="flex items-center gap-1 bg-[#0a0a0a] border border-white/[0.08] rounded-xl p-1">
                    {['all', 'HIGH_INTENT', 'RESEARCHER', 'HESITATION', 'BOUNCE_RISK', 'GENERAL'].map((intent) => (
                        <button
                            key={intent}
                            onClick={() => setIntentFilter(intent)}
                            className={`px-2.5 py-1.5 rounded-lg text-[10px] font-medium transition-all cursor-pointer whitespace-nowrap ${intentFilter === intent
                                ? 'bg-red-500/10 text-red-400 border border-red-500/20'
                                : 'text-gray-500 hover:text-gray-300 border border-transparent'
                                }`}
                        >
                            {intent === 'all' ? 'All' : intent.replace('_', ' ')}
                        </button>
                    ))}
                </div>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                {[
                    { label: 'Total Sessions', value: filtered.length, icon: Activity, color: 'text-blue-400' },
                    { label: 'Active Now', value: activeSessions.length, icon: Zap, color: 'text-emerald-400' },
                    { label: 'Avg Intent Score', value: filtered.length > 0 ? Math.round(filtered.reduce((a, s) => a + s.intentScore, 0) / filtered.length) : 0, icon: ArrowUpRight, color: 'text-amber-400' },
                    { label: 'Avg Pages', value: filtered.length > 0 ? (filtered.reduce((a, s) => a + s.totalPageViews, 0) / filtered.length).toFixed(1) : 0, icon: Eye, color: 'text-purple-400' },
                ].map(stat => (
                    <div key={stat.label} className="bg-[#0a0a0a] border border-white/[0.06] rounded-xl px-4 py-3 flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <stat.icon className={`w-4 h-4 ${stat.color}`} />
                            <span className="text-xs text-gray-500">{stat.label}</span>
                        </div>
                        <span className={`text-lg font-bold ${stat.color}`}>
                            {sessionsLoading ? <span className="inline-block w-6 h-5 bg-white/[0.04] rounded animate-pulse" /> : stat.value}
                        </span>
                    </div>
                ))}
            </div>

            {/* Sessions List */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-[#0a0a0a] border border-white/[0.06] rounded-2xl overflow-hidden"
            >
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead>
                            <tr className="text-left text-[11px] uppercase tracking-wider text-gray-600 border-b border-white/[0.06]">
                                <th className="px-5 py-3.5 font-medium">Session</th>
                                <th className="px-5 py-3.5 font-medium">Intent</th>
                                <th className="px-5 py-3.5 font-medium">Score</th>
                                <th className="px-5 py-3.5 font-medium">Location</th>
                                <th className="px-5 py-3.5 font-medium">Device</th>
                                <th className="px-5 py-3.5 font-medium">Pages</th>
                                <th className="px-5 py-3.5 font-medium">Duration</th>
                                <th className="px-5 py-3.5 font-medium">Status</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-white/[0.04]">
                            {sessionsLoading || !selectedSiteId ? (
                                Array.from({ length: 5 }).map((_, i) => (
                                    <tr key={i}>
                                        {Array.from({ length: 8 }).map((_, j) => (
                                            <td key={j} className="px-5 py-3.5"><div className="w-16 h-3 bg-white/[0.04] rounded animate-pulse" /></td>
                                        ))}
                                    </tr>
                                ))
                            ) : filtered.map(session => {
                                const DeviceIcon = getDeviceIcon(session.deviceType)
                                return (
                                    <tr
                                        key={session.sessionId}
                                        onClick={() => setSelectedSession(session)}
                                        className="hover:bg-white/[0.02] transition-colors cursor-pointer"
                                    >
                                        <td className="px-5 py-3.5">
                                            <div>
                                                <p className="text-xs font-mono text-gray-300 truncate max-w-[140px]">{session.sessionId.slice(0, 16)}...</p>
                                                {session.organizationName && (
                                                    <p className="text-[10px] text-gray-500">{session.organizationName}</p>
                                                )}
                                            </div>
                                        </td>
                                        <td className="px-5 py-3.5">
                                            <span className={`inline-flex items-center text-[9px] font-medium px-2 py-0.5 rounded-full border ${getIntentColor(session.intentCategory)}`}>
                                                {session.intentCategory?.replace('_', ' ') || 'General'}
                                            </span>
                                        </td>
                                        <td className="px-5 py-3.5">
                                            <div className="flex items-center gap-2">
                                                <div className="w-12 h-1.5 bg-white/[0.06] rounded-full overflow-hidden">
                                                    <div
                                                        className={`h-full rounded-full ${session.intentScore >= 70 ? 'bg-emerald-400'
                                                            : session.intentScore >= 40 ? 'bg-amber-400'
                                                                : 'bg-gray-400'
                                                            }`}
                                                        style={{ width: `${session.intentScore}%` }}
                                                    />
                                                </div>
                                                <span className="text-xs font-mono text-gray-400">{session.intentScore}</span>
                                            </div>
                                        </td>
                                        <td className="px-5 py-3.5">
                                            <div className="flex items-center gap-1.5">
                                                <MapPin className="w-3 h-3 text-gray-600" />
                                                <span className="text-xs text-gray-400">
                                                    {session.geo?.city ? `${session.geo.city}, ${session.geo.country}` : session.geo?.country || '—'}
                                                </span>
                                            </div>
                                        </td>
                                        <td className="px-5 py-3.5">
                                            <div className="flex items-center gap-1.5">
                                                <DeviceIcon className="w-3 h-3 text-gray-600" />
                                                <span className="text-xs text-gray-400">{session.browser || '—'}</span>
                                            </div>
                                        </td>
                                        <td className="px-5 py-3.5 text-xs text-gray-400 font-mono">{session.totalPageViews}</td>
                                        <td className="px-5 py-3.5 text-xs text-gray-400 font-mono">{formatDuration(session.totalTimeSpent)}</td>
                                        <td className="px-5 py-3.5">
                                            <span className={`inline-flex items-center gap-1 text-[9px] font-medium px-2 py-0.5 rounded-full ${session.isActive
                                                ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                                                : 'bg-gray-500/10 text-gray-500 border border-gray-500/20'
                                                }`}>
                                                <span className={`w-1 h-1 rounded-full ${session.isActive ? 'bg-emerald-400 animate-pulse' : 'bg-gray-500'}`} />
                                                {session.isActive ? 'Live' : getTimeAgo(session.startedAt)}
                                            </span>
                                        </td>
                                    </tr>
                                )
                            })}
                        </tbody>
                    </table>
                    {!sessionsLoading && selectedSiteId && filtered.length === 0 && (
                        <div className="px-5 py-12 text-center text-gray-600">
                            <Activity className="w-8 h-8 mx-auto mb-3 opacity-50" />
                            <p className="text-sm">No sessions found for this site</p>
                        </div>
                    )}
                    {!selectedSiteId && !sitesLoading && (
                        <div className="px-5 py-12 text-center text-gray-600">
                            <Globe className="w-8 h-8 mx-auto mb-3 opacity-50" />
                            <p className="text-sm">Select a site to view sessions</p>
                        </div>
                    )}
                </div>
            </motion.div>

            {/* Session Detail Modal */}
            {selectedSession && (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50"
                    onClick={() => setSelectedSession(null)}
                >
                    <motion.div
                        initial={{ scale: 0.95, y: 20 }}
                        animate={{ scale: 1, y: 0 }}
                        onClick={(e) => e.stopPropagation()}
                        className="bg-[#0a0a0a] border border-white/[0.08] rounded-2xl w-full max-w-lg shadow-2xl max-h-[80vh] overflow-y-auto custom-scrollbar"
                    >
                        <div className="sticky top-0 bg-[#0a0a0a] px-6 py-4 border-b border-white/[0.06] flex items-center justify-between z-10">
                            <h3 className="font-semibold flex items-center gap-2">
                                <Activity className="w-4 h-4 text-blue-400" />
                                Session Details
                            </h3>
                            <button onClick={() => setSelectedSession(null)} className="text-gray-500 hover:text-white cursor-pointer">
                                <X className="w-4 h-4" />
                            </button>
                        </div>
                        <div className="p-6 space-y-3">
                            {[
                                { label: 'Session ID', value: selectedSession.sessionId },
                                { label: 'Site ID', value: selectedSession.siteId },
                                { label: 'Intent Category', value: selectedSession.intentCategory },
                                { label: 'Intent Score', value: String(selectedSession.intentScore) },
                                { label: 'Organization', value: selectedSession.organizationName || '—' },
                                { label: 'Location', value: selectedSession.geo ? `${selectedSession.geo.city || ''}, ${selectedSession.geo.region || ''}, ${selectedSession.geo.country || ''}` : '—' },
                                { label: 'Device', value: `${selectedSession.deviceType || '—'} / ${selectedSession.browser || '—'} / ${selectedSession.os || '—'}` },
                                { label: 'Referrer', value: selectedSession.referrer || 'Direct' },
                                { label: 'Pages Viewed', value: String(selectedSession.totalPageViews) },
                                { label: 'Time Spent', value: formatDuration(selectedSession.totalTimeSpent) },
                                { label: 'Started', value: new Date(selectedSession.startedAt).toLocaleString() },
                                { label: 'Last Activity', value: selectedSession.lastActivityAt ? new Date(selectedSession.lastActivityAt).toLocaleString() : '—' },
                                { label: 'Status', value: selectedSession.isActive ? '🟢 Active' : '⚪ Ended' },
                            ].map(item => (
                                <div key={item.label} className="flex items-center justify-between py-2 border-b border-white/[0.04] last:border-0">
                                    <span className="text-xs text-gray-500">{item.label}</span>
                                    <span className="text-xs text-gray-300 font-mono text-right max-w-[250px] truncate">{item.value}</span>
                                </div>
                            ))}
                            {selectedSession.pagesVisited.length > 0 && (
                                <div className="pt-3">
                                    <h4 className="text-xs text-gray-400 font-medium uppercase tracking-wider mb-2">Page Journey</h4>
                                    <div className="space-y-1">
                                        {selectedSession.pagesVisited.map((page, i) => (
                                            <div key={i} className="flex items-center gap-2 px-3 py-1.5 bg-white/[0.02] rounded-lg border border-white/[0.04]">
                                                <span className="text-[9px] text-gray-600 font-mono w-4">{i + 1}</span>
                                                <span className="text-xs text-gray-400 truncate">{page}</span>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                    </motion.div>
                </motion.div>
            )}
        </div>
    )
}
