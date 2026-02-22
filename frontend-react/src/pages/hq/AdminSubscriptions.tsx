import { useState } from 'react'
import { useQuery, useMutation } from '@apollo/client/react'
import { motion } from 'framer-motion'
import {
    Receipt, Search, XCircle, AlertTriangle,
    CreditCard, CheckCircle2
} from 'lucide-react'
import {
    ADMIN_GET_ALL_SUBSCRIPTIONS, ADMIN_CANCEL_SUBSCRIPTION,
    AdminGetAllSubscriptionsResponse
} from '@/lib/graphql/subscription-operations'
import { toast } from 'react-toastify'

const statusColors: Record<string, string> = {
    active: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
    created: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
    authenticated: 'bg-cyan-500/10 text-cyan-400 border-cyan-500/20',
    pending: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
    halted: 'bg-red-500/10 text-red-400 border-red-500/20',
    cancelled: 'bg-gray-500/10 text-gray-400 border-gray-500/20',
    completed: 'bg-purple-500/10 text-purple-400 border-purple-500/20',
    expired: 'bg-gray-500/10 text-gray-500 border-gray-500/20',
    paused: 'bg-orange-500/10 text-orange-400 border-orange-500/20',
}

export default function AdminSubscriptionsPage() {
    const [search, setSearch] = useState('')
    const [statusFilter, setStatusFilter] = useState('all')
    const [cancelConfirm, setCancelConfirm] = useState<string | null>(null)

    const { data, loading, refetch } = useQuery<AdminGetAllSubscriptionsResponse>(
        ADMIN_GET_ALL_SUBSCRIPTIONS,
        { variables: statusFilter !== 'all' ? { status: statusFilter } : {} }
    )
    const [adminCancel] = useMutation(ADMIN_CANCEL_SUBSCRIPTION)

    const subs = data?.adminGetAllSubscriptions || []
    const filtered = subs.filter(s =>
        (s.userName || '').toLowerCase().includes(search.toLowerCase()) ||
        (s.userEmail || '').toLowerCase().includes(search.toLowerCase()) ||
        s.subscriptionId.toLowerCase().includes(search.toLowerCase())
    )

    const handleCancel = async (subscriptionId: string) => {
        try {
            await adminCancel({ variables: { subscriptionId, cancelAtPeriodEnd: false } })
            toast.success('Subscription cancelled')
            setCancelConfirm(null)
            refetch()
        } catch (err: any) { toast.error(err.message) }
    }

    const stats = [
        { label: 'Total', value: subs.length, icon: Receipt, color: 'text-blue-400' },
        { label: 'Active', value: subs.filter(s => s.status === 'active').length, icon: CheckCircle2, color: 'text-emerald-400' },
        { label: 'Cancelled', value: subs.filter(s => s.status === 'cancelled').length, icon: XCircle, color: 'text-gray-400' },
        { label: 'Halted', value: subs.filter(s => s.status === 'halted').length, icon: AlertTriangle, color: 'text-red-400' },
    ]

    return (
        <div className="space-y-6 max-w-[1400px]">
            <div>
                <h1 className="text-2xl font-bold tracking-tight">Subscription Overview</h1>
                <p className="text-sm text-gray-500 mt-1">Monitor and manage all user subscriptions</p>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                {stats.map(stat => (
                    <div key={stat.label} className="bg-[#0a0a0a] border border-white/[0.06] rounded-xl px-4 py-3 flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <stat.icon className={`w-4 h-4 ${stat.color}`} />
                            <span className="text-xs text-gray-500">{stat.label}</span>
                        </div>
                        <span className={`text-lg font-bold ${stat.color}`}>{loading ? '—' : stat.value}</span>
                    </div>
                ))}
            </div>

            {/* Filters */}
            <div className="flex items-center gap-3">
                <div className="flex-1 relative">
                    <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                    <input type="text" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search by user or subscription ID..." className="w-full pl-10 pr-4 py-2.5 bg-[#0a0a0a] border border-white/[0.08] rounded-xl text-sm text-white placeholder-gray-600 focus:outline-none focus:border-red-500/30" />
                </div>
                <div className="flex items-center gap-1 bg-[#0a0a0a] border border-white/[0.08] rounded-xl p-1">
                    {['all', 'active', 'cancelled', 'halted', 'paused'].map(status => (
                        <button key={status} onClick={() => setStatusFilter(status)}
                            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all cursor-pointer ${statusFilter === status ? 'bg-red-500/10 text-red-400 border border-red-500/20' : 'text-gray-500 hover:text-gray-300 border border-transparent'}`}>
                            {status.charAt(0).toUpperCase() + status.slice(1)}
                        </button>
                    ))}
                </div>
            </div>

            {/* Table */}
            <div className="bg-[#0a0a0a] border border-white/[0.06] rounded-2xl overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead>
                            <tr className="border-b border-white/[0.06]">
                                {['User', 'Plan', 'Status', 'Period', 'Paid', 'Usage', 'Actions'].map(h => (
                                    <th key={h} className="text-left px-4 py-3 text-[10px] text-gray-500 uppercase tracking-wider font-medium">{h}</th>
                                ))}
                            </tr>
                        </thead>
                        <tbody>
                            {loading ? Array.from({ length: 5 }).map((_, i) => (
                                <tr key={i} className="border-b border-white/[0.04]">
                                    {Array.from({ length: 7 }).map((_, j) => (
                                        <td key={j} className="px-4 py-3"><div className="w-20 h-4 bg-white/[0.04] rounded animate-pulse" /></td>
                                    ))}
                                </tr>
                            )) : filtered.map((sub, i) => (
                                <motion.tr key={sub.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.02 }}
                                    className="border-b border-white/[0.04] hover:bg-white/[0.02] transition-colors">
                                    <td className="px-4 py-3">
                                        <div><p className="text-sm font-medium">{sub.userName || 'Unknown'}</p><p className="text-[10px] text-gray-500 font-mono">{sub.userEmail}</p></div>
                                    </td>
                                    <td className="px-4 py-3">
                                        <div className="flex items-center gap-1.5">
                                            <CreditCard className="w-3.5 h-3.5 text-gray-500" />
                                            <span className="text-xs text-gray-300">{sub.plan?.name || '—'}</span>
                                        </div>
                                        <p className="text-[10px] text-gray-600 font-mono mt-0.5">{sub.plan?.amount ? `₹${(sub.plan.amount / 100).toLocaleString('en-IN')}/${sub.plan.period === 'monthly' ? 'mo' : 'yr'}` : 'Free'}</p>
                                    </td>
                                    <td className="px-4 py-3">
                                        <span className={`inline-flex items-center gap-1 text-[10px] font-medium px-2 py-0.5 rounded-full border ${statusColors[sub.status] || statusColors.expired}`}>
                                            <span className="w-1 h-1 rounded-full bg-current" />{sub.status}
                                        </span>
                                    </td>
                                    <td className="px-4 py-3">
                                        {sub.currentPeriodEnd ? (
                                            <div><p className="text-xs text-gray-300">{new Date(sub.currentPeriodEnd).toLocaleDateString()}</p><p className="text-[10px] text-gray-600">Ends</p></div>
                                        ) : <span className="text-xs text-gray-600">—</span>}
                                    </td>
                                    <td className="px-4 py-3"><span className="text-xs text-gray-300 font-mono">{sub.paidCount}</span></td>
                                    <td className="px-4 py-3">
                                        <div className="text-[10px] text-gray-500 space-y-0.5">
                                            <p>Sites: {sub.currentUsage.sitesCreated}</p>
                                            <p>Sessions: {sub.currentUsage.sessionsTracked}</p>
                                        </div>
                                    </td>
                                    <td className="px-4 py-3">
                                        {['active', 'authenticated', 'pending'].includes(sub.status) && (
                                            <button onClick={() => setCancelConfirm(sub.subscriptionId)} className="text-[10px] text-red-400 hover:text-red-300 cursor-pointer">Cancel</button>
                                        )}
                                    </td>
                                </motion.tr>
                            ))}
                        </tbody>
                    </table>
                </div>
                {!loading && filtered.length === 0 && (
                    <div className="py-16 text-center"><Receipt className="w-8 h-8 mx-auto mb-2 text-gray-700" /><p className="text-sm text-gray-500">No subscriptions found</p></div>
                )}
            </div>

            {/* Cancel Confirmation */}
            {cancelConfirm && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50" onClick={() => setCancelConfirm(null)}>
                    <div onClick={(e) => e.stopPropagation()} className="bg-[#0a0a0a] border border-white/[0.08] rounded-2xl p-6 w-full max-w-sm shadow-2xl">
                        <div className="flex items-center gap-3 mb-4">
                            <div className="p-2 bg-red-500/10 rounded-xl"><AlertTriangle className="w-5 h-5 text-red-400" /></div>
                            <div><h3 className="font-semibold text-sm">Force Cancel</h3><p className="text-xs text-gray-500">Immediately cancel this subscription</p></div>
                        </div>
                        <div className="flex justify-end gap-2 mt-6">
                            <button onClick={() => setCancelConfirm(null)} className="px-4 py-2 text-sm text-gray-400 hover:text-white rounded-lg cursor-pointer">Keep</button>
                            <button onClick={() => handleCancel(cancelConfirm)} className="px-4 py-2 text-sm bg-red-600 hover:bg-red-500 text-white rounded-lg cursor-pointer">Cancel Subscription</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}
