import { useQuery } from '@apollo/client/react'
import { motion } from 'framer-motion'
import {
    Server, Database, Wifi, Shield,
    Clock, CheckCircle2, HardDrive,
    Activity, Zap, Globe, Layers,
    Terminal, Code, AlertTriangle, XCircle
} from 'lucide-react'
import {
    ADMIN_GET_SYSTEM_HEALTH,
    AdminSystemHealthResponse
} from '@/lib/graphql/admin-operations'

export default function AdminSystemPage() {
    const { data: healthData, loading, error, refetch } = useQuery<AdminSystemHealthResponse>(ADMIN_GET_SYSTEM_HEALTH, {
        pollInterval: 30000 // poll every 30s
    })

    const health = healthData?.adminSystemHealth

    const getStatusParams = (status: string) => {
        switch (status) {
            case 'operational': return { color: 'emerald', bg: 'bg-emerald-500/10', text: 'text-emerald-400', icon: CheckCircle2, label: 'Operational' }
            case 'degraded': return { color: 'amber', bg: 'bg-amber-500/10', text: 'text-amber-400', icon: AlertTriangle, label: 'Degraded' }
            case 'major_outage':
            case 'down': return { color: 'red', bg: 'bg-red-500/10', text: 'text-red-400', icon: XCircle, label: 'Offline / Down' }
            default: return { color: 'gray', bg: 'bg-gray-500/10', text: 'text-gray-400', icon: Activity, label: status }
        }
    }

    const { color: overallColor, bg: overallBg, text: overallText, icon: OverallIcon, label: overallLabel } = getStatusParams(health?.overallStatus || 'unknown')

    const getServiceIcon = (name: string) => {
        if (name.includes('Database')) return Database;
        if (name.includes('Redis')) return Layers;
        if (name.includes('WebSocket')) return Wifi;
        if (name.includes('Queue')) return Activity;
        if (name.includes('AI') || name.includes('Gemini')) return Zap;
        if (name.includes('Geo')) return Globe;
        if (name.includes('Qdrant') || name.includes('Vector')) return HardDrive;
        return Server;
    }

    const formatBytes = (bytes: number, decimals = 2) => {
        if (!+bytes) return '0 Bytes'
        const k = 1024
        const dm = decimals < 0 ? 0 : decimals
        const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB']
        const i = Math.floor(Math.log(bytes) / Math.log(k))
        return `${parseFloat((bytes / Math.pow(k, i)).toFixed(dm))} ${sizes[i]}`
    }

    if (loading && !health) {
        return <div className="p-8 text-center text-gray-500">Loading system metrics...</div>
    }

    if (error) {
        return <div className="p-8 text-center text-red-500 mt-4 rounded-xl border border-red-500/20 bg-red-500/5">Failed to fetch system metrics: {error.message}</div>
    }

    return (
        <div className="space-y-6 max-w-[1400px]">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight">System Health</h1>
                    <p className="text-sm text-gray-500 mt-1">Real-time platform infrastructure layout and metrics</p>
                </div>
                <div className="flex items-center gap-2 text-xs text-gray-500 bg-white/[0.03] px-3 py-2 rounded-lg border border-white/[0.06]">
                    <Clock className="w-3.5 h-3.5" />
                    Node Uptime: {Math.floor((health?.process?.uptimeSeconds || 0) / 3600)}h {Math.floor(((health?.process?.uptimeSeconds || 0) % 3600) / 60)}m
                </div>
            </div>

            {/* Overall Status Banner */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className={`bg-gradient-to-r from-${overallColor}-500/5 to-${overallColor}-500/5 border border-${overallColor}-500/20 rounded-2xl p-5 flex flex-col md:flex-row md:items-center justify-between gap-4`}
            >
                <div className="flex items-center gap-3">
                    <div className={`p-2.5 ${overallBg} rounded-xl`}>
                        <OverallIcon className={`w-6 h-6 ${overallText}`} />
                    </div>
                    <div>
                        <h3 className={`text-sm font-semibold ${overallText}`}>Systems {overallLabel}</h3>
                        <p className={`text-xs ${overallText} opacity-60 mt-0.5`}>
                            {health?.services.filter(s => s.status === 'operational').length} / {health?.services.length} services running normally
                        </p>
                    </div>
                </div>

                {health?.process && (
                    <div className="flex gap-6 pt-3 mt-3 border-t border-white/5 md:border-t-0 md:pt-0 md:mt-0 text-right">
                        <div>
                            <p className="text-sm font-bold text-gray-300">{health.process.memoryUsedMb} MB</p>
                            <p className="text-[10px] text-gray-500">Node Memory</p>
                        </div>
                        <div>
                            <p className="text-sm font-bold text-gray-300">{health.process.cpuCount} Cores</p>
                            <p className="text-[10px] text-gray-500">{health.process.arch} Host CPU</p>
                        </div>
                        <div>
                            <p className="text-sm font-bold text-gray-300">{health.process.loadAvg1m}</p>
                            <p className="text-[10px] text-gray-500">Host Load</p>
                        </div>
                    </div>
                )}
            </motion.div>

            {/* Services Grid */}
            <div>
                <div className="flex items-center justify-between mb-3">
                    <h2 className="text-sm font-semibold flex items-center gap-2">
                        <Server className="w-4 h-4 text-blue-400" />
                        Live Services
                    </h2>
                    <button onClick={() => refetch()} className="text-[10px] text-blue-400 hover:text-blue-300">Refresh</button>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-3">
                    {health?.services.map((service, i) => {
                        const { bg, text, label } = getStatusParams(service.status)
                        const ServiceIcon = getServiceIcon(service.name)

                        return (
                            <motion.div
                                key={service.name}
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: i * 0.05 }}
                                className="bg-[#0a0a0a] border border-white/[0.06] rounded-xl p-4 hover:border-white/[0.1] transition-all group"
                            >
                                <div className="flex items-start justify-between mb-3">
                                    <div className={`p-2 ${bg} rounded-lg`}>
                                        <ServiceIcon className={`w-4 h-4 ${text}`} />
                                    </div>
                                    <div className="flex flex-col items-end gap-1">
                                        <span className={`flex items-center gap-1 text-[9px] ${text} font-medium`}>
                                            {service.status === 'operational' && <span className={`w-1.5 h-1.5 bg-emerald-400 rounded-full animate-pulse`} />}
                                            {label}
                                        </span>
                                        {service.latencyMs !== undefined && (
                                            <span className="text-[9px] text-gray-500 font-mono">{service.latencyMs}ms</span>
                                        )}
                                    </div>
                                </div>
                                <h3 className="text-sm font-medium mb-0.5">{service.name}</h3>
                                <p className="text-[10px] text-gray-500 mb-3">{service.details}</p>

                                <div className="flex items-center gap-2 text-[10px] text-gray-600 font-mono">
                                    <Code className="w-3 h-3" />
                                    {service.version || 'unknown'}
                                </div>
                            </motion.div>
                        )
                    })}
                </div>
            </div>

            {/* Modules & Collections */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">

                {/* Process Details */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3 }}
                    className="bg-[#0a0a0a] border border-white/[0.06] rounded-2xl overflow-hidden flex flex-col"
                >
                    <div className="flex items-center justify-between px-5 py-4 border-b border-white/[0.06]">
                        <div className="flex items-center gap-2">
                            <Terminal className="w-4 h-4 text-purple-400" />
                            <h3 className="text-sm font-semibold">Node.js Process</h3>
                        </div>
                        <span className="text-[10px] text-gray-600 font-mono">{health?.process.nodeVersion} on {health?.process.platform}</span>
                    </div>

                    <div className="p-5 flex-1 grid grid-cols-2 gap-y-6 gap-x-4 max-h-[400px]">
                        <div>
                            <p className="text-[10px] text-gray-500 uppercase tracking-wider mb-1">RSS Memory</p>
                            <div className="flex items-end gap-2">
                                <span className="text-xl font-bold text-gray-200">{health?.process.memoryRssMb}</span>
                                <span className="text-xs text-gray-500 pb-0.5">MB</span>
                            </div>
                        </div>
                        <div>
                            <p className="text-[10px] text-gray-500 uppercase tracking-wider mb-1">Heap Used / Total</p>
                            <div className="flex items-end gap-2">
                                <span className="text-lg font-bold text-gray-200">{health?.process.heapUsedMb}</span>
                                <span className="text-xs text-gray-500 pb-0.5">/ {health?.process.heapTotalMb} MB</span>
                            </div>
                            <div className="w-full bg-white/5 h-1.5 rounded-full mt-2 overflow-hidden">
                                <motion.div
                                    initial={{ width: 0 }}
                                    animate={{ width: `${((health?.process.heapUsedMb || 0) / (health?.process.heapTotalMb || 1)) * 100}%` }}
                                    className="bg-purple-500 h-full rounded-full"
                                />
                            </div>
                        </div>
                        <div>
                            <p className="text-[10px] text-gray-500 uppercase tracking-wider mb-1">Host Memory Total</p>
                            <div className="flex items-end gap-2">
                                <span className="text-lg font-bold text-gray-200">{health?.process.totalMemoryGb}</span>
                                <span className="text-xs text-gray-500 pb-0.5">GB</span>
                            </div>
                        </div>
                        <div>
                            <p className="text-[10px] text-gray-500 uppercase tracking-wider mb-1">Host Memory Free</p>
                            <div className="flex items-end gap-2">
                                <span className="text-lg font-bold text-gray-200">{health?.process.freeMemoryGb}</span>
                                <span className="text-xs text-gray-500 pb-0.5">GB</span>
                            </div>
                            <div className="w-full bg-white/5 h-1.5 rounded-full mt-2 overflow-hidden">
                                <motion.div
                                    initial={{ width: 0 }}
                                    animate={{ width: `${(1 - ((health?.process.freeMemoryGb || 0) / (health?.process.totalMemoryGb || 1))) * 100}%` }}
                                    className="bg-purple-500/50 h-full rounded-full"
                                />
                            </div>
                        </div>
                        <div className="col-span-2">
                            <p className="text-[10px] text-gray-500 uppercase tracking-wider mb-1">Hostname Server</p>
                            <p className="text-sm font-mono text-gray-300">{health?.process.hostname}</p>
                        </div>
                    </div>
                </motion.div>

                {/* Database Collections */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.4 }}
                    className="bg-[#0a0a0a] border border-white/[0.06] rounded-2xl overflow-hidden"
                >
                    <div className="flex items-center justify-between px-5 py-4 border-b border-white/[0.06]">
                        <div className="flex items-center gap-2">
                            <Database className="w-4 h-4 text-amber-400" />
                            <h3 className="text-sm font-semibold">MongoDB Collections</h3>
                        </div>
                        <span className="text-[10px] text-gray-600 font-mono">{health?.database ? formatBytes(health.database.dataSize) : 'Loading...'} </span>
                    </div>
                    <div className="divide-y divide-white/[0.04] max-h-[400px] overflow-y-auto custom-scrollbar">
                        {health?.collections.map((col) => (
                            <div key={col.name} className="px-5 py-3.5 flex items-center justify-between hover:bg-white/[0.02] transition-colors">
                                <div className="flex items-center gap-3">
                                    <div className="w-6 h-6 bg-amber-500/10 rounded-md flex items-center justify-center">
                                        <Layers className="w-3 h-3 text-amber-400" />
                                    </div>
                                    <div>
                                        <p className="text-xs font-medium font-mono text-gray-300">{col.name}</p>
                                        <p className="text-[10px] text-gray-600">
                                            {formatBytes(col.storageSizeBytes)} • {col.indexCount} indexes
                                        </p>
                                    </div>
                                </div>
                                <span className="text-sm font-bold text-gray-400">{col.documentCount.toLocaleString()}</span>
                            </div>
                        ))}
                        {(!health?.collections || health.collections.length === 0) && (
                            <div className="p-8 text-center text-gray-500 text-sm">No collection data available</div>
                        )}
                    </div>
                </motion.div>
            </div>

            {/* Environment Info */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 }}
                className="bg-[#0a0a0a] border border-white/[0.06] rounded-2xl p-5"
            >
                <h3 className="text-sm font-semibold mb-4 flex items-center gap-2">
                    <Shield className="w-4 h-4 text-blue-400" />
                    Live Environment Configuration
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
                    {health?.environment.map(item => (
                        <div key={item.key} className="px-3 py-2.5 bg-white/[0.02] border border-white/[0.04] rounded-lg">
                            <p className="text-[10px] text-gray-600 uppercase tracking-wider">{item.key}</p>
                            <p className="text-xs font-medium text-gray-300 mt-0.5">{item.value}</p>
                            <p className="text-[10px] text-gray-500 font-mono whitespace-nowrap overflow-hidden text-ellipsis">{item.detail}</p>
                        </div>
                    ))}
                </div>
            </motion.div>
        </div>
    )
}
