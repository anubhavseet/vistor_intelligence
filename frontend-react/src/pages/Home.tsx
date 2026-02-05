import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import LoginForm from '@/components/LoginForm'
import SignupForm from '@/components/SignupForm'
import { useAuth } from '@/hooks/use-auth'
import { useState } from 'react'
import { Sparkles, Globe, Zap, BarChart3, Shield, Users } from 'lucide-react'

export default function HomePage() {
    const navigate = useNavigate()
    const { isAuthenticated } = useAuth()
    const [isLogin, setIsLogin] = useState(true)

    useEffect(() => {
        if (isAuthenticated) {
            navigate('/dashboard')
        }
    }, [isAuthenticated, navigate])

    const features = [
        {
            icon: Users,
            title: 'Visitor Intelligence',
            description: 'Identify the companies and decision-makers visiting your website in real-time.'
        },
        {
            icon: Sparkles,
            title: 'AI Intent Engine',
            description: 'Predict user needs using advanced AI behavior analysis and semantic tracking.'
        },
        {
            icon: Zap,
            title: 'Instant Action',
            description: 'Trigger dynamic UI changes and automated workflows based on user intent.'
        },
        {
            icon: BarChart3,
            title: 'Deep Analytics',
            description: 'Comprehensive reports on visitor journeys, conversion funnels, and performance.'
        },
        {
            icon: Globe,
            title: 'Global Scale',
            description: 'Enterprise-grade tracking infrastructure designed to handle millions of events.'
        },
        {
            icon: Shield,
            title: 'Privacy First',
            description: 'GDPR & CCPA compliant tracking with granular control over data collection.'
        }
    ]

    return (
        <div className="min-h-screen bg-[#030712] text-white selection:bg-purple-500/30 overflow-x-hidden">
            {/* Background decoration */}
            {/* Rich Animated Background */}
            <div className="fixed inset-0 overflow-hidden pointer-events-none">
                <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] bg-purple-600/30 blur-[120px] rounded-full animate-blob mix-blend-screen" />
                <div className="absolute top-[20%] right-[-10%] w-[50%] h-[50%] bg-blue-600/30 blur-[120px] rounded-full animate-blob animation-delay-2000 mix-blend-screen" />
                <div className="absolute bottom-[-20%] left-[20%] w-[50%] h-[50%] bg-pink-600/30 blur-[120px] rounded-full animate-blob animation-delay-4000 mix-blend-screen" />
            </div>

            {/* Nav */}
            <nav className="relative z-50 flex items-center justify-between px-8 py-6 max-w-7xl mx-auto">
                <div className="flex items-center space-x-3 group">
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-600 to-pink-600 flex items-center justify-center shadow-lg shadow-purple-500/50 group-hover:scale-110 transition-transform">
                        <Sparkles className="w-6 h-6 text-white" />
                    </div>
                    <span className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-white to-gray-400">
                        Visitor Intel
                    </span>
                </div>
                <div className="flex items-center space-x-6">
                    <button
                        onClick={() => setIsLogin(true)}
                        className="text-gray-400 hover:text-white transition-colors font-medium"
                    >
                        Login
                    </button>
                    <button
                        onClick={() => setIsLogin(false)}
                        className="px-6 py-2.5 bg-white text-black rounded-full font-bold hover:bg-gray-200 transition-all active:scale-95 shadow-lg"
                    >
                        Join Beta
                    </button>
                </div>
            </nav>

            <main className="relative z-10 max-w-7xl mx-auto px-8 pt-20 pb-40">
                <div className="grid lg:grid-cols-2 gap-20 items-center">
                    {/* Left Hero */}
                    <motion.div
                        initial={{ opacity: 0, x: -50 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ duration: 0.8 }}
                    >
                        <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-purple-500/10 border border-purple-500/20 text-purple-400 text-sm font-medium mb-6">
                            <Sparkles className="w-4 h-4" />
                            <span>Next-Gen Visitor Intelligence</span>
                        </div>
                        <h1 className="text-6xl lg:text-7xl font-bold leading-tight mb-8">
                            Turn Anonymous<br />
                            <span className="text-gradient font-extrabold tracking-tight">
                                Visitors into Revenue
                            </span>
                        </h1>
                        <p className="text-xl text-gray-400 mb-10 leading-relaxed max-w-xl">
                            Identify the companies visiting your site, predict their intent with AI,
                            and trigger personalized experiences that close deals faster.
                        </p>

                        <div className="flex flex-wrap gap-4 mb-20">
                            <button
                                onClick={() => setIsLogin(false)}
                                className="px-8 py-4 bg-gradient-to-r from-purple-600 to-pink-600 rounded-2xl font-bold text-lg hover:shadow-2xl hover:shadow-purple-500/20 transition-all hover:-translate-y-1 active:scale-95"
                            >
                                Start Free Trial
                            </button>
                            <div className="px-8 py-4 bg-white/5 border border-white/10 rounded-2xl font-bold text-lg backdrop-blur-sm">
                                View Demo
                            </div>
                        </div>

                        {/* Feature small grid */}
                        <div className="grid grid-cols-2 gap-4">
                            <div className="p-4 bg-white/5 border border-white/10 rounded-2xl">
                                <div className="text-purple-400 font-bold text-2xl mb-1">98%</div>
                                <div className="text-gray-500 text-sm">Accuracy Rate</div>
                            </div>
                            <div className="p-4 bg-white/5 border border-white/10 rounded-2xl">
                                <div className="text-pink-400 font-bold text-2xl mb-1">10x</div>
                                <div className="text-gray-500 text-sm">ROI Increase</div>
                            </div>
                        </div>
                    </motion.div>

                    {/* Right Auth Card */}
                    <motion.div
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ duration: 0.8, delay: 0.2 }}
                        className="relative"
                    >
                        {/* Glossy Card */}
                        {/* Glossy Card */}
                        <div className="glass-panel rounded-[2.5rem] p-10 relative overflow-hidden group border-t border-l border-white/20 shadow-2xl shadow-purple-900/20">
                            {/* Animated corner glow */}
                            <div className="absolute -top-20 -right-20 w-64 h-64 bg-gradient-to-br from-purple-500 to-pink-500 blur-[80px] opacity-40 group-hover:opacity-60 transition-all duration-700" />

                            <div className="relative z-10">
                                <div className="flex bg-white/5 p-1 rounded-2xl mb-8">
                                    <button
                                        onClick={() => setIsLogin(true)}
                                        className={`flex-1 py-3 rounded-xl font-bold transition-all ${isLogin ? 'bg-white text-black shadow-lg' : 'text-gray-500 hover:text-white'}`}
                                    >
                                        Login
                                    </button>
                                    <button
                                        onClick={() => setIsLogin(false)}
                                        className={`flex-1 py-3 rounded-xl font-bold transition-all ${!isLogin ? 'bg-white text-black shadow-lg' : 'text-gray-500 hover:text-white'}`}
                                    >
                                        Signup
                                    </button>
                                </div>

                                <div className="min-h-[400px]">
                                    {isLogin ? <LoginForm /> : <SignupForm />}
                                </div>
                            </div>
                        </div>

                        {/* Floating indicator */}
                        <div className="absolute -bottom-6 -left-6 bg-[#030712] border border-white/10 px-4 py-3 rounded-2xl flex items-center space-x-3 shadow-2xl">
                            <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                            <span className="text-sm font-medium text-gray-300">Live: 2.4k visitors tracked</span>
                        </div>
                    </motion.div>
                </div>

                {/* Features Grid */}
                <div className="mt-60">
                    <div className="text-center mb-20">
                        <h2 className="text-4xl lg:text-5xl font-bold mb-6">Everything you need to grow</h2>
                        <p className="text-xl text-gray-400 max-w-2xl mx-auto">
                            Powerful tools designed to give you an unfair advantage in sales and marketing.
                        </p>
                    </div>

                    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
                        {features.map((feature, idx) => (
                            <motion.div
                                key={idx}
                                initial={{ opacity: 0, y: 20 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                viewport={{ once: true }}
                                transition={{ delay: idx * 0.1 }}
                                className="p-8 glass-panel rounded-3xl glass-card-hover group cursor-default relative overflow-hidden"
                            >
                                <div className="absolute inset-0 bg-gradient-to-br from-purple-500/5 to-pink-500/5 opacity-0 group-hover:opacity-100 transition-opacity" />
                                <div className="w-14 h-14 rounded-2xl bg-purple-600/20 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                                    <feature.icon className="w-8 h-8 text-purple-400" />
                                </div>
                                <h3 className="text-2xl font-bold mb-4">{feature.title}</h3>
                                <p className="text-gray-400 leading-relaxed">
                                    {feature.description}
                                </p>
                            </motion.div>
                        ))}
                    </div>
                </div>
            </main>

            {/* Footer */}
            <footer className="relative z-10 border-t border-white/10 py-20 bg-black/50 backdrop-blur-3xl">
                <div className="max-w-7xl mx-auto px-8">
                    <div className="flex flex-col md:flex-row justify-between items-center gap-10">
                        <div className="flex items-center space-x-3">
                            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-purple-600 to-pink-600 flex items-center justify-center">
                                <Sparkles className="w-5 h-5 text-white" />
                            </div>
                            <span className="text-xl font-bold">Visitor Intel</span>
                        </div>
                        <div className="flex space-x-8 text-gray-400 text-sm">
                            <a href="#" className="hover:text-white transition-colors">Privacy</a>
                            <a href="#" className="hover:text-white transition-colors">Terms</a>
                            <a href="#" className="hover:text-white transition-colors">Status</a>
                            <a href="#" className="hover:text-white transition-colors">Docs</a>
                        </div>
                        <div className="text-gray-500 text-sm">
                            © 2026 Visitor Intel. All rights reserved.
                        </div>
                    </div>
                </div>
            </footer>
        </div>
    )
}
