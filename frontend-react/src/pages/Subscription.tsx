import { useState } from 'react'
import { useQuery, useMutation, useLazyQuery } from '@apollo/client/react'
import { motion, AnimatePresence } from 'framer-motion'
import {
    CreditCard, Crown, Check, X, AlertTriangle,
    ArrowRight, Receipt, Clock, Play, Pause,
    Globe, Webhook, Brain, Eye, MapPin
} from 'lucide-react'
import {
    GET_MY_SUBSCRIPTION, GET_AVAILABLE_PLANS, GET_MY_INVOICES,
    CREATE_SUBSCRIPTION, CANCEL_SUBSCRIPTION, CHANGE_PLAN,
    GET_INVOICE_DOWNLOAD_URL, PAUSE_SUBSCRIPTION, RESUME_SUBSCRIPTION,
    GetMySubscriptionResponse, GetAvailablePlansResponse, GetMyInvoicesResponse,
    CreateSubscriptionResponse, ChangePlanResponse, GetInvoiceDownloadUrlResponse, SubscriptionPlan,
} from '@/lib/graphql/subscription-operations'
import { toast } from 'react-toastify'

declare global {
    interface Window { Razorpay: any }
}

const statusColors: Record<string, string> = {
    active: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
    authenticated: 'bg-cyan-500/10 text-cyan-400 border-cyan-500/20',
    created: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
    pending: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
    cancelled: 'bg-gray-500/10 text-gray-400 border-gray-500/20',
    completed: 'bg-purple-500/10 text-purple-400 border-purple-500/20',
    paused: 'bg-orange-500/10 text-orange-400 border-orange-500/20',
    halted: 'bg-red-500/10 text-red-400 border-red-500/20',
    expired: 'bg-gray-500/10 text-gray-500 border-gray-500/20',
}

