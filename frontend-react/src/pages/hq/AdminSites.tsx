import { useState } from 'react'
import { useQuery, useMutation } from '@apollo/client/react'
import { motion, AnimatePresence } from 'framer-motion'
import {
    Globe, Search, Copy, CheckCircle2, XCircle,
    Trash2, AlertTriangle, Eye,
    ToggleLeft, ToggleRight
} from 'lucide-react'
import {
    ADMIN_GET_ALL_SITES, ADMIN_UPDATE_SITE, ADMIN_DELETE_SITE,
    AdminGetAllSitesResponse, AdminSite
} from '@/lib/graphql/admin-operations'
import { toast } from 'react-toastify'

export default function AdminSitesPage() {
    const [search, setSearch] = useState('')
    const [statusFilter, setStatusFilter] = useState<string>('all')
    const [selectedSite, setSelectedSite] = useState<AdminSite | null>(null)
    const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null)

    const { data, loading, refetch } = useQuery<AdminGetAllSitesResponse>(ADMIN_GET_ALL_SITES)
    const [updateSite] = useMutation(ADMIN_UPDATE_SITE)
    const [deleteSite] = useMutation(ADMIN_DELETE_SITE)

    const sites = data?.adminGetAllSites || []
    const filtered = sites.filter(s => {
        const matchesSearch = s.name.toLowerCase().includes(search.toLowerCase()) ||
            (s.domain || '').toLowerCase().includes(search.toLowerCase()) ||
            s.siteId.toLowerCase().includes(search.toLowerCase())
        const matchesStatus = statusFilter === 'all' ||
            (statusFilter === 'active' && s.isActive) ||
            (statusFilter === 'inactive' && !s.isActive)
        return matchesSearch && matchesStatus
    })

    const handleToggleActive = async (site: AdminSite) => {
        try {
            await updateSite({
                variables: { siteId: site.siteId, input: { isActive: !site.isActive } }
            })
            toast.success(`Site ${site.isActive ? 'deactivated' : 'activated'}`)
            refetch()
        } catch (err: any) {
            toast.error(err.message)
        }
    }

    const handleDelete = async (siteId: string) => {
        try {
            await deleteSite({ variables: { siteId } })
            toast.success('Site deleted successfully')
            setDeleteConfirm(null)
            refetch()
        } catch (err: any) {
            toast.error(err.message)
        }
    }

    const copyToClipboard = (text: string) => {
        navigator.clipboard.writeText(text)
        toast.success('Copied to clipboard')
    }

    return (
        <div className="space-y-6 max-w-[1400px]">
            {/* Header */}
            <div>
                <h1 className="text-2xl font-bold tracking-tight">Site Management</h1>
                <p className="text-sm text-gray-500 mt-1">
                    Overview and management of all tracked website properties
                </p>
            </div>

            {/* Stats row */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                {[
                    { label: 'Total Sites', value: sites.length, color: 'text-blue-400', bgColor: 'bg-blue-500/10' },
                    { label: 'Active', value: sites.filter(s => s.isActive).length, color: 'text-emerald-400', bgColor: 'bg-emerald-500/10' },
                    { label: 'Tracking On', value: sites.filter(s => s.settings?.enableTracking).length, color: 'text-amber-400', bgColor: 'bg-amber-500/10' },
                    { label: 'UI Injection', value: sites.filter(s => s.settings?.isUiInjectionEnabled).length, color: 'text-purple-400', bgColor: 'bg-purple-500/10' },
                ].map(stat => (
                    <div key={stat.label} className="bg-[#0a0a0a] border border-white/[0.06] rounded-xl px-4 py-3 flex items-center justify-between">
                        <span className="text-xs text-gray-500">{stat.label}</span>
                        <span className={`text-lg font-bold ${stat.color}`}>
                            {loading ? <span className="inline-block w-6 h-5 bg-white/[0.04] rounded animate-pulse" /> : stat.value}
                        </span>
                    </div>
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
                        placeholder="Search sites by name, domain, or siteId..."
                        className="w-full pl-10 pr-4 py-2.5 bg-[#0a0a0a] border border-white/[0.08] rounded-xl text-sm text-white placeholder-gray-600 focus:outline-none focus:border-red-500/30 transition-colors"
                    />
                </div>
                <div className="flex items-center gap-1 bg-[#0a0a0a] border border-white/[0.08] rounded-xl p-1">
                    {['all', 'active', 'inactive'].map((status) => (
                        <button
                            key={status}
                            onClick={() => setStatusFilter(status)}
                            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all cursor-pointer ${statusFilter === status
                                ? 'bg-red-500/10 text-red-400 border border-red-500/20'
                                : 'text-gray-500 hover:text-gray-300 border border-transparent'
                                }`}
                        >
                            {status.charAt(0).toUpperCase() + status.slice(1)}
                        </button>
                    ))}
                </div>
            </div>

            {/* Sites Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                {loading ? (
                    Array.from({ length: 6 }).map((_, i) => (
                        <div key={i} className="bg-[#0a0a0a] border border-white/[0.06] rounded-2xl p-5 animate-pulse">
                            <div className="flex items-start justify-between">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 bg-white/[0.04] rounded-xl" />
                                    <div>
                                        <div className="w-20 h-4 bg-white/[0.04] rounded" />
                                        <div className="w-28 h-3 bg-white/[0.04] rounded mt-1.5" />
                                    </div>
                                </div>
                            </div>
                            <div className="mt-4 space-y-2">
                                <div className="w-full h-8 bg-white/[0.04] rounded-lg" />
                                <div className="w-3/4 h-8 bg-white/[0.04] rounded-lg" />
                            </div>
                        </div>
                    ))
                ) : filtered.map((site, i) => (
                    <motion.div
                        key={site.id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: i * 0.05 }}
                        className="group bg-[#0a0a0a] border border-white/[0.06] rounded-2xl p-5 hover:border-white/[0.1] transition-all duration-300 relative"
                    >
                        {/* Top section */}
                        <div className="flex items-start justify-between">
                            <div className="flex items-center gap-3">
                                <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${site.isActive ? 'bg-emerald-500/10' : 'bg-gray-500/10'
                                    }`}>
                                    <Globe className={`w-5 h-5 ${site.isActive ? 'text-emerald-400' : 'text-gray-500'}`} />
                                </div>
                                <div>
                                    <h3 className="text-sm font-semibold">{site.name}</h3>
                                    <p className="text-xs text-gray-500 font-mono">{site.domain || 'No domain'}</p>
                                </div>
                            </div>
                            <span className={`inline-flex items-center gap-1 text-[9px] font-medium px-2 py-0.5 rounded-full ${site.isActive
                                ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                                : 'bg-gray-500/10 text-gray-500 border border-gray-500/20'
                                }`}>
                                <span className={`w-1 h-1 rounded-full ${site.isActive ? 'bg-emerald-400' : 'bg-gray-500'}`} />
                                {site.isActive ? 'Live' : 'Off'}
                            </span>
                        </div>

                        {/* Site ID & API Key */}
                        <div className="mt-4 space-y-2">
                            <div className="flex items-center justify-between px-3 py-2 bg-white/[0.02] rounded-lg border border-white/[0.04]">
                                <div>
                                    <span className="text-[9px] text-gray-600 uppercase tracking-wider">Site ID</span>
                                    <p className="text-[11px] text-gray-400 font-mono truncate max-w-[180px]">{site.siteId}</p>
                                </div>
                                <button onClick={() => copyToClipboard(site.siteId)} className="text-gray-600 hover:text-gray-400 cursor-pointer">
                                    <Copy className="w-3 h-3" />
                                </button>
                            </div>
                            {site.apiKey && (
                                <div className="flex items-center justify-between px-3 py-2 bg-white/[0.02] rounded-lg border border-white/[0.04]">
                                    <div>
                                        <span className="text-[9px] text-gray-600 uppercase tracking-wider">API Key</span>
                                        <p className="text-[11px] text-gray-400 font-mono truncate max-w-[180px]">{site.apiKey}</p>
                                    </div>
                                    <button onClick={() => copyToClipboard(site.apiKey!)} className="text-gray-600 hover:text-gray-400 cursor-pointer">
                                        <Copy className="w-3 h-3" />
                                    </button>
                                </div>
                            )}
                        </div>

                        {/* Feature flags */}
                        <div className="mt-3 flex flex-wrap gap-1.5">
                            {[
                                { label: 'Tracking', enabled: site.settings?.enableTracking },
                                { label: 'Geo', enabled: site.settings?.enableGeoLocation },
                                { label: 'Behavior', enabled: site.settings?.enableBehaviorTracking },
                                { label: 'UI Inject', enabled: site.settings?.isUiInjectionEnabled },
                            ].map(flag => (
                                <span key={flag.label} className={`text-[9px] px-1.5 py-0.5 rounded-md font-mono ${flag.enabled
                                    ? 'bg-emerald-500/10 text-emerald-400/70 border border-emerald-500/10'
                                    : 'bg-white/[0.02] text-gray-600 border border-white/[0.04]'
                                    }`}>
                                    {flag.label}
                                </span>
                            ))}
                        </div>

                        {/* Actions */}
                        <div className="mt-4 pt-3 border-t border-white/[0.04] flex items-center justify-between">
                            <span className="text-[10px] text-gray-600 font-mono">
                                {new Date(site.createdAt).toLocaleDateString()}
                            </span>
                            <div className="flex items-center gap-1">
                                <button
                                    onClick={() => setSelectedSite(site)}
                                    className="p-1.5 hover:bg-white/[0.06] rounded-lg transition-colors text-gray-500 hover:text-blue-400 cursor-pointer"
                                    title="View details"
                                >
                                    <Eye className="w-3.5 h-3.5" />
                                </button>
                                <button
                                    onClick={() => handleToggleActive(site)}
                                    className="p-1.5 hover:bg-white/[0.06] rounded-lg transition-colors text-gray-500 hover:text-amber-400 cursor-pointer"
                                    title={site.isActive ? 'Deactivate' : 'Activate'}
                                >
                                    {site.isActive ? <ToggleRight className="w-3.5 h-3.5" /> : <ToggleLeft className="w-3.5 h-3.5" />}
                                </button>
                                <button
                                    onClick={() => setDeleteConfirm(site.siteId)}
                                    className="p-1.5 hover:bg-red-500/10 rounded-lg transition-colors text-gray-500 hover:text-red-400 cursor-pointer"
                                    title="Delete"
                                >
                                    <Trash2 className="w-3.5 h-3.5" />
                                </button>
                            </div>
                        </div>
                    </motion.div>
                ))}
            </div>

            {!loading && filtered.length === 0 && (
                <div className="bg-[#0a0a0a] border border-white/[0.06] rounded-2xl py-16 text-center">
                    <Globe className="w-10 h-10 mx-auto mb-3 text-gray-700" />
                    <p className="text-sm text-gray-500">No sites found</p>
                </div>
            )}

            {/* Site Detail Modal */}
            <AnimatePresence>
                {selectedSite && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50"
                        onClick={() => setSelectedSite(null)}
                    >
                        <motion.div
                            initial={{ scale: 0.95, y: 20 }}
                            animate={{ scale: 1, y: 0 }}
                            exit={{ scale: 0.95, y: 20 }}
                            onClick={(e) => e.stopPropagation()}
                            className="bg-[#0a0a0a] border border-white/[0.08] rounded-2xl w-full max-w-lg shadow-2xl max-h-[80vh] overflow-y-auto custom-scrollbar"
                        >
                            <div className="sticky top-0 bg-[#0a0a0a] px-6 py-4 border-b border-white/[0.06] flex items-center justify-between z-10">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 bg-emerald-500/10 rounded-xl flex items-center justify-center">
                                        <Globe className="w-5 h-5 text-emerald-400" />
                                    </div>
                                    <div>
                                        <h3 className="font-semibold">{selectedSite.name}</h3>
                                        <p className="text-xs text-gray-500 font-mono">{selectedSite.siteId}</p>
                                    </div>
                                </div>
                                <button onClick={() => setSelectedSite(null)} className="text-gray-500 hover:text-white p-1 cursor-pointer">
                                    <XCircle className="w-5 h-5" />
                                </button>
                            </div>
                            <div className="p-6 space-y-4">
                                {[
                                    { label: 'Domain', value: selectedSite.domain || '—' },
                                    { label: 'Site ID', value: selectedSite.siteId },
                                    { label: 'API Key', value: selectedSite.apiKey || '—' },
                                    { label: 'Owner (User ID)', value: selectedSite.userId },
                                    { label: 'Status', value: selectedSite.isActive ? 'Active' : 'Inactive' },
                                    { label: 'Allowed Domains', value: selectedSite.allowedDomains.join(', ') || '—' },
                                    { label: 'Data Retention', value: `${selectedSite.settings.dataRetentionDays} days` },
                                    { label: 'Tracking Delay', value: `${selectedSite.settings.trackingStartDelay}ms` },
                                    { label: 'Created', value: new Date(selectedSite.createdAt).toLocaleString() },
                                    { label: 'Updated', value: new Date(selectedSite.updatedAt).toLocaleString() },
                                ].map(item => (
                                    <div key={item.label} className="flex items-center justify-between py-2 border-b border-white/[0.04] last:border-0">
                                        <span className="text-xs text-gray-500">{item.label}</span>
                                        <span className="text-xs text-gray-300 font-mono text-right max-w-[250px] truncate">{item.value}</span>
                                    </div>
                                ))}

                                <div className="pt-3">
                                    <h4 className="text-xs text-gray-400 font-medium uppercase tracking-wider mb-3">Feature Flags</h4>
                                    <div className="grid grid-cols-2 gap-2">
                                        {[
                                            { label: 'Tracking', enabled: selectedSite.settings.enableTracking },
                                            { label: 'Geo Location', enabled: selectedSite.settings.enableGeoLocation },
                                            { label: 'Behavior Tracking', enabled: selectedSite.settings.enableBehaviorTracking },
                                            { label: 'UI Injection', enabled: selectedSite.settings.isUiInjectionEnabled },
                                            { label: 'Pre-gen Intent UI', enabled: selectedSite.settings.usePreGeneratedIntentUI },
                                        ].map(flag => (
                                            <div key={flag.label} className={`flex items-center gap-2 px-3 py-2 rounded-lg border ${flag.enabled
                                                ? 'bg-emerald-500/10 border-emerald-500/20'
                                                : 'bg-white/[0.02] border-white/[0.04]'
                                                }`}>
                                                {flag.enabled ? (
                                                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                                                ) : (
                                                    <XCircle className="w-3.5 h-3.5 text-gray-600" />
                                                )}
                                                <span className={`text-xs ${flag.enabled ? 'text-emerald-300' : 'text-gray-500'}`}>
                                                    {flag.label}
                                                </span>
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                {selectedSite.settings.maxInjectionsPerIntent?.length > 0 && (
                                    <div className="pt-3">
                                        <h4 className="text-xs text-gray-400 font-medium uppercase tracking-wider mb-3">Intent Injection Limits</h4>
                                        <div className="space-y-1.5">
                                            {selectedSite.settings.maxInjectionsPerIntent.map(entry => (
                                                <div key={entry.intent} className="flex items-center justify-between px-3 py-2 bg-white/[0.02] rounded-lg border border-white/[0.04]">
                                                    <span className="text-xs text-gray-400">{entry.intent}</span>
                                                    <span className="text-xs text-amber-400 font-mono">{entry.limit} max</span>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Delete Confirmation */}
            <AnimatePresence>
                {deleteConfirm && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50"
                        onClick={() => setDeleteConfirm(null)}
                    >
                        <motion.div
                            initial={{ scale: 0.95 }}
                            animate={{ scale: 1 }}
                            exit={{ scale: 0.95 }}
                            onClick={(e) => e.stopPropagation()}
                            className="bg-[#0a0a0a] border border-white/[0.08] rounded-2xl p-6 w-full max-w-sm shadow-2xl"
                        >
                            <div className="flex items-center gap-3 mb-4">
                                <div className="p-2 bg-red-500/10 rounded-xl">
                                    <AlertTriangle className="w-5 h-5 text-red-400" />
                                </div>
                                <div>
                                    <h3 className="font-semibold text-sm">Delete Site</h3>
                                    <p className="text-xs text-gray-500">This will deactivate the site and delete tracking data</p>
                                </div>
                            </div>
                            <div className="flex justify-end gap-2 mt-6">
                                <button
                                    onClick={() => setDeleteConfirm(null)}
                                    className="px-4 py-2 text-sm text-gray-400 hover:text-white rounded-lg hover:bg-white/[0.04] transition-colors cursor-pointer"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={() => handleDelete(deleteConfirm)}
                                    className="px-4 py-2 text-sm bg-red-600 hover:bg-red-500 text-white rounded-lg transition-colors cursor-pointer"
                                >
                                    Delete Site
                                </button>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    )
}
