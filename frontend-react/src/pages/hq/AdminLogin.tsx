import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useMutation } from '@apollo/client/react'
import { motion } from 'framer-motion'
import { Shield, Eye, EyeOff, AlertTriangle, Loader2, Lock } from 'lucide-react'
import { LOGIN_MUTATION, LoginResponse } from '@/lib/graphql/auth-operations'
import { useAdminStore } from '@/store/admin-store'

export default function AdminLoginPage() {
    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')
    const [showPassword, setShowPassword] = useState(false)
    const [error, setError] = useState('')
    const navigate = useNavigate()
    const { setAuth } = useAdminStore()

    const [loginMutation, { loading }] = useMutation<LoginResponse>(LOGIN_MUTATION, {
        onCompleted: (data) => {
            const { accessToken, user } = data.login
            if (user.role !== 'admin') {
                setError('Access denied. Admin privileges required.')
                return
            }
            setAuth(accessToken, user)
            navigate('/hq/dashboard')
        },
        onError: (err) => {
            setError(err.message || 'Authentication failed')
        },
    })

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault()
        setError('')
        loginMutation({ variables: { input: { email, password } } })
    }

    return (
        <div className="min-h-screen bg-[#030303] text-white flex items-center justify-center relative overflow-hidden font-sans">
            {/* Animated background elements */}
            <div className="absolute inset-0">
                <div className="absolute top-0 left-1/4 w-96 h-96 bg-red-500/5 rounded-full blur-[120px] animate-pulse" />
                <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-orange-500/5 rounded-full blur-[120px] animate-pulse" style={{ animationDelay: '1s' }} />
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-amber-500/3 rounded-full blur-[150px]" />
            </div>

            {/* Grid pattern */}
            <div className="absolute inset-0 bg-grid-small opacity-[0.03] pointer-events-none" />

            {/* Scan lines effect */}
            <div className="absolute inset-0 pointer-events-none" style={{
                background: 'repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(255,255,255,0.01) 2px, rgba(255,255,255,0.01) 4px)',
            }} />

            <motion.div
                initial={{ opacity: 0, y: 30, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
                className="w-full max-w-[420px] px-6 relative z-10"
            >
                {/* HQ Badge */}
                <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 }}
                    className="flex flex-col items-center mb-10"
                >
                    <div className="relative mb-5">
                        <div className="absolute inset-0 bg-red-500/20 rounded-2xl blur-xl" />
                        <div className="relative w-16 h-16 bg-gradient-to-br from-red-500/20 to-orange-500/10 border border-red-500/30 rounded-2xl flex items-center justify-center backdrop-blur-sm">
                            <Shield className="w-8 h-8 text-red-400" />
                        </div>
                    </div>
                    <div className="flex items-center gap-2 mb-2">
                        <span className="text-[10px] tracking-[0.3em] uppercase text-red-400/80 font-mono font-medium bg-red-500/10 px-3 py-1 rounded-full border border-red-500/20">
                            Restricted Access
                        </span>
                    </div>
                    <h1 className="text-2xl font-bold tracking-tight text-white mt-3">
                        Admin HQ
                    </h1>
                    <p className="text-sm text-gray-500 mt-1.5 text-center">
                        Command center access requires admin credentials
                    </p>
                </motion.div>

                {/* Login Form Card */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3 }}
                    className="relative"
                >
                    {/* Card glow */}
                    <div className="absolute -inset-px bg-gradient-to-b from-red-500/10 via-transparent to-transparent rounded-2xl" />

                    <div className="relative bg-[#0a0a0a] border border-white/[0.08] rounded-2xl p-7 shadow-2xl">
                        {/* Top accent bar */}
                        <div className="absolute top-0 left-6 right-6 h-px bg-gradient-to-r from-transparent via-red-500/40 to-transparent" />

                        <form onSubmit={handleSubmit} className="space-y-5">
                            {error && (
                                <motion.div
                                    initial={{ opacity: 0, height: 0 }}
                                    animate={{ opacity: 1, height: 'auto' }}
                                    className="flex items-center gap-2.5 p-3.5 rounded-xl bg-red-500/10 border border-red-500/20 text-red-300 text-sm"
                                >
                                    <AlertTriangle className="w-4 h-4 flex-shrink-0" />
                                    <span>{error}</span>
                                </motion.div>
                            )}

                            <div className="space-y-2">
                                <label className="text-xs font-medium text-gray-400 uppercase tracking-wider flex items-center gap-1.5">
                                    <Lock className="w-3 h-3" />
                                    Email
                                </label>
                                <input
                                    id="admin-email"
                                    type="email"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    required
                                    className="w-full px-4 py-3 bg-white/[0.04] border border-white/[0.08] rounded-xl text-white placeholder-gray-600 text-sm focus:outline-none focus:border-red-500/40 focus:ring-1 focus:ring-red-500/20 transition-all duration-200"
                                    placeholder="admin@visitorintel.com"
                                />
                            </div>

                            <div className="space-y-2">
                                <label className="text-xs font-medium text-gray-400 uppercase tracking-wider flex items-center gap-1.5">
                                    <Lock className="w-3 h-3" />
                                    Password
                                </label>
                                <div className="relative">
                                    <input
                                        id="admin-password"
                                        type={showPassword ? 'text' : 'password'}
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        required
                                        className="w-full px-4 py-3 bg-white/[0.04] border border-white/[0.08] rounded-xl text-white placeholder-gray-600 text-sm focus:outline-none focus:border-red-500/40 focus:ring-1 focus:ring-red-500/20 transition-all duration-200 pr-11"
                                        placeholder="••••••••••"
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowPassword(!showPassword)}
                                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-300 transition-colors"
                                    >
                                        {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                    </button>
                                </div>
                            </div>

                            <button
                                id="admin-login-btn"
                                type="submit"
                                disabled={loading}
                                className="w-full py-3 px-4 bg-gradient-to-r from-red-600 to-orange-600 hover:from-red-500 hover:to-orange-500 disabled:from-gray-700 disabled:to-gray-700 text-white font-medium rounded-xl text-sm transition-all duration-300 flex items-center justify-center gap-2 shadow-lg shadow-red-500/10 hover:shadow-red-500/20 cursor-pointer disabled:cursor-not-allowed"
                            >
                                {loading ? (
                                    <>
                                        <Loader2 className="w-4 h-4 animate-spin" />
                                        Authenticating...
                                    </>
                                ) : (
                                    <>
                                        <Shield className="w-4 h-4" />
                                        Access Command Center
                                    </>
                                )}
                            </button>
                        </form>

                        {/* Bottom security note */}
                        <div className="mt-6 pt-5 border-t border-white/[0.05]">
                            <p className="text-[11px] text-gray-600 text-center flex items-center justify-center gap-1.5 font-mono">
                                <span className="w-1.5 h-1.5 bg-green-500/60 rounded-full animate-pulse" />
                                Secure session • AES-256 encrypted
                            </p>
                        </div>
                    </div>
                </motion.div>

                {/* Version info */}
                <motion.p
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.5 }}
                    className="text-center mt-8 text-[11px] text-gray-700 font-mono"
                >
                    Visitor Intelligence HQ v1.0 • Internal Use Only
                </motion.p>
            </motion.div>
        </div>
    )
}
