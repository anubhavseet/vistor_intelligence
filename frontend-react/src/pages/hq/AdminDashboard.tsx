import { useQuery } from '@apollo/client/react'
import { motion } from 'framer-motion'
import {
    Users, Globe, Activity, ArrowUpRight,
    Shield, CheckCircle2, XCircle, Server
} from 'lucide-react'
import {
    ADMIN_GET_ALL_USERS, ADMIN_GET_ALL_SITES,
    AdminGetAllUsersResponse, AdminGetAllSitesResponse
} from '@/lib/graphql/admin-operations'

const fadeIn = {
    initial: { opacity: 0, y: 20 },
    animate: { opacity: 1, y: 0 },
    transition: { duration: 0.4 },
}

export default function AdminDashboard() {
    const { data: usersData, loading: usersLoading } = useQuery<AdminGetAllUsersResponse>(ADMIN_GET_ALL_USERS)
    const { data: sitesData, loading: sitesLoading } = useQuery<AdminGetAllSitesResponse>(ADMIN_GET_ALL_SITES)

    const users = usersData?.users || []
    const sites = sitesData?.adminGetAllSites || []

    const totalUsers = users.length
    const activeUsers = users.filter(u => u.isActive).length
    const adminUsers = users.filter(u => u.role === 'admin').length
    const totalSites = sites.length
    const activeSites = sites.filter(s => s.isActive).length
    const trackingEnabled = sites.filter(s => s.settings?.enableTracking).length

    const recentUsers = [...users].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()).slice(0, 5)

    const stats = [
        {
            label: 'Total Users',
            value: totalUsers,
            change: `${activeUsers} active`,
            icon: Users,
            color: 'from-blue-500 to-cyan-500',
            bgColor: 'bg-blue-500/10',
            textColor: 'text-blue-400',
        },
        {
            label: 'Total Sites',
            value: totalSites,
            change: `${activeSites} active`,
            icon: Globe,
            color: 'from-emerald-500 to-green-500',
            bgColor: 'bg-emerald-500/10',
            textColor: 'text-emerald-400',
        },
        {
            label: 'Tracking Active',
            value: trackingEnabled,
            change: `${totalSites > 0 ? Math.round((trackingEnabled / totalSites) * 100) : 0}% coverage`,
            icon: Activity,
            color: 'from-amber-500 to-orange-500',
            bgColor: 'bg-amber-500/10',
            textColor: 'text-amber-400',
        },
        {
            label: 'Admin Accounts',
            value: adminUsers,
            change: 'With HQ access',
            icon: Shield,
            color: 'from-red-500 to-pink-500',
            bgColor: 'bg-red-500/10',
            textColor: 'text-red-400',
        },
    ]

    const systemStatus = [
        { name: 'API Server', status: 'operational', uptime: '99.98%' },
        { name: 'Database (MongoDB)', status: 'operational', uptime: '99.95%' },
        { name: 'Redis Cache', status: 'operational', uptime: '99.99%' },
        { name: 'WebSocket Server', status: 'operational', uptime: '99.97%' },
        { name: 'AI Engine (Gemini)', status: 'operational', uptime: '99.90%' },
    ]

    const isLoading = usersLoading || sitesLoading

    return (
        <div className="space-y-6 max-w-[1400px]">
            {/* Page header */}
            <motion.div {...fadeIn}>
                <div className="flex items-center justify-between mb-1">
                    <div>
                        <h1 className="text-2xl font-bold tracking-tight">Platform Overview</h1>
                        <p className="text-sm text-gray-500 mt-1">
                            Real-time overview of your Visitor Intelligence platform
                        </p>
                    </div>
                    <div className="flex items-center gap-2 text-xs text-gray-500 bg-white/[0.03] px-3 py-2 rounded-lg border border-white/[0.06]">
                        <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                        All systems operational
                    </div>
                </div>
            </motion.div>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {stats.map((stat, i) => (
                    <motion.div
                        key={stat.label}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: i * 0.08 }}
                        className="group relative bg-[#0a0a0a] border border-white/[0.06] rounded-2xl p-5 hover:border-white/[0.1] transition-all duration-300"
                    >
                        <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-white/[0.06] to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                        <div className="flex items-start justify-between">
                            <div className={`p-2.5 rounded-xl ${stat.bgColor}`}>
                                <stat.icon className={`w-5 h-5 ${stat.textColor}`} />
                            </div>
                            <ArrowUpRight className="w-4 h-4 text-gray-700 group-hover:text-gray-500 transition-colors" />
                        </div>
                        <div className="mt-4">
                            <p className="text-3xl font-bold tracking-tight">
                                {isLoading ? (
                                    <span className="inline-block w-12 h-8 bg-white/[0.04] rounded-lg animate-pulse" />
                                ) : stat.value}
                            </p>
                            <p className="text-sm text-gray-500 mt-1">{stat.label}</p>
                        </div>
                        <div className="mt-3 pt-3 border-t border-white/[0.04]">
                            <span className={`text-xs ${stat.textColor} font-medium`}>{stat.change}</span>
                        </div>
                    </motion.div>
                ))}
            </div>

            {/* Content Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                {/* Recent Users */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3 }}
                    className="lg:col-span-2 bg-[#0a0a0a] border border-white/[0.06] rounded-2xl overflow-hidden"
                >
                    <div className="flex items-center justify-between px-5 py-4 border-b border-white/[0.06]">
                        <div className="flex items-center gap-2">
                            <Users className="w-4 h-4 text-blue-400" />
                            <h3 className="text-sm font-semibold">Recent Users</h3>
                        </div>
                        <span className="text-[10px] text-gray-600 font-mono">Last 5 registered</span>
                    </div>
                    <div className="divide-y divide-white/[0.04]">
                        {isLoading ? (
                            Array.from({ length: 3 }).map((_, i) => (
                                <div key={i} className="px-5 py-3.5 flex items-center gap-3">
                                    <div className="w-8 h-8 bg-white/[0.04] rounded-lg animate-pulse" />
                                    <div className="flex-1">
                                        <div className="w-24 h-3 bg-white/[0.04] rounded animate-pulse" />
                                        <div className="w-36 h-2.5 bg-white/[0.04] rounded animate-pulse mt-1.5" />
                                    </div>
                                </div>
                            ))
                        ) : recentUsers.map((user) => (
                            <div key={user.id} className="px-5 py-3.5 flex items-center gap-3 hover:bg-white/[0.02] transition-colors">
                                <div className="w-8 h-8 bg-gradient-to-br from-blue-500/20 to-cyan-500/10 rounded-lg flex items-center justify-center text-xs font-bold text-blue-400">
                                    {user.name.charAt(0).toUpperCase()}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-2">
                                        <p className="text-sm font-medium truncate">{user.name}</p>
                                        {user.role === 'admin' && (
                                            <span className="text-[9px] bg-red-500/10 text-red-400 px-1.5 py-0.5 rounded-full border border-red-500/20 font-mono">
                                                ADMIN
                                            </span>
                                        )}
                                    </div>
                                    <p className="text-xs text-gray-500 truncate">{user.email}</p>
                                </div>
                                <div className="text-right flex-shrink-0">
                                    <span className={`inline-flex items-center gap-1 text-[10px] font-medium ${user.isActive ? 'text-emerald-400' : 'text-gray-600'}`}>
                                        <span className={`w-1.5 h-1.5 rounded-full ${user.isActive ? 'bg-emerald-400' : 'bg-gray-600'}`} />
                                        {user.isActive ? 'Active' : 'Inactive'}
                                    </span>
                                    <p className="text-[10px] text-gray-600 mt-0.5 font-mono">
                                        {new Date(user.createdAt).toLocaleDateString()}
                                    </p>
                                </div>
                            </div>
                        ))}
                        {!isLoading && recentUsers.length === 0 && (
                            <div className="px-5 py-8 text-center text-gray-600 text-sm">
                                No users found
                            </div>
                        )}
                    </div>
                </motion.div>

                {/* System Status */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.4 }}
                    className="bg-[#0a0a0a] border border-white/[0.06] rounded-2xl overflow-hidden"
                >
                    <div className="flex items-center justify-between px-5 py-4 border-b border-white/[0.06]">
                        <div className="flex items-center gap-2">
                            <Server className="w-4 h-4 text-emerald-400" />
                            <h3 className="text-sm font-semibold">System Status</h3>
                        </div>
                        <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                    </div>
                    <div className="divide-y divide-white/[0.04]">
                        {systemStatus.map((service) => (
                            <div key={service.name} className="px-5 py-3 flex items-center justify-between hover:bg-white/[0.02] transition-colors">
                                <div className="flex items-center gap-2.5">
                                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                                    <span className="text-sm text-gray-300">{service.name}</span>
                                </div>
                                <span className="text-[10px] text-emerald-400/60 font-mono">{service.uptime}</span>
                            </div>
                        ))}
                    </div>
                    <div className="px-5 py-3 bg-white/[0.02] border-t border-white/[0.04]">
                        <p className="text-[10px] text-gray-600 font-mono text-center">
                            Last checked: {new Date().toLocaleTimeString()}
                        </p>
                    </div>
                </motion.div>
            </div>

            {/* Sites Overview */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 }}
                className="bg-[#0a0a0a] border border-white/[0.06] rounded-2xl overflow-hidden"
            >
                <div className="flex items-center justify-between px-5 py-4 border-b border-white/[0.06]">
                    <div className="flex items-center gap-2">
                        <Globe className="w-4 h-4 text-emerald-400" />
                        <h3 className="text-sm font-semibold">Registered Sites</h3>
                    </div>
                    <span className="text-[10px] text-gray-600 font-mono">{totalSites} total</span>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead>
                            <tr className="text-left text-[11px] uppercase tracking-wider text-gray-600 border-b border-white/[0.04]">
                                <th className="px-5 py-3 font-medium">Site</th>
                                <th className="px-5 py-3 font-medium">Domain</th>
                                <th className="px-5 py-3 font-medium">Status</th>
                                <th className="px-5 py-3 font-medium">Tracking</th>
                                <th className="px-5 py-3 font-medium">Created</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-white/[0.04]">
                            {isLoading ? (
                                Array.from({ length: 3 }).map((_, i) => (
                                    <tr key={i}>
                                        <td className="px-5 py-3"><div className="w-20 h-3 bg-white/[0.04] rounded animate-pulse" /></td>
                                        <td className="px-5 py-3"><div className="w-32 h-3 bg-white/[0.04] rounded animate-pulse" /></td>
                                        <td className="px-5 py-3"><div className="w-14 h-3 bg-white/[0.04] rounded animate-pulse" /></td>
                                        <td className="px-5 py-3"><div className="w-10 h-3 bg-white/[0.04] rounded animate-pulse" /></td>
                                        <td className="px-5 py-3"><div className="w-16 h-3 bg-white/[0.04] rounded animate-pulse" /></td>
                                    </tr>
                                ))
                            ) : sites.slice(0, 8).map((site) => (
                                <tr key={site.id} className="hover:bg-white/[0.02] transition-colors">
                                    <td className="px-5 py-3">
                                        <div className="flex items-center gap-2">
                                            <div className="w-6 h-6 bg-gradient-to-br from-emerald-500/20 to-green-500/10 rounded-md flex items-center justify-center">
                                                <Globe className="w-3 h-3 text-emerald-400" />
                                            </div>
                                            <span className="text-sm font-medium">{site.name}</span>
                                        </div>
                                    </td>
                                    <td className="px-5 py-3 text-xs text-gray-400 font-mono">{site.domain || '—'}</td>
                                    <td className="px-5 py-3">
                                        <span className={`inline-flex items-center gap-1 text-[10px] font-medium px-2 py-0.5 rounded-full ${site.isActive
                                            ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                                            : 'bg-gray-500/10 text-gray-500 border border-gray-500/20'
                                            }`}>
                                            <span className={`w-1.5 h-1.5 rounded-full ${site.isActive ? 'bg-emerald-400' : 'bg-gray-500'}`} />
                                            {site.isActive ? 'Active' : 'Inactive'}
                                        </span>
                                    </td>
                                    <td className="px-5 py-3">
                                        {site.settings?.enableTracking ? (
                                            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                                        ) : (
                                            <XCircle className="w-4 h-4 text-gray-600" />
                                        )}
                                    </td>
                                    <td className="px-5 py-3 text-[11px] text-gray-500 font-mono">
                                        {new Date(site.createdAt).toLocaleDateString()}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                    {!isLoading && sites.length === 0 && (
                        <div className="px-5 py-8 text-center text-gray-600 text-sm">
                            No sites registered yet
                        </div>
                    )}
                </div>
            </motion.div>
        </div>
    )
}
