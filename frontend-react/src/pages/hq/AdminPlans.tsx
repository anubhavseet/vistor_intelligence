import { useState } from 'react'
import { useQuery, useMutation } from '@apollo/client/react'
import { motion, AnimatePresence } from 'framer-motion'
import {
    Plus, Search, X, Edit3, Trash2,
    Crown, Zap
} from 'lucide-react'
import {
    ADMIN_GET_ALL_PLANS, ADMIN_CREATE_PLAN, ADMIN_UPDATE_PLAN, ADMIN_DELETE_PLAN,
    AdminGetAllPlansResponse, SubscriptionPlan
} from '@/lib/graphql/subscription-operations'
import { ADMIN_GET_ALL_USERS, AdminGetAllUsersResponse } from '@/lib/graphql/admin-operations'
import { toast } from 'react-toastify'

const defaultFeatures = {
    maxSites: 1, maxWebhooks: 1, maxSessionsPerMonth: 1000,
    maxAiCallsPerMonth: 50, maxCrawlPages: 10, dataRetentionDays: 7,
    enableBehaviorTracking: false, enableGeoLocation: false,
    enableUiInjection: false, enableEnrichment: false, enableCustomWebhooks: false,
}

export default function AdminPlansPage() {
    const [search, setSearch] = useState('')
    const [showModal, setShowModal] = useState(false)
    const [editingPlan, setEditingPlan] = useState<SubscriptionPlan | null>(null)
    const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null)

    const [form, setForm] = useState({
        name: '', description: '', amount: 0, period: 'monthly' as 'monthly' | 'yearly',
        isCustom: false, assignedUserId: '', features: { ...defaultFeatures }, sortOrder: 0,
    })

    const { data, loading, refetch } = useQuery<AdminGetAllPlansResponse>(ADMIN_GET_ALL_PLANS)
    const { data: usersData } = useQuery<AdminGetAllUsersResponse>(ADMIN_GET_ALL_USERS)
    const [createPlan] = useMutation(ADMIN_CREATE_PLAN)
    const [updatePlan] = useMutation(ADMIN_UPDATE_PLAN)
    const [deletePlan] = useMutation(ADMIN_DELETE_PLAN)

    const plans = data?.adminGetAllPlans || []
    const users = usersData?.users || []
    const filtered = plans.filter(p => p.name.toLowerCase().includes(search.toLowerCase()))

    const openCreateModal = () => {
        setEditingPlan(null)
        setForm({ name: '', description: '', amount: 0, period: 'monthly', isCustom: false, assignedUserId: '', features: { ...defaultFeatures }, sortOrder: 0 })
        setShowModal(true)
    }

    const openEditModal = (plan: SubscriptionPlan) => {
        setEditingPlan(plan)
        setForm({
            name: plan.name, description: plan.description, amount: plan.amount,
            period: plan.period, isCustom: plan.isCustom,
            assignedUserId: plan.assignedUserId || '', features: { ...plan.features }, sortOrder: plan.sortOrder,
        })
        setShowModal(true)
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        try {
            if (editingPlan) {
                await updatePlan({
                    variables: {
                        id: editingPlan.id,
                        input: { name: form.name, description: form.description, features: form.features, sortOrder: form.sortOrder },
                    },
                })
                toast.success('Plan updated')
            } else {
                await createPlan({
                    variables: {
                        input: {
                            name: form.name, description: form.description, amount: form.amount,
                            period: form.period.toUpperCase(), isCustom: form.isCustom,
                            assignedUserId: form.isCustom ? form.assignedUserId : undefined,
                            features: form.features, sortOrder: form.sortOrder,
                        },
                    },
                })
                toast.success('Plan created')
            }
            setShowModal(false)
            refetch()
        } catch (err: any) {
            toast.error(err.message)
        }
    }

    const handleDelete = async (id: string) => {
        try {
            await deletePlan({ variables: { id } })
            toast.success('Plan deactivated')
            setDeleteConfirm(null)
            refetch()
        } catch (err: any) {
            toast.error(err.message)
        }
    }

    const formatAmount = (amount: number) => amount === 0 ? 'Free' : `₹${(amount / 100).toLocaleString('en-IN')}`

    return (
        <div className="space-y-6 max-w-[1400px]">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight">Plan Management</h1>
                    <p className="text-sm text-gray-500 mt-1">Create and manage subscription plans for the platform</p>
                </div>
                <button onClick={openCreateModal} className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-red-600 to-orange-600 hover:from-red-500 hover:to-orange-500 text-white text-sm font-medium rounded-xl transition-all cursor-pointer">
                    <Plus className="w-4 h-4" /> Create Plan
                </button>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                {[
                    { label: 'Total Plans', value: plans.length, color: 'text-blue-400' },
                    { label: 'Active', value: plans.filter(p => p.isActive).length, color: 'text-emerald-400' },
                    { label: 'Custom Plans', value: plans.filter(p => p.isCustom).length, color: 'text-purple-400' },
                    { label: 'Paid Plans', value: plans.filter(p => p.amount > 0).length, color: 'text-amber-400' },
                ].map(stat => (
                    <div key={stat.label} className="bg-[#0a0a0a] border border-white/[0.06] rounded-xl px-4 py-3 flex items-center justify-between">
                        <span className="text-xs text-gray-500">{stat.label}</span>
                        <span className={`text-lg font-bold ${stat.color}`}>{loading ? '—' : stat.value}</span>
                    </div>
                ))}
            </div>

            {/* Search */}
            <div className="relative">
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                <input type="text" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search plans..." className="w-full pl-10 pr-4 py-2.5 bg-[#0a0a0a] border border-white/[0.08] rounded-xl text-sm text-white placeholder-gray-600 focus:outline-none focus:border-red-500/30 transition-colors" />
            </div>

            {/* Plans Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                {loading ? Array.from({ length: 3 }).map((_, i) => (
                    <div key={i} className="bg-[#0a0a0a] border border-white/[0.06] rounded-2xl p-6 animate-pulse">
                        <div className="w-20 h-5 bg-white/[0.04] rounded mb-3" />
                        <div className="w-16 h-8 bg-white/[0.04] rounded mb-4" />
                        <div className="space-y-2"><div className="w-full h-3 bg-white/[0.04] rounded" /><div className="w-3/4 h-3 bg-white/[0.04] rounded" /></div>
                    </div>
                )) : filtered.map((plan, i) => (
                    <motion.div key={plan.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
                        className={`relative bg-[#0a0a0a] border rounded-2xl p-6 transition-all duration-300 ${plan.isActive ? 'border-white/[0.06] hover:border-white/[0.1]' : 'border-red-500/10 opacity-60'}`}>
                        {plan.isCustom && <div className="absolute top-3 right-3"><Crown className="w-4 h-4 text-purple-400" /></div>}
                        <div className="flex items-center gap-2 mb-1">
                            <span className={`inline-flex items-center gap-1 text-[9px] font-medium px-2 py-0.5 rounded-full ${plan.isActive ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-red-500/10 text-red-400 border border-red-500/20'}`}>
                                <span className={`w-1 h-1 rounded-full ${plan.isActive ? 'bg-emerald-400' : 'bg-red-400'}`} />
                                {plan.isActive ? 'Active' : 'Inactive'}
                            </span>
                            {plan.isCustom && <span className="text-[9px] font-medium px-2 py-0.5 rounded-full bg-purple-500/10 text-purple-400 border border-purple-500/20">Custom</span>}
                        </div>
                        <h3 className="text-lg font-bold mt-2">{plan.name}</h3>
                        <p className="text-xs text-gray-500 mt-0.5 line-clamp-2">{plan.description || 'No description'}</p>
                        <div className="mt-3 flex items-baseline gap-1">
                            <span className="text-2xl font-bold text-white">{formatAmount(plan.amount)}</span>
                            {plan.amount > 0 && <span className="text-xs text-gray-500">/{plan.period === 'monthly' ? 'mo' : 'yr'}</span>}
                        </div>

                        <div className="mt-4 space-y-1.5">
                            {[
                                { label: 'Sites', value: plan.features.maxSites === -1 ? '∞' : plan.features.maxSites },
                                { label: 'Webhooks', value: plan.features.maxWebhooks === -1 ? '∞' : plan.features.maxWebhooks },
                                { label: 'Sessions/mo', value: plan.features.maxSessionsPerMonth === -1 ? '∞' : plan.features.maxSessionsPerMonth.toLocaleString() },
                                { label: 'AI Calls/mo', value: plan.features.maxAiCallsPerMonth === -1 ? '∞' : plan.features.maxAiCallsPerMonth.toLocaleString() },
                                { label: 'Retention', value: `${plan.features.dataRetentionDays}d` },
                            ].map(f => (
                                <div key={f.label} className="flex items-center justify-between text-xs">
                                    <span className="text-gray-500">{f.label}</span>
                                    <span className="text-gray-300 font-mono">{f.value}</span>
                                </div>
                            ))}
                        </div>

                        <div className="mt-3 flex flex-wrap gap-1">
                            {[
                                { label: 'Behavior', on: plan.features.enableBehaviorTracking },
                                { label: 'Geo', on: plan.features.enableGeoLocation },
                                { label: 'UI Inject', on: plan.features.enableUiInjection },
                                { label: 'Enrich', on: plan.features.enableEnrichment },
                            ].map(f => (
                                <span key={f.label} className={`text-[8px] px-1.5 py-0.5 rounded font-mono ${f.on ? 'bg-emerald-500/10 text-emerald-400' : 'bg-white/[0.02] text-gray-600'}`}>{f.label}</span>
                            ))}
                        </div>

                        <div className="mt-4 pt-3 border-t border-white/[0.04] flex items-center justify-end gap-1">
                            <button onClick={() => openEditModal(plan)} className="p-1.5 hover:bg-white/[0.06] rounded-lg text-gray-500 hover:text-blue-400 cursor-pointer"><Edit3 className="w-3.5 h-3.5" /></button>
                            <button onClick={() => setDeleteConfirm(plan.id)} className="p-1.5 hover:bg-red-500/10 rounded-lg text-gray-500 hover:text-red-400 cursor-pointer"><Trash2 className="w-3.5 h-3.5" /></button>
                        </div>
                    </motion.div>
                ))}
            </div>

            {/* Create/Edit Modal */}
            <AnimatePresence>
                {showModal && (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50" onClick={() => setShowModal(false)}>
                        <motion.div initial={{ scale: 0.95, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.95, y: 20 }} onClick={(e) => e.stopPropagation()}
                            className="bg-[#0a0a0a] border border-white/[0.08] rounded-2xl w-full max-w-xl shadow-2xl max-h-[85vh] overflow-y-auto custom-scrollbar">
                            <div className="sticky top-0 bg-[#0a0a0a] px-6 py-4 border-b border-white/[0.06] flex items-center justify-between z-10">
                                <h3 className="font-semibold">{editingPlan ? 'Edit Plan' : 'Create New Plan'}</h3>
                                <button onClick={() => setShowModal(false)} className="text-gray-500 hover:text-white cursor-pointer"><X className="w-5 h-5" /></button>
                            </div>
                            <form onSubmit={handleSubmit} className="p-6 space-y-4">
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="text-xs text-gray-400 uppercase tracking-wider">Name</label>
                                        <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required className="w-full mt-1 px-3 py-2 bg-white/[0.04] border border-white/[0.08] rounded-lg text-sm text-white focus:outline-none focus:border-red-500/30" />
                                    </div>
                                    <div>
                                        <label className="text-xs text-gray-400 uppercase tracking-wider">Amount (paise)</label>
                                        <input type="number" value={form.amount} onChange={(e) => setForm({ ...form, amount: Number(e.target.value) })} disabled={!!editingPlan} className="w-full mt-1 px-3 py-2 bg-white/[0.04] border border-white/[0.08] rounded-lg text-sm text-white focus:outline-none focus:border-red-500/30 disabled:opacity-50" />
                                        <p className="text-[10px] text-gray-600 mt-0.5">₹{(form.amount / 100).toFixed(0)}</p>
                                    </div>
                                </div>
                                <div>
                                    <label className="text-xs text-gray-400 uppercase tracking-wider">Description</label>
                                    <textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} rows={2} className="w-full mt-1 px-3 py-2 bg-white/[0.04] border border-white/[0.08] rounded-lg text-sm text-white focus:outline-none focus:border-red-500/30 resize-none" />
                                </div>
                                {!editingPlan && (
                                    <>
                                        <div className="grid grid-cols-2 gap-4">
                                            <div>
                                                <label className="text-xs text-gray-400 uppercase tracking-wider">Period</label>
                                                <select value={form.period} onChange={(e) => setForm({ ...form, period: e.target.value as any })} className="w-full mt-1 px-3 py-2 bg-white/[0.04] border border-white/[0.08] rounded-lg text-sm text-white focus:outline-none cursor-pointer">
                                                    <option value="monthly">Monthly</option>
                                                    <option value="yearly">Yearly</option>
                                                </select>
                                            </div>
                                            <div className="flex items-center gap-3 pt-5">
                                                <label className="flex items-center gap-2 cursor-pointer">
                                                    <input type="checkbox" checked={form.isCustom} onChange={(e) => setForm({ ...form, isCustom: e.target.checked })} className="accent-red-500" />
                                                    <span className="text-xs text-gray-400">Custom Plan</span>
                                                </label>
                                            </div>
                                        </div>
                                        {form.isCustom && (
                                            <div>
                                                <label className="text-xs text-gray-400 uppercase tracking-wider">Assign to User</label>
                                                <select value={form.assignedUserId} onChange={(e) => setForm({ ...form, assignedUserId: e.target.value })} className="w-full mt-1 px-3 py-2 bg-white/[0.04] border border-white/[0.08] rounded-lg text-sm text-white focus:outline-none cursor-pointer">
                                                    <option value="">Select user...</option>
                                                    {users.map((u: any) => <option key={u.id} value={u.id}>{u.name} ({u.email})</option>)}
                                                </select>
                                            </div>
                                        )}
                                    </>
                                )}

                                <div className="border-t border-white/[0.06] pt-4">
                                    <h4 className="text-xs text-gray-400 uppercase tracking-wider mb-3 flex items-center gap-1.5"><Zap className="w-3 h-3" /> Feature Limits</h4>
                                    <div className="grid grid-cols-2 gap-3">
                                        {([
                                            ['maxSites', 'Max Sites'], ['maxWebhooks', 'Max Webhooks'],
                                            ['maxSessionsPerMonth', 'Sessions/Month'], ['maxAiCallsPerMonth', 'AI Calls/Month'],
                                            ['maxCrawlPages', 'Crawl Pages'], ['dataRetentionDays', 'Retention (days)'],
                                        ] as const).map(([key, label]) => (
                                            <div key={key}>
                                                <label className="text-[10px] text-gray-500">{label} <span className="text-gray-700">(-1 = unlimited)</span></label>
                                                <input type="number" value={(form.features as any)[key]} onChange={(e) => setForm({ ...form, features: { ...form.features, [key]: Number(e.target.value) } })}
                                                    className="w-full mt-0.5 px-3 py-1.5 bg-white/[0.04] border border-white/[0.08] rounded-lg text-xs text-white focus:outline-none focus:border-red-500/30" />
                                            </div>
                                        ))}
                                    </div>
                                    <div className="grid grid-cols-2 gap-3 mt-3">
                                        {([
                                            ['enableBehaviorTracking', 'Behavior Tracking'], ['enableGeoLocation', 'Geo Location'],
                                            ['enableUiInjection', 'UI Injection'], ['enableEnrichment', 'Enrichment'],
                                            ['enableCustomWebhooks', 'Custom Webhooks'],
                                        ] as const).map(([key, label]) => (
                                            <label key={key} className="flex items-center gap-2 cursor-pointer">
                                                <input type="checkbox" checked={(form.features as any)[key]} onChange={(e) => setForm({ ...form, features: { ...form.features, [key]: e.target.checked } })} className="accent-red-500" />
                                                <span className="text-xs text-gray-400">{label}</span>
                                            </label>
                                        ))}
                                    </div>
                                </div>

                                <div className="flex justify-end gap-2 pt-2">
                                    <button type="button" onClick={() => setShowModal(false)} className="px-4 py-2 text-sm text-gray-400 hover:text-white rounded-lg hover:bg-white/[0.04] cursor-pointer">Cancel</button>
                                    <button type="submit" className="px-4 py-2 text-sm bg-gradient-to-r from-red-600 to-orange-600 hover:from-red-500 hover:to-orange-500 text-white rounded-lg cursor-pointer">{editingPlan ? 'Update' : 'Create'}</button>
                                </div>
                            </form>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Delete Confirmation */}
            <AnimatePresence>
                {deleteConfirm && (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50" onClick={() => setDeleteConfirm(null)}>
                        <motion.div initial={{ scale: 0.95 }} animate={{ scale: 1 }} exit={{ scale: 0.95 }} onClick={(e) => e.stopPropagation()} className="bg-[#0a0a0a] border border-white/[0.08] rounded-2xl p-6 w-full max-w-sm shadow-2xl">
                            <div className="flex items-center gap-3 mb-4">
                                <div className="p-2 bg-red-500/10 rounded-xl"><Trash2 className="w-5 h-5 text-red-400" /></div>
                                <div><h3 className="font-semibold text-sm">Deactivate Plan</h3><p className="text-xs text-gray-500">This will deactivate the plan (existing subscriptions continue)</p></div>
                            </div>
                            <div className="flex justify-end gap-2 mt-6">
                                <button onClick={() => setDeleteConfirm(null)} className="px-4 py-2 text-sm text-gray-400 hover:text-white rounded-lg hover:bg-white/[0.04] cursor-pointer">Cancel</button>
                                <button onClick={() => handleDelete(deleteConfirm)} className="px-4 py-2 text-sm bg-red-600 hover:bg-red-500 text-white rounded-lg cursor-pointer">Deactivate</button>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    )
}
