import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import SignupForm from '@/components/SignupForm'
import { ArrowLeft, Check, Layout, Globe, Shield } from 'lucide-react'

export default function RegisterPage() {
    return (
        <div className="min-h-screen bg-black text-white relative flex flex-col items-center justify-center overflow-hidden font-sans selection:bg-blue-500/30 py-20">
            {/* Background Assets */}
            <div className="absolute inset-0 bg-grid-small [mask-image:radial-gradient(ellipse_at_center,rgba(0,0,0,0),transparent)] opacity-20 pointer-events-none" />
            <div className="absolute top-0 w-full h-px bg-gradient-to-r from-transparent via-white/10 to-transparent" />
            <div className="absolute bottom-0 w-full h-px bg-gradient-to-r from-transparent via-white/10 to-transparent" />

            <div className="w-full max-w-5xl px-6 relative z-10 grid lg:grid-cols-2 gap-16 items-center">

                {/* Left Side: Value Prop (Hidden on mobile) */}
                <motion.div
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.5 }}
                    className="hidden lg:block"
                >
                    <div className="mb-8">
                        <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center mb-6">
                            <div className="w-0 h-0 border-l-[8px] border-l-transparent border-r-[8px] border-r-transparent border-b-[14px] border-b-black translate-y-[1px]" />
                        </div>
                        <h1 className="text-4xl font-bold tracking-tight mb-4">Start your deployment.</h1>
                        <p className="text-gray-400 text-lg leading-relaxed">
                            Join 5,000+ developers and revenue teams building the future of B2B intelligence.
                        </p>
                    </div>

                    <div className="space-y-6">
                        <div className="flex items-start space-x-4 p-4 border border-white/5 rounded-xl bg-white/5">
                            <div className="p-2 bg-blue-500/10 rounded-lg text-blue-500">
                                <Layout className="w-5 h-5" />
                            </div>
                            <div>
                                <h3 className="font-bold text-white">Full Platform Access</h3>
                                <p className="text-sm text-gray-400">Unlimited access to the intent engine and analytics dashboard.</p>
                            </div>
                        </div>
                        <div className="flex items-start space-x-4 p-4 border border-white/5 rounded-xl bg-white/5">
                            <div className="p-2 bg-green-500/10 rounded-lg text-green-500">
                                <Globe className="w-5 h-5" />
                            </div>
                            <div>
                                <h3 className="font-bold text-white">Global Edge Network</h3>
                                <p className="text-sm text-gray-400">Low-latency data collection from 140+ countries.</p>
                            </div>
                        </div>
                        <div className="flex items-start space-x-4 p-4 border border-white/5 rounded-xl bg-white/5">
                            <div className="p-2 bg-purple-500/10 rounded-lg text-purple-500">
                                <Shield className="w-5 h-5" />
                            </div>
                            <div>
                                <h3 className="font-bold text-white">Enterprise Security</h3>
                                <p className="text-sm text-gray-400">SOC 2 Type II compliant infrastructure by default.</p>
                            </div>
                        </div>
                    </div>
                </motion.div>

                {/* Right Side: Signup Form */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, delay: 0.1 }}
                >
                    <div className="bg-[#050505] border border-white/10 rounded-xl p-8 shadow-2xl relative overflow-hidden">
                        <div className="absolute top-0 right-0 p-4 opacity-50 pointer-events-none">
                            <div className="w-32 h-32 bg-purple-500/10 blur-3xl rounded-full translate-x-10 -translate-y-10" />
                        </div>

                        <div className="mb-6 lg:hidden">
                            <h1 className="text-2xl font-bold mb-2">Create Account</h1>
                            <p className="text-gray-400 text-sm">Deploy your first workspace in seconds.</p>
                        </div>

                        <SignupForm />

                        <div className="mt-6 pt-6 border-t border-white/5 text-center">
                            <p className="text-xs text-gray-500">
                                Already maintain a workspace?{' '}
                                <Link to="/login" className="text-white hover:underline decoration-blue-500 underline-offset-4">
                                    Log in
                                </Link>
                            </p>
                        </div>
                    </div>
                </motion.div>
            </div>

            {/* Desktop Back Button */}
            <Link to="/" className="fixed top-8 left-8 text-gray-500 hover:text-white transition-colors items-center text-sm hidden md:flex">
                <ArrowLeft className="w-4 h-4 mr-2" /> Back to Home
            </Link>
        </div>
    )
}
