import { motion } from 'framer-motion'
import { Link } from 'react-router-dom'
import { Check, Loader2 } from 'lucide-react'
import { useQuery } from '@apollo/client/react'
import { GET_PUBLIC_PLANS, GetPublicPlansResponse, SubscriptionPlan } from '@/lib/graphql/subscription-operations'

const formatAmount = (amount?: number, currency: string = 'USD') => {
    if (amount === undefined || amount === null) return '$0'
    return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: currency,
        minimumFractionDigits: 0
    }).format(amount)
}

export const PricingSection = () => {
    const { data, loading, error } = useQuery<GetPublicPlansResponse>(GET_PUBLIC_PLANS)

    if (error) {
        console.error("Failed to load plans:", error)
    }

    const plans = data?.getPublicPlans || []
    const isPlansLoaded = !loading && plans.length > 0

    return (
        <section id="pricing" className="py-32 bg-black relative">
            <div className="max-w-7xl mx-auto px-6">
                <div className="text-center mb-20">
                    <motion.h2
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.5 }}
                        className="text-4xl font-bold mb-6"
                    >
                        Simple, transparent pricing.
                    </motion.h2>
                    <p className="text-xl text-gray-400">Start for free, scale as you grow.</p>
                </div>

                {loading && (
                    <div className="flex justify-center items-center h-40">
                        <Loader2 className="w-8 h-8 text-blue-500 animate-spin" />
                    </div>
                )}

                {isPlansLoaded && (
                    <div className={`grid md:grid-cols-${Math.min(plans.length, 3)} gap-8 max-w-5xl mx-auto`}>
                        {plans.map((plan: SubscriptionPlan, i: number) => {
                            const isMostPopular = i === 1 // Assuming the second plan is the most popular
                            const { features } = plan

                            return (
                                <motion.div
                                    key={plan.id}
                                    initial={{ opacity: 0, y: 20 }}
                                    whileInView={{ opacity: 1, y: 0 }}
                                    viewport={{ once: true }}
                                    transition={{ duration: 0.5, delay: i * 0.1 }}
                                    className={`border rounded-xl p-8 flex flex-col relative ${isMostPopular ? 'border-blue-500 bg-[#0A0A0A] shadow-[0_0_50px_rgba(0,112,243,0.1)]' : 'border-white/10 bg-[#050505]'}`}
                                >
                                    {isMostPopular && (
                                        <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-blue-500 text-black text-[10px] font-bold px-3 py-1 rounded-full uppercase tracking-wider">
                                            Most Popular
                                        </div>
                                    )}
                                    <div className="mb-4">
                                        <h3 className="text-lg font-bold text-white">{plan.name}</h3>
                                        <div className="text-3xl font-bold mt-2">
                                            {formatAmount(plan.amount, plan.currency)}
                                            {plan.amount > 0 && <span className="text-sm font-normal text-gray-400">/{plan.period === 'monthly' ? 'mo' : 'yr'}</span>}
                                        </div>
                                    </div>
                                    <p className="text-gray-400 text-sm mb-6 min-h-[40px]">{plan.description || ''}</p>

                                    <ul className="space-y-3 mb-8 flex-1">
                                        {[
                                            { active: true, label: `${features.maxSites === -1 ? 'Unlimited' : features.maxSites} Sites` },
                                            { active: true, label: `${features.maxSessionsPerMonth === -1 ? 'Unlimited' : features.maxSessionsPerMonth.toLocaleString()} Sessions/mo` },
                                            { active: true, label: `${features.maxCrawlPages === -1 ? 'Unlimited' : features.maxCrawlPages.toLocaleString()} Auto-Crawl Pages/mo` },
                                            { active: true, label: `${features.dataRetentionDays} Day Data Retention` },
                                            { active: features.enableBehaviorTracking, label: 'Advanced Intent Patterns' },
                                            { active: features.enableGeoLocation, label: 'Geo Location & IP Insights' },
                                            { active: features.enableEnrichment, label: 'De-anonymization (IP to Company)' },
                                            { active: features.enableUiInjection, label: 'AI Generative UI Injection' },
                                        ].map((f, idx) => (
                                            f.active && (
                                                <li key={idx} className={`flex items-center text-sm ${isMostPopular ? 'text-white' : 'text-gray-300'}`}>
                                                    <Check className={`w-4 h-4 mr-2 ${isMostPopular ? 'text-blue-500' : 'text-white'}`} /> {f.label}
                                                </li>
                                            )
                                        ))}
                                    </ul>
                                    <Link to="/register" className={`w-full py-2 rounded text-center text-sm font-semibold transition-colors ${isMostPopular ? 'bg-white text-black hover:bg-gray-200' : 'border border-white/20 hover:bg-white/5 text-white'}`}>
                                        {plan.amount === 0 ? 'Start Free' : 'Get Started'}
                                    </Link>
                                </motion.div>
                            )
                        })}
                    </div>
                )}
            </div>

            <div className="absolute bottom-0 left-0 right-0 h-[1px] bg-white/20 overflow-hidden z-20">
                <motion.div
                    className="absolute top-0 bottom-0 w-[40%] bg-gradient-to-r from-transparent via-blue-400 to-transparent opacity-100"
                    animate={{ x: ['-100%', '300%'] }}
                    transition={{ duration: 4, repeat: Infinity, ease: "easeInOut", repeatDelay: 1 }}
                />
                <div className="absolute inset-0 bg-white/10" />
            </div>
        </section>
    )
}
