import { useState } from 'react'
import { useQuery, useMutation } from '@apollo/client/react'
import { motion, AnimatePresence } from 'framer-motion'
import {
    CreditCard, Crown, Check, X, AlertTriangle,
    ArrowRight, Receipt, Clock,
    Globe, Webhook, Brain, Eye, MapPin
} from 'lucide-react'
import {
    GET_MY_SUBSCRIPTION, GET_AVAILABLE_PLANS, GET_MY_INVOICES,
    CREATE_SUBSCRIPTION, CANCEL_SUBSCRIPTION,
    GetMySubscriptionResponse, GetAvailablePlansResponse, GetMyInvoicesResponse,
    CreateSubscriptionResponse, SubscriptionPlan,
} from '@/lib/graphql/subscription-operations'
import { toast } from 'react-toastify'

declare global {
    interface Window { Razorpay: any }
}

const statusColors: Record<string, string> = {
    active: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
    created: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
    cancelled: 'bg-gray-500/10 text-gray-400 border-gray-500/20',
    paused: 'bg-orange-500/10 text-orange-400 border-orange-500/20',
    halted: 'bg-red-500/10 text-red-400 border-red-500/20',
    expired: 'bg-gray-500/10 text-gray-500 border-gray-500/20',
}

export default function SubscriptionPage() {
    const [cancelModal, setCancelModal] = useState(false)
    const [cancelAtEnd, setCancelAtEnd] = useState(true)
    const [tab, setTab] = useState<'plans' | 'invoices'>('plans')

    const { data: subData, loading: subLoading, refetch: refetchSub } = useQuery<GetMySubscriptionResponse>(GET_MY_SUBSCRIPTION)
    const { data: plansData, loading: plansLoading } = useQuery<GetAvailablePlansResponse>(GET_AVAILABLE_PLANS)
    const { data: invoicesData } = useQuery<GetMyInvoicesResponse>(GET_MY_INVOICES)

    const [createSub, { loading: creating }] = useMutation<CreateSubscriptionResponse>(CREATE_SUBSCRIPTION)
    const [cancelSub, { loading: cancelling }] = useMutation(CANCEL_SUBSCRIPTION)

    const subscription = subData?.getMySubscription
    const plans = plansData?.getAvailablePlans || []
    const invoices = invoicesData?.getMyInvoices || []
    const currentPlan = subscription?.plan

    const formatAmount = (amount: number) => amount === 0 ? 'Free' : `₹${(amount / 100).toLocaleString('en-IN')}`

    const handleSubscribe = async (plan: SubscriptionPlan) => {
        try {
            const { data } = await createSub({ variables: { planId: plan.id } })
            if (!data?.createSubscription) return

            const { razorpaySubscriptionId, razorpayKeyId, status } = data.createSubscription

            // Free plan — activated immediately
            if (status === 'active') {
                toast.success('Free plan activated!')
                refetchSub()
                return
            }

            // Paid plan — open Razorpay Checkout
            if (!razorpaySubscriptionId || !window.Razorpay) {
                toast.error('Razorpay checkout not available. Please refresh and try again.')
                return
            }

            const rzp = new window.Razorpay({
                key: razorpayKeyId,
                subscription_id: razorpaySubscriptionId,
                name: 'Visitor Intelligence',
                description: `${plan.name} Plan`,
                theme: { color: '#dc2626' },
                handler: () => {
                    toast.success('Payment successful! Your subscription will activate shortly.')
                    setTimeout(() => refetchSub(), 3000)
                },
                modal: {
                    ondismiss: () => toast.info('Payment cancelled'),
                },
            })
            rzp.open()
        } catch (err: any) {
            toast.error(err.message)
        }
    }

    const handleCancel = async () => {
        if (!subscription) return
        try {
            await cancelSub({ variables: { subscriptionId: subscription.subscriptionId, cancelAtPeriodEnd: cancelAtEnd } })
            toast.success(cancelAtEnd ? 'Subscription will cancel at period end' : 'Subscription cancelled immediately')
            setCancelModal(false)
            refetchSub()
        } catch (err: any) { toast.error(err.message) }
    }

    const usageItems = currentPlan ? [
        { label: 'Sites', used: subscription?.currentUsage.sitesCreated || 0, max: currentPlan.features.maxSites, icon: Globe },
        { label: 'Webhooks', used: subscription?.currentUsage.webhooksCreated || 0, max: currentPlan.features.maxWebhooks, icon: Webhook },
        { label: 'Sessions', used: subscription?.currentUsage.sessionsTracked || 0, max: currentPlan.features.maxSessionsPerMonth, icon: Eye },
        { label: 'AI Calls', used: subscription?.currentUsage.aiCallsMade || 0, max: currentPlan.features.maxAiCallsPerMonth, icon: Brain },
        { label: 'Crawl Pages', used: subscription?.currentUsage.crawlPagesUsed || 0, max: currentPlan.features.maxCrawlPages, icon: MapPin },
    ] : []

    return (
        <div className="max-w-5xl mx-auto space-y-8 pb-12">
            {/* Header */}
            <div>
                <h1 className="text-2xl font-bold tracking-tight">Subscription</h1>
                <p className="text-sm text-gray-500 mt-1">Manage your plan, view usage, and billing</p>
            </div>

            {/* Current Plan */}
            {subLoading ? (
                <div className="bg-[#111] border border-white/[0.06] rounded-2xl p-6 animate-pulse">
                    <div className="w-40 h-6 bg-white/[0.04] rounded mb-4" />
                    <div className="w-64 h-4 bg-white/[0.04] rounded" />
                </div>
            ) : subscription ? (
                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="relative overflow-hidden bg-gradient-to-br from-[#111] to-[#0a0a0a] border border-white/[0.08] rounded-2xl p-6">
                    <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-bl from-red-500/5 to-transparent rounded-full -translate-y-1/2 translate-x-1/2" />
                    <div className="relative">
                        <div className="flex items-start justify-between">
                            <div>
                                <div className="flex items-center gap-2 mb-1">
                                    <Crown className="w-5 h-5 text-amber-400" />
                                    <span className="text-lg font-bold">{currentPlan?.name || 'No Plan'}</span>
                                    <span className={`inline-flex items-center gap-1 text-[10px] font-medium px-2 py-0.5 rounded-full border ${statusColors[subscription.status] || ''}`}>
                                        <span className="w-1 h-1 rounded-full bg-current" />{subscription.status}
                                    </span>
                                </div>
                                <p className="text-sm text-gray-500">{currentPlan?.description}</p>
                                <div className="flex items-baseline gap-1 mt-2">
                                    <span className="text-3xl font-bold">{formatAmount(currentPlan?.amount || 0)}</span>
                                    {(currentPlan?.amount || 0) > 0 && <span className="text-sm text-gray-500">/{currentPlan?.period === 'monthly' ? 'month' : 'year'}</span>}
                                </div>
                            </div>
                            <div className="text-right text-xs text-gray-500 space-y-1">
                                {subscription.currentPeriodEnd && (
                                    <p className="flex items-center gap-1 justify-end"><Clock className="w-3 h-3" /> Renews {new Date(subscription.currentPeriodEnd).toLocaleDateString()}</p>
                                )}
                                <p>Payments made: {subscription.paidCount}</p>
                            </div>
                        </div>

                        {/* Usage meters */}
                        {usageItems.length > 0 && (
                            <div className="mt-6 grid grid-cols-2 md:grid-cols-5 gap-3">
                                {usageItems.map(item => {
                                    const pct = item.max === -1 ? 5 : Math.min((item.used / item.max) * 100, 100)
                                    const isUnlimited = item.max === -1
                                    return (
                                        <div key={item.label} className="bg-white/[0.03] rounded-xl p-3 border border-white/[0.04]">
                                            <div className="flex items-center gap-1.5 mb-2">
                                                <item.icon className="w-3.5 h-3.5 text-gray-500" />
                                                <span className="text-[10px] text-gray-500 uppercase tracking-wider">{item.label}</span>
                                            </div>
                                            <p className="text-lg font-bold">{item.used.toLocaleString()}<span className="text-xs text-gray-600 font-normal">/{isUnlimited ? '∞' : item.max.toLocaleString()}</span></p>
                                            <div className="w-full h-1.5 bg-white/[0.04] rounded-full mt-2 overflow-hidden">
                                                <div className={`h-full rounded-full transition-all duration-500 ${pct > 90 ? 'bg-red-500' : pct > 70 ? 'bg-amber-500' : 'bg-emerald-500'}`} style={{ width: `${pct}%` }} />
                                            </div>
                                        </div>
                                    )
                                })}
                            </div>
                        )}

                        {/* Cancel button */}
                        {['active', 'authenticated'].includes(subscription.status) && (
                            <div className="mt-4 pt-4 border-t border-white/[0.06] flex justify-end">
                                <button onClick={() => setCancelModal(true)} className="text-xs text-gray-500 hover:text-red-400 transition-colors cursor-pointer">Cancel subscription</button>
                            </div>
                        )}
                    </div>
                </motion.div>
            ) : (
                <div className="bg-[#111] border border-white/[0.06] rounded-2xl p-8 text-center">
                    <CreditCard className="w-10 h-10 mx-auto mb-3 text-gray-700" />
                    <h3 className="text-sm font-medium text-gray-400">No active subscription</h3>
                    <p className="text-xs text-gray-600 mt-1">Choose a plan below to get started</p>
                </div>
            )}

            {/* Tabs */}
            <div className="flex items-center gap-1 bg-[#0a0a0a] border border-white/[0.08] rounded-xl p-1 w-fit">
                {(['plans', 'invoices'] as const).map(t => (
                    <button key={t} onClick={() => setTab(t)} className={`px-4 py-2 rounded-lg text-xs font-medium transition-all cursor-pointer ${tab === t ? 'bg-white/[0.06] text-white' : 'text-gray-500 hover:text-gray-300'}`}>
                        {t === 'plans' ? 'Available Plans' : 'Billing History'}
                    </button>
                ))}
            </div>

            {/* Plans */}
            {tab === 'plans' && (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {plansLoading ? Array.from({ length: 3 }).map((_, i) => (
                        <div key={i} className="bg-[#0a0a0a] border border-white/[0.06] rounded-2xl p-6 animate-pulse">
                            <div className="w-24 h-5 bg-white/[0.04] rounded mb-3" /><div className="w-20 h-8 bg-white/[0.04] rounded mb-4" />
                            <div className="space-y-2">{Array.from({ length: 5 }).map((_, j) => <div key={j} className="w-full h-3 bg-white/[0.04] rounded" />)}</div>
                        </div>
                    )) : plans.map((plan, i) => {
                        const isCurrentPlan = currentPlan?.id === plan.id
                        return (
                            <motion.div key={plan.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
                                className={`relative bg-[#0a0a0a] border rounded-2xl p-6 transition-all duration-300 ${isCurrentPlan ? 'border-emerald-500/30 ring-1 ring-emerald-500/10' : 'border-white/[0.06] hover:border-white/[0.12]'}`}>
                                {plan.isCustom && (
                                    <div className="absolute top-3 right-3"><span className="text-[8px] uppercase tracking-wider text-purple-400 bg-purple-500/10 px-2 py-0.5 rounded-full border border-purple-500/20 flex items-center gap-1"><Crown className="w-2.5 h-2.5" /> Custom</span></div>
                                )}
                                {isCurrentPlan && (
                                    <div className="absolute top-3 right-3"><span className="text-[8px] uppercase tracking-wider text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20 flex items-center gap-1"><Check className="w-2.5 h-2.5" /> Current</span></div>
                                )}

                                <h3 className="text-lg font-bold">{plan.name}</h3>
                                <p className="text-xs text-gray-500 mt-0.5 line-clamp-2 min-h-[2rem]">{plan.description || ' '}</p>

                                <div className="mt-3 flex items-baseline gap-1">
                                    <span className="text-3xl font-bold">{formatAmount(plan.amount)}</span>
                                    {plan.amount > 0 && <span className="text-sm text-gray-500">/{plan.period === 'monthly' ? 'mo' : 'yr'}</span>}
                                </div>

                                <div className="mt-4 space-y-2">
                                    {[
                                        { label: `${plan.features.maxSites === -1 ? 'Unlimited' : plan.features.maxSites} Sites`, on: true },
                                        { label: `${plan.features.maxSessionsPerMonth === -1 ? 'Unlimited' : plan.features.maxSessionsPerMonth.toLocaleString()} Sessions/mo`, on: true },
                                        { label: `${plan.features.maxAiCallsPerMonth === -1 ? 'Unlimited' : plan.features.maxAiCallsPerMonth.toLocaleString()} AI Calls/mo`, on: true },
                                        { label: `${plan.features.dataRetentionDays} day retention`, on: true },
                                        { label: 'Behavior Tracking', on: plan.features.enableBehaviorTracking },
                                        { label: 'Geo Location', on: plan.features.enableGeoLocation },
                                        { label: 'UI Injection', on: plan.features.enableUiInjection },
                                        { label: 'Enrichment', on: plan.features.enableEnrichment },
                                    ].map((f, idx) => (
                                        <div key={idx} className="flex items-center gap-2">
                                            {f.on ? <Check className="w-3.5 h-3.5 text-emerald-400 flex-shrink-0" /> : <X className="w-3.5 h-3.5 text-gray-600 flex-shrink-0" />}
                                            <span className={`text-xs ${f.on ? 'text-gray-300' : 'text-gray-600'}`}>{f.label}</span>
                                        </div>
                                    ))}
                                </div>

                                <button onClick={() => handleSubscribe(plan)} disabled={isCurrentPlan || creating || (subscription?.status === 'active' && !isCurrentPlan)}
                                    className={`w-full mt-5 py-2.5 rounded-xl text-sm font-medium transition-all cursor-pointer flex items-center justify-center gap-2 ${isCurrentPlan ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 cursor-default'
                                        : subscription?.status === 'active' ? 'bg-white/[0.04] text-gray-500 border border-white/[0.06] cursor-not-allowed'
                                            : 'bg-gradient-to-r from-red-600 to-orange-600 hover:from-red-500 hover:to-orange-500 text-white shadow-lg shadow-red-500/10'
                                        }`}>
                                    {isCurrentPlan ? <><Check className="w-4 h-4" /> Current Plan</> :
                                        subscription?.status === 'active' ? 'Cancel current plan first' :
                                            creating ? 'Processing...' : <><ArrowRight className="w-4 h-4" /> Subscribe</>}
                                </button>
                            </motion.div>
                        )
                    })}
                </div>
            )}

            {/* Invoices */}
            {tab === 'invoices' && (
                <div className="bg-[#0a0a0a] border border-white/[0.06] rounded-2xl overflow-hidden">
                    {invoices.length === 0 ? (
                        <div className="py-16 text-center"><Receipt className="w-8 h-8 mx-auto mb-2 text-gray-700" /><p className="text-sm text-gray-500">No invoices yet</p></div>
                    ) : (
                        <table className="w-full">
                            <thead><tr className="border-b border-white/[0.06]">
                                {['Date', 'Plan', 'Amount', 'Period', 'Status', 'Payment ID'].map(h => (
                                    <th key={h} className="text-left px-4 py-3 text-[10px] text-gray-500 uppercase tracking-wider font-medium">{h}</th>
                                ))}
                            </tr></thead>
                            <tbody>
                                {invoices.map(inv => (
                                    <tr key={inv.id} className="border-b border-white/[0.04] hover:bg-white/[0.02]">
                                        <td className="px-4 py-3 text-xs text-gray-300">{inv.paidAt ? new Date(inv.paidAt).toLocaleDateString() : new Date(inv.createdAt).toLocaleDateString()}</td>
                                        <td className="px-4 py-3 text-xs text-gray-300">{inv.plan?.name || '—'}</td>
                                        <td className="px-4 py-3 text-xs text-gray-300 font-mono">₹{(inv.amount / 100).toLocaleString('en-IN')}</td>
                                        <td className="px-4 py-3 text-[10px] text-gray-500">{inv.billingPeriodStart && inv.billingPeriodEnd ? `${new Date(inv.billingPeriodStart).toLocaleDateString()} — ${new Date(inv.billingPeriodEnd).toLocaleDateString()}` : '—'}</td>
                                        <td className="px-4 py-3"><span className={`text-[10px] px-2 py-0.5 rounded-full border ${inv.status === 'paid' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' : 'bg-gray-500/10 text-gray-400 border-gray-500/20'}`}>{inv.status}</span></td>
                                        <td className="px-4 py-3 text-[10px] text-gray-600 font-mono">{inv.razorpayPaymentId || '—'}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    )}
                </div>
            )}

            {/* Cancel Modal */}
            <AnimatePresence>
                {cancelModal && subscription && (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50" onClick={() => setCancelModal(false)}>
                        <motion.div initial={{ scale: 0.95, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.95, y: 20 }} onClick={(e) => e.stopPropagation()}
                            className="bg-[#0a0a0a] border border-white/[0.08] rounded-2xl p-6 w-full max-w-md shadow-2xl">
                            <div className="flex items-center gap-3 mb-4">
                                <div className="p-2 bg-red-500/10 rounded-xl"><AlertTriangle className="w-5 h-5 text-red-400" /></div>
                                <div><h3 className="font-semibold text-sm">Cancel Subscription</h3><p className="text-xs text-gray-500">Choose how to cancel your {currentPlan?.name} plan</p></div>
                            </div>
                            <div className="space-y-2 mb-6">
                                <label className="flex items-start gap-3 p-3 bg-white/[0.02] rounded-xl border border-white/[0.06] cursor-pointer hover:bg-white/[0.04] transition-colors" onClick={() => setCancelAtEnd(true)}>
                                    <input type="radio" name="cancelType" checked={cancelAtEnd} onChange={() => setCancelAtEnd(true)} className="mt-0.5 accent-red-500" />
                                    <div><p className="text-sm font-medium">Cancel at period end</p><p className="text-xs text-gray-500">Keep access until {subscription.currentPeriodEnd ? new Date(subscription.currentPeriodEnd).toLocaleDateString() : 'current period ends'}</p></div>
                                </label>
                                <label className="flex items-start gap-3 p-3 bg-white/[0.02] rounded-xl border border-white/[0.06] cursor-pointer hover:bg-white/[0.04] transition-colors" onClick={() => setCancelAtEnd(false)}>
                                    <input type="radio" name="cancelType" checked={!cancelAtEnd} onChange={() => setCancelAtEnd(false)} className="mt-0.5 accent-red-500" />
                                    <div><p className="text-sm font-medium">Cancel immediately</p><p className="text-xs text-gray-500">Lose access right away. No refund.</p></div>
                                </label>
                            </div>
                            <div className="flex justify-end gap-2">
                                <button onClick={() => setCancelModal(false)} className="px-4 py-2 text-sm text-gray-400 hover:text-white rounded-lg cursor-pointer">Keep Plan</button>
                                <button onClick={handleCancel} disabled={cancelling} className="px-4 py-2 text-sm bg-red-600 hover:bg-red-500 text-white rounded-lg cursor-pointer disabled:opacity-50">
                                    {cancelling ? 'Cancelling...' : 'Confirm Cancel'}
                                </button>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    )
}
