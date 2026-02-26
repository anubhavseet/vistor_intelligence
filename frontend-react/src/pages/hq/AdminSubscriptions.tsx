import { useState, Fragment } from 'react'
import { useQuery, useMutation } from '@apollo/client/react'
import { motion } from 'framer-motion'
import {
    Receipt, Search, XCircle, AlertTriangle,
    CreditCard, CheckCircle2
} from 'lucide-react'
import {
    ADMIN_GET_ALL_SUBSCRIPTIONS, ADMIN_CANCEL_SUBSCRIPTION,
    ADMIN_GET_ALL_PLANS, ADMIN_ASSIGN_CUSTOM_PLAN,
    ADMIN_CREATE_PLAN, ADMIN_UPDATE_PLAN, ADMIN_DELETE_PLAN,
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
    const [activeTab, setActiveTab] = useState<'subscriptions' | 'plans'>('subscriptions')
    const [expandedSub, setExpandedSub] = useState<string | null>(null)
    const [search, setSearch] = useState('')
    const [statusFilter, setStatusFilter] = useState('all')
    const [cancelConfirm, setCancelConfirm] = useState<string | null>(null)

    const [isPlanModalOpen, setIsPlanModalOpen] = useState(false)
    const [editingPlan, setEditingPlan] = useState<any>(null)
    const [deleteConfirmPlan, setDeleteConfirmPlan] = useState<string | null>(null)
    const [planForm, setPlanForm] = useState({
        name: '', description: '', amount: 0, period: 'monthly', interval: 1,
        isCustom: false, isActive: true, sortOrder: 0, trialDays: 0,
        features: { maxSites: 0, maxWebhooks: 0, maxSessionsPerMonth: 0, maxAiCallsPerMonth: 0, maxCrawlPages: 0, enableBehaviorTracking: false, enableGeoLocation: false, enableUiInjection: false, enableEnrichment: false, enableCustomWebhooks: false }
    })

    const { data, loading, refetch } = useQuery<AdminGetAllSubscriptionsResponse>(
        ADMIN_GET_ALL_SUBSCRIPTIONS,
        { variables: statusFilter !== 'all' ? { status: statusFilter } : {} }
    )
    const [adminCancel] = useMutation(ADMIN_CANCEL_SUBSCRIPTION)
    const [adminAssignPlan, { loading: assigning }] = useMutation(ADMIN_ASSIGN_CUSTOM_PLAN)
    const [createPlan, { loading: creatingPlan }] = useMutation(ADMIN_CREATE_PLAN)
    const [updatePlan, { loading: updatingPlan }] = useMutation(ADMIN_UPDATE_PLAN)
    const [deletePlan, { loading: deletingPlan }] = useMutation(ADMIN_DELETE_PLAN)

    const { data: plansData, loading: plansLoading, refetch: refetchPlans } = useQuery<any>(
        ADMIN_GET_ALL_PLANS
    )
    const adminPlans = plansData?.adminGetAllPlans || []

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

    const handleAssignCustomPlan = async (userId: string, planId: string) => {
        try {
            await adminAssignPlan({ variables: { userId, planId } })
            toast.success('Custom plan assigned successfully')
            refetch()
        } catch (err: any) { toast.error(err.message) }
    }

    const stats = [
        { label: 'Total', value: subs.length, icon: Receipt, color: 'text-blue-400' },
        { label: 'Active', value: subs.filter(s => s.status === 'active').length, icon: CheckCircle2, color: 'text-emerald-400' },
        { label: 'Cancelled', value: subs.filter(s => s.status === 'cancelled').length, icon: XCircle, color: 'text-gray-400' },
        { label: 'Halted', value: subs.filter(s => s.status === 'halted').length, icon: AlertTriangle, color: 'text-red-400' },
    ]

    const handleSavePlan = async () => {
        try {
            if (editingPlan) {
                await updatePlan({ variables: { id: editingPlan.id, input: planForm } })
                toast.success('Plan updated successfully')
            } else {
                await createPlan({ variables: { input: planForm } })
                toast.success('Plan created successfully')
            }
            setIsPlanModalOpen(false)
            setEditingPlan(null)
            refetchPlans()
        } catch (err: any) { toast.error(err.message) }
    }

    const handleDeletePlan = async (id: string) => {
        try {
            await deletePlan({ variables: { id } })
            toast.success('Plan deleted successfully')
            setDeleteConfirmPlan(null)
            refetchPlans()
        } catch (err: any) { toast.error(err.message) }
    }

    const openCreatePlan = () => {
        setEditingPlan(null)
        setPlanForm({
            name: '', description: '', amount: 0, period: 'monthly', interval: 1,
            isCustom: false, isActive: true, sortOrder: 0, trialDays: 0,
            features: { maxSites: 0, maxWebhooks: 0, maxSessionsPerMonth: 0, maxAiCallsPerMonth: 0, maxCrawlPages: 0, enableBehaviorTracking: false, enableGeoLocation: false, enableUiInjection: false, enableEnrichment: false, enableCustomWebhooks: false }
        })
        setIsPlanModalOpen(true)
    }

    const openEditPlan = (plan: any) => {
        setEditingPlan(plan)
        setPlanForm({
            name: plan.name, description: plan.description, amount: plan.amount, period: plan.period, interval: plan.interval,
            isCustom: plan.isCustom, isActive: plan.isActive, sortOrder: plan.sortOrder, trialDays: plan.trialDays || 0,
            features: { ...plan.features }
        })
        setIsPlanModalOpen(true)
    }

    return (
        <div className="space-y-6 max-w-[1400px]">
            <div>
                <h1 className="text-2xl font-bold tracking-tight">Subscription Management</h1>
                <p className="text-sm text-gray-500 mt-1">Monitor user subscriptions and manage plans</p>
            </div>

            {/* Tabs */}
            <div className="flex items-center gap-1 border-b border-white/[0.08]">
                <button
                    onClick={() => setActiveTab('subscriptions')}
                    className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${activeTab === 'subscriptions' ? 'border-red-500 text-white' : 'border-transparent text-gray-400 hover:text-gray-300'}`}
                >
                    Subscriptions
                </button>
                <button
                    onClick={() => setActiveTab('plans')}
                    className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${activeTab === 'plans' ? 'border-red-500 text-white' : 'border-transparent text-gray-400 hover:text-gray-300'}`}
                >
                    Plans
                </button>
            </div>

            {activeTab === 'subscriptions' && (
                <div className="space-y-6">
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
                                        <Fragment key={sub.id}>
                                            <motion.tr initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.02 }}
                                                className="border-b border-white/[0.04] hover:bg-white/[0.02] transition-colors cursor-pointer"
                                                onClick={() => setExpandedSub(expandedSub === sub.id ? null : sub.id)}
                                            >
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
                                                        <button onClick={(e) => { e.stopPropagation(); setCancelConfirm(sub.subscriptionId); }} className="text-[10px] text-red-400 hover:text-red-300 cursor-pointer">Cancel</button>
                                                    )}
                                                </td>
                                            </motion.tr>
                                            {expandedSub === sub.id && (
                                                <tr className="bg-white/[0.01] border-b border-white/[0.04]">
                                                    <td colSpan={7} className="px-4 py-4">
                                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                                            <div>
                                                                <h4 className="text-xs font-semibold text-gray-300 mb-2 uppercase tracking-wider">Detailed Usage</h4>
                                                                <div className="bg-[#0a0a0a] rounded-lg border border-white/[0.06] p-3 space-y-2">
                                                                    <div className="flex justify-between text-xs"><span className="text-gray-500">Sites</span><span className="text-gray-300">{sub.currentUsage.sitesCreated}</span></div>
                                                                    <div className="flex justify-between text-xs"><span className="text-gray-500">Sessions Tracked</span><span className="text-gray-300">{sub.currentUsage.sessionsTracked}</span></div>
                                                                    <div className="flex justify-between text-xs"><span className="text-gray-500">AI Calls</span><span className="text-gray-300">{sub.currentUsage.aiCallsMade}</span></div>
                                                                    <div className="flex justify-between text-xs"><span className="text-gray-500">Webhooks</span><span className="text-gray-300">{sub.currentUsage.webhooksCreated}</span></div>
                                                                    <div className="flex justify-between text-xs"><span className="text-gray-500">Crawl Pages</span><span className="text-gray-300">{sub.currentUsage.crawlPagesUsed}</span></div>
                                                                </div>
                                                            </div>
                                                            <div>
                                                                <h4 className="text-xs font-semibold text-gray-300 mb-2 uppercase tracking-wider">Plan Assignment</h4>
                                                                <div className="bg-[#0a0a0a] rounded-lg border border-white/[0.06] p-3 space-y-3">
                                                                    <div className="text-xs text-gray-500">Assigning a custom plan will duplicate the base plan with modified limits.</div>
                                                                    <select
                                                                        className="w-full bg-[#0a0a0a] border border-white/[0.1] rounded-lg px-3 py-2 text-sm text-gray-300 focus:outline-none focus:border-red-500/50"
                                                                        onChange={(e) => {
                                                                            if (e.target.value) handleAssignCustomPlan(sub.userId, e.target.value);
                                                                        }}
                                                                        disabled={assigning}
                                                                    >
                                                                        <option value="">Select a base plan to assign...</option>
                                                                        {adminPlans.filter((p: any) => !p.isCustom).map((p: any) => (
                                                                            <option key={p.id} value={p.id}>{p.name} (Base)</option>
                                                                        ))}
                                                                    </select>
                                                                    {sub.razorpaySubscriptionId && (
                                                                        <div className="mt-2 text-[10px] text-gray-500 font-mono flex items-center justify-between">
                                                                            <span>Rzp Sub ID:</span>
                                                                            <span>{sub.razorpaySubscriptionId}</span>
                                                                        </div>
                                                                    )}
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </td>
                                                </tr>
                                            )}
                                        </Fragment>
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
            )}

            {/* Plans Tab */}
            {activeTab === 'plans' && (
                <div className="space-y-6">
                    <div className="flex items-center justify-between">
                        <h2 className="text-lg font-semibold">Available Plans</h2>
                        <button onClick={openCreatePlan} className="px-4 py-2 bg-red-600 hover:bg-red-500 text-sm font-medium rounded-lg text-white cursor-pointer">Create Plan</button>
                    </div>
                    {plansLoading ? (
                        <div className="text-sm text-gray-500 py-10 text-center">Loading plans...</div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            {adminPlans.map((plan: any) => (
                                <div key={plan.id} className="bg-[#0a0a0a] border border-white/[0.08] rounded-2xl p-6 relative">
                                    {plan.isCustom && <div className="absolute top-4 right-4 px-2 py-0.5 rounded-full bg-purple-500/10 border border-purple-500/20 text-[10px] text-purple-400 font-medium">Custom</div>}
                                    <h3 className="text-xl font-bold text-white mb-1">{plan.name}</h3>
                                    {plan.trialDays > 0 && <span className="text-[10px] text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20 mb-2 inline-block">{plan.trialDays} Day Trial</span>}
                                    <p className="text-sm border-b border-white/[0.08] pb-4 mb-4 text-gray-400">{plan.description}</p>
                                    <p className="text-3xl font-bold mb-6">
                                        {plan.amount === 0 ? 'Free' : `₹${(plan.amount / 100).toLocaleString('en-IN')}`}
                                        {plan.amount > 0 && <span className="text-sm text-gray-500 font-normal">/{plan.period === 'monthly' ? 'mo' : 'yr'}</span>}
                                    </p>
                                    <div className="flex gap-2">
                                        <button onClick={() => openEditPlan(plan)} className="flex-1 py-2 bg-white/[0.04] hover:bg-white/[0.08] rounded-xl text-sm font-medium transition-colors border border-white/[0.06] cursor-pointer">Edit</button>
                                        <button onClick={() => setDeleteConfirmPlan(plan.id)} className="flex-1 py-2 bg-red-500/10 hover:bg-red-500/20 text-red-400 rounded-xl text-sm font-medium transition-colors border border-red-500/20 cursor-pointer">Delete</button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            )}

            {/* Plan Modal */}
            {isPlanModalOpen && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={() => setIsPlanModalOpen(false)}>
                    <div onClick={(e) => e.stopPropagation()} className="bg-[#0a0a0a] border border-white/[0.08] rounded-2xl w-full max-w-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
                        <div className="flex items-center justify-between p-6 border-b border-white/[0.08]">
                            <h2 className="text-xl font-bold">{editingPlan ? 'Edit Plan' : 'Create Plan'}</h2>
                            <button onClick={() => setIsPlanModalOpen(false)} className="text-gray-400 hover:text-white cursor-pointer"><XCircle className="w-6 h-6" /></button>
                        </div>
                        <div className="p-6 overflow-y-auto flex-1 space-y-6">
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs text-gray-400 mb-1">Plan Name</label>
                                    <input type="text" value={planForm.name} onChange={e => setPlanForm({ ...planForm, name: e.target.value })} className="w-full bg-[#0a0a0a] border border-white/[0.1] rounded-lg px-3 py-2 text-sm text-gray-300 focus:outline-none focus:border-red-500/50" />
                                </div>
                                <div>
                                    <label className="block text-xs text-gray-400 mb-1">Amount (paise)</label>
                                    <input type="number" value={planForm.amount} onChange={e => setPlanForm({ ...planForm, amount: parseInt(e.target.value) || 0 })} disabled={!!editingPlan} className="w-full bg-[#0a0a0a] border border-white/[0.1] rounded-lg px-3 py-2 text-sm text-gray-300 focus:outline-none focus:border-red-500/50 disabled:opacity-50" />
                                </div>
                            </div>
                            <div>
                                <label className="block text-xs text-gray-400 mb-1">Description</label>
                                <textarea value={planForm.description} onChange={e => setPlanForm({ ...planForm, description: e.target.value })} className="w-full bg-[#0a0a0a] border border-white/[0.1] rounded-lg px-3 py-2 text-sm text-gray-300 focus:outline-none focus:border-red-500/50 h-20" />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs text-gray-400 mb-1">Period</label>
                                    <select value={planForm.period} onChange={e => setPlanForm({ ...planForm, period: e.target.value })} disabled={!!editingPlan} className="w-full bg-[#0a0a0a] border border-white/[0.1] rounded-lg px-3 py-2 text-sm text-gray-300 focus:outline-none focus:border-red-500/50">
                                        <option value="monthly">Monthly</option>
                                        <option value="yearly">Yearly</option>
                                    </select>
                                </div>
                                <div className="flex items-center gap-4 mt-6">
                                    <label className="flex items-center gap-2 text-sm text-gray-300 cursor-pointer">
                                        <input type="checkbox" checked={planForm.isActive} onChange={e => setPlanForm({ ...planForm, isActive: e.target.checked })} className="rounded bg-[#0a0a0a] border-white/[0.1] text-red-500 focus:ring-red-500 focus:ring-offset-[#0a0a0a] cursor-pointer" /> Active
                                    </label>
                                    <label className="flex items-center gap-2 text-sm text-gray-300 cursor-pointer">
                                        <input type="checkbox" checked={planForm.isCustom} onChange={e => setPlanForm({ ...planForm, isCustom: e.target.checked })} disabled={!!editingPlan} className="rounded bg-[#0a0a0a] border-white/[0.1] text-red-500 focus:ring-red-500 focus:ring-offset-[#0a0a0a] cursor-pointer disabled:opacity-50" /> Custom Plan
                                    </label>
                                </div>
                                <div>
                                    <label className="block text-xs text-gray-400 mb-1">Trial Days</label>
                                    <input type="number" value={planForm.trialDays} onChange={e => setPlanForm({ ...planForm, trialDays: parseInt(e.target.value) || 0 })} className="w-full bg-[#0a0a0a] border border-white/[0.1] rounded-lg px-3 py-2 text-sm text-gray-300 focus:outline-none focus:border-red-500/50" />
                                </div>
                            </div>
                            <div>
                                <h3 className="text-sm font-semibold mb-3 border-b border-white/[0.08] pb-2">Plan Features (Limits)</h3>
                                <div className="grid grid-cols-2 gap-4">
                                    {Object.keys(planForm.features).filter(k => !k.startsWith('enable')).map(key => (
                                        <div key={key}>
                                            <label className="block text-xs text-gray-400 mb-1">{key}</label>
                                            <input type="number" value={(planForm.features as any)[key]} onChange={e => setPlanForm({ ...planForm, features: { ...planForm.features, [key]: parseInt(e.target.value) || 0 } })} className="w-full bg-[#0a0a0a] border border-white/[0.1] rounded-lg px-3 py-2 text-sm text-gray-300 focus:outline-none focus:border-red-500/50" />
                                        </div>
                                    ))}
                                </div>
                            </div>
                            <div>
                                <h3 className="text-sm font-semibold mb-3 border-b border-white/[0.08] pb-2">Feature Flags</h3>
                                <div className="grid grid-cols-2 gap-3">
                                    {Object.keys(planForm.features).filter(k => k.startsWith('enable')).map(key => (
                                        <label key={key} className="flex items-center gap-2 text-sm text-gray-300 cursor-pointer">
                                            <input type="checkbox" checked={(planForm.features as any)[key]} onChange={e => setPlanForm({ ...planForm, features: { ...planForm.features, [key]: e.target.checked } })} className="rounded bg-[#0a0a0a] border-white/[0.1] text-red-500 focus:ring-red-500 focus:ring-offset-[#0a0a0a] cursor-pointer" /> {key.replace('enable', '')}
                                        </label>
                                    ))}
                                </div>
                            </div>
                        </div>
                        <div className="p-6 border-t border-white/[0.08] flex justify-end gap-3 bg-[#0a0a0a]">
                            <button onClick={() => setIsPlanModalOpen(false)} className="px-4 py-2 text-sm text-gray-400 hover:text-white rounded-lg cursor-pointer">Cancel</button>
                            <button onClick={handleSavePlan} disabled={creatingPlan || updatingPlan} className="px-6 py-2 text-sm bg-red-600 hover:bg-red-500 text-white rounded-lg font-medium cursor-pointer disabled:opacity-50">
                                {creatingPlan || updatingPlan ? 'Saving...' : 'Save Plan'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Delete Plan Confirmation */}
            {deleteConfirmPlan && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={() => setDeleteConfirmPlan(null)}>
                    <div onClick={(e) => e.stopPropagation()} className="bg-[#0a0a0a] border border-white/[0.08] rounded-2xl p-6 w-full max-w-sm shadow-2xl">
                        <div className="flex items-center gap-3 mb-4">
                            <div className="p-2 bg-red-500/10 rounded-xl"><AlertTriangle className="w-5 h-5 text-red-400" /></div>
                            <div><h3 className="font-semibold text-sm">Delete Plan?</h3><p className="text-xs text-gray-500">This action cannot be undone.</p></div>
                        </div>
                        <div className="flex justify-end gap-2 mt-6">
                            <button onClick={() => setDeleteConfirmPlan(null)} className="px-4 py-2 text-sm text-gray-400 hover:text-white rounded-lg cursor-pointer">Cancel</button>
                            <button onClick={() => handleDeletePlan(deleteConfirmPlan)} disabled={deletingPlan} className="px-4 py-2 text-sm bg-red-600 hover:bg-red-500 text-white rounded-lg cursor-pointer disabled:opacity-50">Delete</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}
