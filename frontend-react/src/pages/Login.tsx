import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import LoginForm from '@/components/LoginForm'
import { ArrowLeft } from 'lucide-react'

export default function LoginPage() {
    return (
        <div className="min-h-screen bg-black text-white relative flex flex-col items-center justify-center overflow-hidden font-sans selection:bg-blue-500/30">
            {/* Background Assets */}
            <div className="absolute inset-0 bg-grid-small [mask-image:radial-gradient(ellipse_at_center,rgba(0,0,0,0),transparent)] opacity-20 pointer-events-none" />
            <div className="absolute top-0 w-full h-px bg-gradient-to-r from-transparent via-white/10 to-transparent" />
            <div className="absolute bottom-0 w-full h-px bg-gradient-to-r from-transparent via-white/10 to-transparent" />

            <div className="w-full max-w-md px-6 relative z-10">
                {/* Header */}
                <motion.div
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5 }}
                    className="mb-8 text-center"
                >
                    <Link to="/" className="inline-flex items-center space-x-2 group mb-8">
                        <div className="w-8 h-8 bg-white rounded-full flex items-center justify-center group-hover:scale-95 transition-transform">
                            <div className="w-0 h-0 border-l-[6px] border-l-transparent border-r-[6px] border-r-transparent border-b-[10px] border-b-black translate-y-[1px]" />
                        </div>
                    </Link>
                    <h1 className="text-2xl font-bold tracking-tight mb-2">Welcome back</h1>
                    <p className="text-gray-400 text-sm">
                        Enter your credentials to access the console.
                    </p>
                </motion.div>

                {/* Login Card */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, delay: 0.1 }}
                    className="bg-[#050505] border border-white/10 rounded-xl p-6 shadow-2xl relative overflow-hidden"
                >
                    <div className="absolute top-0 right-0 p-4 opacity-50">
                        {/* Optional corner decoration */}
                        <div className="w-20 h-20 bg-blue-500/10 blur-2xl rounded-full translate-x-10 -translate-y-10" />
                    </div>

                    <LoginForm />

                    <div className="mt-6 pt-6 border-t border-white/5 text-center">
                        <p className="text-xs text-gray-500">
                            Don't have an account?{' '}
                            <Link to="/register" className="text-white hover:underline decoration-blue-500 underline-offset-4">
                                Deploy a new workspace
                            </Link>
                        </p>
                    </div>
                </motion.div>

                {/* Footer Links */}
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ duration: 0.5, delay: 0.2 }}
                    className="mt-8 text-center flex justify-center space-x-6 text-xs text-gray-600 font-mono"
                >
                    <Link to="/terms" className="hover:text-gray-400 transition-colors">Terms</Link>
                    <Link to="/privacy" className="hover:text-gray-400 transition-colors">Privacy</Link>
                    <a href="mailto:support@visitorintel.com" className="hover:text-gray-400 transition-colors">Support</a>
                </motion.div>

                <Link to="/" className="absolute top-8 left-8 text-gray-500 hover:text-white transition-colors flex items-center text-sm md:hidden">
                    <ArrowLeft className="w-4 h-4 mr-1" /> Back
                </Link>
            </div>

            {/* Desktop Back Button */}
            <Link to="/" className="fixed top-8 left-8 text-gray-500 hover:text-white transition-colors items-center text-sm hidden md:flex">
                <ArrowLeft className="w-4 h-4 mr-2" /> Back to Home
            </Link>
        </div>
    )
}