export default function SubscriptionPage() {
    const [cancelModal, setCancelModal] = useState(false)
    const [planChangeModal, setPlanChangeModal] = useState<{ open: boolean, plan: SubscriptionPlan | null }>({ open: false, plan: null })
    const [tab, setTab] = useState<'plans' | 'invoices'>('plans')
    // Cache the Razorpay key ID after first use so the Complete Payment button can re-open checkout
    const [cachedRazorpayKeyId, setCachedRazorpayKeyId] = useState<string>(
        import.meta.env.VITE_RAZORPAY_KEY_ID || ''
    )

    const { data: subData, loading: subLoading, refetch: refetchSub } = useQuery<GetMySubscriptionResponse>(GET_MY_SUBSCRIPTION)
    const { data: plansData, loading: plansLoading } = useQuery<GetAvailablePlansResponse>(GET_AVAILABLE_PLANS)
    const { data: invoicesData } = useQuery<GetMyInvoicesResponse>(GET_MY_INVOICES)

    const [createSub, { loading: creating }] = useMutation<CreateSubscriptionResponse>(CREATE_SUBSCRIPTION)
    const [cancelSub, { loading: cancelling }] = useMutation(CANCEL_SUBSCRIPTION)
    const [changePlanMut, { loading: changingPlan }] = useMutation<ChangePlanResponse>(CHANGE_PLAN)
    const [pauseSub, { loading: pausing }] = useMutation(PAUSE_SUBSCRIPTION)
    const [resumeSub, { loading: resuming }] = useMutation(RESUME_SUBSCRIPTION)
    const [fetchDownloadUrl] = useLazyQuery<GetInvoiceDownloadUrlResponse>(GET_INVOICE_DOWNLOAD_URL)

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

            openRazorpayCheckout(razorpaySubscriptionId, razorpayKeyId, plan.name)
            setCachedRazorpayKeyId(razorpayKeyId)
        } catch (err: any) {
            toast.error(err.message)
        }
    }

    // Opens Razorpay checkout — reusable for initial subscribe and for resuming a pending payment
    const openRazorpayCheckout = (razorpaySubscriptionId: string, razorpayKeyId: string, planName: string) => {
        if (!window.Razorpay) {
            toast.error('Razorpay checkout not available. Please refresh and try again.')
            return
        }
        const rzp = new window.Razorpay({
            key: razorpayKeyId,
            subscription_id: razorpaySubscriptionId,
            name: 'Visitor Intelligence',
            description: `${planName} Plan`,
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
    }

    const handleChangePlan = async (plan: SubscriptionPlan) => {
        try {
            const { data } = await changePlanMut({ variables: { newPlanId: plan.id } })
            if (!data?.changePlan) return

            const { razorpaySubscriptionId, razorpayKeyId, status } = data.changePlan

            // If status is active, it means it was a free plan change or an immediate update handled by the backend
            if (status === 'active' || plan.amount === 0) {
                toast.success(`Plan successfully updated to ${plan.name}`)
                setPlanChangeModal({ open: false, plan: null })
                refetchSub()
                return
            }

            // If it's a paid upgrade that requires new payment/authentication
            if (razorpaySubscriptionId && razorpayKeyId) {
                openRazorpayCheckout(razorpaySubscriptionId, razorpayKeyId, `${plan.name} Plan Update`)
                setPlanChangeModal({ open: false, plan: null })
            } else {
                // Fallback if no razorpay ID (e.g. backend handled it)
                toast.success(`Plan updating to ${plan.name}...`)
                setPlanChangeModal({ open: false, plan: null })
                setTimeout(() => refetchSub(), 2000)
            }
        } catch (err: any) {
            toast.error(err.message)
        }
    }

    const handleCancel = async () => {
        if (!subscription) return
        try {
            await cancelSub({ variables: { subscriptionId: subscription.subscriptionId, cancelAtPeriodEnd: true } })
            toast.success('Subscription scheduled for cancellation at period end')
            setCancelModal(false)
            refetchSub()
        } catch (err: any) { toast.error(err.message) }
    }

    const handlePause = async () => {
        if (!subscription) return
        try {
            await pauseSub({ variables: { subscriptionId: subscription.subscriptionId } })
            toast.success('Subscription paused')
            refetchSub()
        } catch (err: any) { toast.error(err.message) }
    }

    const handleResume = async () => {
        if (!subscription) return
        try {
            await resumeSub({ variables: { subscriptionId: subscription.subscriptionId } })
            toast.success('Subscription resumed')
            refetchSub()
        } catch (err: any) { toast.error(err.message) }
    }

    const handleCompletePayment = () => {
        if (!subscription?.razorpaySubscriptionId || !cachedRazorpayKeyId) {
            // If key ID isn't cached, instruct user to refresh — it will be fetched on next subscribe attempt
            toast.info('Please refresh the page and try again, or contact support if the issue persists.')
            return
        }
        openRazorpayCheckout(
            subscription.razorpaySubscriptionId,
            cachedRazorpayKeyId,
            currentPlan?.name || 'Subscription'
        )
    }

    const handleDownloadInvoice = async (invoiceId: string, directUrl?: string) => {
        if (directUrl) {
            window.open(directUrl, '_blank')
            return
        }

        try {
            const { data } = await fetchDownloadUrl({ variables: { invoiceId } })
            if (data?.getInvoiceDownloadUrl) {
                window.open(data.getInvoiceDownloadUrl, '_blank')
            }
        } catch (err: any) {
            toast.error(err.message)
        }
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

                        {/* Action row: Complete Payment / Pause / Resume / Cancel */}
                        <div className="mt-4 pt-4 border-t border-white/[0.06] flex items-center justify-between gap-3">
                            <div className="flex items-center gap-2">
                                {/* Complete Payment CTA — shown for pending payment states */}
                                {['created', 'authenticated'].includes(subscription.status) && subscription.razorpaySubscriptionId && (
                                    <button
                                        onClick={handleCompletePayment}
                                        className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium bg-blue-600 hover:bg-blue-500 text-white rounded-lg transition-all cursor-pointer"
                                    >
                                        <CreditCard className="w-3.5 h-3.5" /> Complete Payment
                                    </button>
                                )}
                                {/* Pause — only for active paid subscriptions */}
                                {subscription.status === 'active' && subscription.razorpaySubscriptionId && !subscription.cancelAtPeriodEnd && (
                                    <button
                                        onClick={handlePause}
                                        disabled={pausing}
                                        className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-orange-400 bg-orange-500/10 border border-orange-500/20 hover:bg-orange-500/20 rounded-lg transition-all cursor-pointer disabled:opacity-50"
                                    >
                                        <Pause className="w-3.5 h-3.5" /> {pausing ? 'Pausing...' : 'Pause'}
                                    </button>
                                )}
                                {/* Resume — only for paused subscriptions */}
                                {subscription.status === 'paused' && (
                                    <button
                                        onClick={handleResume}
                                        disabled={resuming}
                                        className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 hover:bg-emerald-500/20 rounded-lg transition-all cursor-pointer disabled:opacity-50"
                                    >
                                        <Play className="w-3.5 h-3.5" /> {resuming ? 'Resuming...' : 'Resume'}
                                    </button>
                                )}
                            </div>
                            <div className="flex items-center gap-2">
                                {subscription.cancelAtPeriodEnd ? (
                                    <span className="text-xs text-orange-400">Cancels at period end</span>
                                ) : (
                                    subscription && !['cancelled', 'completed', 'expired'].includes(subscription.status) && (
                                        <button onClick={() => setCancelModal(true)} className="text-xs text-gray-500 hover:text-red-400 transition-colors cursor-pointer">Cancel subscription</button>
                                    )
                                )}
                            </div>
                        </div>
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
                        const isOngoingStatus = subscription && !['cancelled', 'completed', 'expired'].includes(subscription.status)
                        const canChangePlan = isOngoingStatus && !subscription.cancelAtPeriodEnd
                        const actionType = isCurrentPlan ? 'current' : canChangePlan && plan.amount > (currentPlan?.amount || 0) ? 'upgrade' : canChangePlan ? 'downgrade' : 'subscribe'

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
                                {plan.trialDays > 0 && (
                                    <span className="text-[10px] text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">
                                        {plan.trialDays} day trial included
                                    </span>
                                )}
                                <p className="text-xs text-gray-500 mt-0.5 line-clamp-2 min-h-[2rem]">{plan.description || ' '}</p>

                                <div className="mt-3 flex items-baseline gap-1">
                                    <span className="text-3xl font-bold">{formatAmount(plan.amount)}</span>
                                    {plan.amount > 0 && <span className="text-sm text-gray-500">/{plan.period === 'monthly' ? 'mo' : 'yr'}</span>}
                                </div>

                                <div className="mt-4 space-y-2">
                                    {[
                                        { label: `${plan.features.maxSites === -1 ? 'Unlimited' : plan.features.maxSites} Sites`, on: true },
                                        { label: `${plan.features.maxWebhooks === -1 ? 'Unlimited' : plan.features.maxWebhooks} Webhooks`, on: true },
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

                                <button onClick={() => {
                                    if (isCurrentPlan) return
                                    if (canChangePlan) {
                                        setPlanChangeModal({ open: true, plan })
                                    } else {
                                        handleSubscribe(plan)
                                    }
                                }} disabled={isCurrentPlan || creating || changingPlan || (subscription?.cancelAtPeriodEnd)}
                                    className={`w-full mt-5 py-2.5 rounded-xl text-sm font-medium transition-all cursor-pointer flex items-center justify-center gap-2 ${isCurrentPlan ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 cursor-default'
                                        : actionType === 'upgrade' ? 'bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white shadow-lg shadow-emerald-500/10'
                                            : actionType === 'downgrade' ? 'bg-white/[0.06] text-orange-400 border border-orange-500/20 hover:bg-orange-500/10'
                                                : subscription?.cancelAtPeriodEnd ? 'bg-white/[0.04] text-gray-500 cursor-not-allowed'
                                                    : 'bg-gradient-to-r from-red-600 to-orange-600 hover:from-red-500 hover:to-orange-500 text-white shadow-lg shadow-red-500/10'
                                        }`}>
                                    {isCurrentPlan ? <><Check className="w-4 h-4" /> Current Plan</> :
                                        actionType === 'upgrade' ? <><ArrowRight className="w-4 h-4" /> Upgrade</> :
                                            actionType === 'downgrade' ? <><ArrowRight className="w-4 h-4" /> Downgrade</> :
                                                subscription?.cancelAtPeriodEnd ? 'Cancels at period end' :
                                                    (creating || changingPlan) ? 'Processing...' : <><ArrowRight className="w-4 h-4" /> Subscribe</>}
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
                                {['Date', 'Plan', 'Amount', 'Period', 'Status', 'Payment ID', 'Action'].map(h => (
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
                                        <td className="px-4 py-3">
                                            {inv.status === 'paid' ? (
                                                <button
                                                    onClick={() => handleDownloadInvoice(inv.invoiceId, inv.receiptUrl)}
                                                    className="inline-flex items-center gap-1.5 px-2 py-1 rounded bg-white/[0.05] border border-white/[0.1] text-[10px] text-gray-400 hover:text-white hover:bg-white/[0.1] transition-all cursor-pointer"
                                                >
                                                    <Receipt className="w-3 h-3" /> Download
                                                </button>
                                            ) : (
                                                <span className="text-[10px] text-gray-700 italic">Not available</span>
                                            )}
                                        </td>
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
                            className="bg-[#0a0a0a] border border-white/[0.08] rounded-2xl p-6 w-full max-w-sm shadow-2xl">
                            <div className="flex flex-col items-center text-center p-4">
                                <div className="p-3 bg-red-500/10 rounded-2xl mb-4"><AlertTriangle className="w-8 h-8 text-red-400" /></div>
                                <h3 className="text-lg font-bold mb-2">Cancel Subscription?</h3>
                                <p className="text-sm text-gray-400">
                                    Your subscription will remain active until the end of your current billing cycle on
                                    <span className="text-white ml-1 font-medium">
                                        {subscription.currentPeriodEnd ? new Date(subscription.currentPeriodEnd).toLocaleDateString() : 'the next renewal date'}
                                    </span>.
                                </p>
                                <div className="mt-4 p-3 bg-white/[0.02] border border-white/[0.06] rounded-xl text-[11px] text-gray-500 text-left">
                                    <p className="flex items-center gap-2 mb-1"><Check className="w-3 h-3 text-emerald-500" /> Continue using all features until period end</p>
                                    <p className="flex items-center gap-2"><Check className="w-3 h-3 text-emerald-500" /> No further charges will be made</p>
                                </div>
                            </div>
                            <div className="grid grid-cols-2 gap-3 mt-4">
                                <button onClick={() => setCancelModal(false)} className="px-4 py-2 text-sm font-medium text-gray-400 hover:text-white bg-white/[0.04] rounded-xl transition-colors cursor-pointer">Keep Plan</button>
                                <button onClick={handleCancel} disabled={cancelling} className="px-4 py-2 text-sm font-medium bg-red-600 hover:bg-red-500 text-white rounded-xl transition-all cursor-pointer disabled:opacity-50">
                                    {cancelling ? 'Processing...' : 'Confirm Cancel'}
                                </button>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Plan Change Modal */}
            <AnimatePresence>
                {planChangeModal.open && planChangeModal.plan && (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50" onClick={() => setPlanChangeModal({ open: false, plan: null })}>
                        <motion.div initial={{ scale: 0.95, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.95, y: 20 }} onClick={(e) => e.stopPropagation()}
                            className="bg-[#0a0a0a] border border-white/[0.08] rounded-3xl p-8 w-full max-w-lg shadow-2xl relative overflow-hidden">
                            <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-bl from-emerald-500/5 to-transparent rounded-full -translate-y-1/2 translate-x-1/2" />

                            <div className="relative">
                                <div className="flex items-center gap-4 mb-6">
                                    <div className="p-3 bg-red-500/10 rounded-2xl"><ArrowRight className="w-6 h-6 text-red-500" /></div>
                                    <div>
                                        <h3 className="text-xl font-bold">Plan Update</h3>
                                        <p className="text-sm text-gray-500">Review your plan change to {planChangeModal.plan.name}</p>
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                                    <div className="p-4 bg-white/[0.02] border border-white/[0.06] rounded-2xl">
                                        <p className="text-[10px] text-gray-500 uppercase tracking-wider mb-1">Current Plan</p>
                                        <p className="font-bold">{currentPlan?.name}</p>
                                        <p className="text-xs text-gray-500">{formatAmount(currentPlan?.amount || 0)}</p>
                                    </div>
                                    <div className="p-4 bg-emerald-500/[0.02] border border-emerald-500/20 rounded-2xl">
                                        <p className="text-[10px] text-emerald-400 uppercase tracking-wider mb-1">New Plan</p>
                                        <p className="font-bold text-emerald-50">{planChangeModal.plan.name}</p>
                                        <p className="text-xs text-emerald-400/80">{formatAmount(planChangeModal.plan.amount)}</p>
                                    </div>
                                </div>

                                <div className="space-y-4 mb-8">
                                    <div className="flex items-start gap-3">
                                        <div className="p-1.5 bg-gray-500/10 rounded-lg text-gray-400 mt-1"><Clock className="w-4 h-4" /></div>
                                        <div>
                                            <p className="text-sm font-medium">Pro-rata Billing</p>
                                            <p className="text-xs text-gray-500">You will be charged only the difference for the remaining days in your current cycle.</p>
                                        </div>
                                    </div>
                                    <div className="flex items-start gap-3">
                                        <div className="p-1.5 bg-gray-500/10 rounded-lg text-gray-400 mt-1"><Check className="w-4 h-4" /></div>
                                        <div>
                                            <p className="text-sm font-medium">Immediate Access</p>
                                            <p className="text-xs text-gray-500">Access to all {planChangeModal.plan.name} features will be unlocked instantly.</p>
                                        </div>
                                    </div>
                                    {planChangeModal.plan.amount < (currentPlan?.amount || 0) && (
                                        <div className="flex items-start gap-3 p-4 bg-orange-500/10 border border-orange-500/20 rounded-2xl">
                                            <AlertTriangle className="w-5 h-5 text-orange-400 flex-shrink-0" />
                                            <div>
                                                <p className="text-sm font-medium text-orange-200">Downgrade Note</p>
                                                <p className="text-xs text-orange-400/80">Excess resources (sites, webhooks) exceeding the new limits will be deactivated starting from the oldest.</p>
                                            </div>
                                        </div>
                                    )}
                                </div>

                                <div className="flex items-center gap-3">
                                    <button onClick={() => setPlanChangeModal({ open: false, plan: null })} className="flex-1 py-3 px-4 text-sm font-medium text-gray-400 hover:text-white bg-white/[0.04] rounded-2xl transition-colors cursor-pointer">Discard</button>
                                    <button onClick={() => handleChangePlan(planChangeModal.plan!)} disabled={changingPlan}
                                        className="flex-3 py-3 px-4 text-sm font-medium bg-red-600 hover:bg-red-500 text-white rounded-2xl transition-all shadow-lg shadow-red-500/20 cursor-pointer disabled:opacity-50">
                                        {changingPlan ? 'Updating...' : 'Confirm & Update Plan'}
                                    </button>
                                </div>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    )
}
