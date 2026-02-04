'use client'

import { useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { useQuery } from '@apollo/client'
import { useAuthStore } from '@/lib/auth-store'
import DashboardLayout from '@/components/DashboardLayout'
import Link from 'next/link'
import {
    BarChart3,
    Users,
    Activity,
    TrendingUp,
    Globe,
    Settings,
    Code,
    Zap,
    RefreshCw,
    AlertCircle,
    Eye,
    MapPin,
    Database,
    CheckCircle,
    XCircle,
    ExternalLink
} from 'lucide-react'
import { GET_SITE, type GetSiteResponse } from '@/lib/graphql/site-operations'

export default function SiteOverviewPage() {
    const router = useRouter()
    const params = useParams()
    const siteId = params.siteId as string
    const isAuthenticated = useAuthStore((state) => state.isAuthenticated)

    const { data, loading, error } = useQuery<GetSiteResponse>(GET_SITE, {
        variables: { siteId },
        skip: !isAuthenticated() || !siteId
    })

    useEffect(() => {
        if (!isAuthenticated()) {
            router.push('/')
        }
    }, [isAuthenticated, router])

    if (!isAuthenticated()) {
        return null
    }

    if (loading) {
        return (
            <DashboardLayout currentSiteId={siteId}>
                <div className="flex items-center justify-center min-h-screen">
                    <div className="text-center">
                        <RefreshCw className="w-12 h-12 text-purple-500 animate-spin mx-auto mb-4" />
                        <p className="text-gray-400">Loading site overview...</p>
                    </div>
                </div>
            </DashboardLayout>
        )
    }

    if (error || !data?.getSite) {
        return (
            <DashboardLayout currentSiteId={siteId}>
                <div className="p-8">
                    <div className="bg-red-900/20 border border-red-500/30 rounded-2xl p-6 text-center">
                        <AlertCircle className="w-12 h-12 text-red-400 mx-auto mb-4" />
                        <h3 className="text-xl font-bold text-white mb-2">Error Loading Site</h3>
                        <p className="text-gray-400">{error?.message || 'Site not found'}</p>
                    </div>
                </div>
            </DashboardLayout>
        )
    }

    const site = data.getSite

    const quickActions = [
        {
            name: 'Site Settings',
            description: 'Configure tracking and permissions',
            icon: Settings,
            href: `/dashboard/sites/${siteId}/settings`,
            color: 'blue'
        },
        {
            name: 'Tracking Code',
            description: 'Get installation code',
            icon: Code,
            href: '/dashboard/tracking-code',
            color: 'green'
        },
        {
            name: 'Start Crawling',
            description: 'Index website content',
            icon: Zap,
            href: '/dashboard/crawling',
            color: 'purple'
        },
        {
            name: 'View Analytics',
            description: 'See visitor insights',
            icon: BarChart3,
            href: `/dashboard/${siteId}?tab=analytics`,
            color: 'pink'
        }
    ]

    return (
        <DashboardLayout currentSiteId={siteId}>
            <div className="p-8 max-w-7xl mx-auto">
                {/* Header */}
                <div className="mb-8">
                    <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center space-x-4">
                            <div className="p-3 bg-gradient-to-br from-purple-600 to-pink-600 rounded-xl shadow-lg">
                                <Globe className="w-8 h-8 text-white" />
                            </div>
                            <div>
                                <h1 className="text-4xl font-bold text-white">{site.name}</h1>
                                <div className="flex items-center space-x-3 mt-1">
                                    <span className="text-gray-400">{site.domain || 'No domain set'}</span>
                                    {site.domain && (
                                        <a
                                            href={`https://${site.domain}`}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="text-blue-400 hover:text-blue-300 transition-colors"
                                        >
                                            <ExternalLink className="w-4 h-4" />
                                        </a>
                                    )}
                                </div>
                            </div>
                        </div>
                        <div className="flex items-center space-x-3">
                            <span
                                className={`px-4 py-2 rounded-full text-sm font-medium ${site.isActive
                                        ? 'bg-green-500/20 text-green-400 border border-green-500/30'
                                        : 'bg-red-500/20 text-red-400 border border-red-500/30'
                                    }`}
                            >
                                {site.isActive ? '● Active' : '● Inactive'}
                            </span>
                            <Link
                                href={`/dashboard/sites/${siteId}/settings`}
                                className="px-4 py-2 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-lg hover:from-purple-700 hover:to-pink-700 transition-all font-medium flex items-center space-x-2"
                            >
                                <Settings className="w-4 h-4" />
                                <span>Settings</span>
                            </Link>
                        </div>
                    </div>

                    {/* Site ID */}
                    <div className="inline-flex items-center space-x-2 px-3 py-1 bg-white/5 border border-white/10 rounded-lg">
                        <span className="text-sm text-gray-400">Site ID:</span>
                        <code className="text-sm text-purple-400 font-mono">{site.siteId}</code>
                    </div>
                </div>

                {/* Stats Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                    <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-6">
                        <div className="flex items-center justify-between mb-2">
                            <div className="p-2 bg-blue-500/20 rounded-lg">
                                <Users className="w-6 h-6 text-blue-400" />
                            </div>
                            <TrendingUp className="w-5 h-5 text-green-400" />
                        </div>
                        <div className="text-3xl font-bold text-white mb-1">0</div>
                        <div className="text-sm text-gray-400">Total Visitors</div>
                    </div>

                    <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-6">
                        <div className="flex items-center justify-between mb-2">
                            <div className="p-2 bg-purple-500/20 rounded-lg">
                                <Activity className="w-6 h-6 text-purple-400" />
                            </div>
                            <TrendingUp className="w-5 h-5 text-green-400" />
                        </div>
                        <div className="text-3xl font-bold text-white mb-1">0</div>
                        <div className="text-sm text-gray-400">Pageviews</div>
                    </div>

                    <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-6">
                        <div className="flex items-center justify-between mb-2">
                            <div className="p-2 bg-green-500/20 rounded-lg">
                                <BarChart3 className="w-6 h-6 text-green-400" />
                            </div>
                            <TrendingUp className="w-5 h-5 text-green-400" />
                        </div>
                        <div className="text-3xl font-bold text-white mb-1">0</div>
                        <div className="text-sm text-gray-400">Identified Accounts</div>
                    </div>

                    <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-6">
                        <div className="flex items-center justify-between mb-2">
                            <div className="p-2 bg-pink-500/20 rounded-lg">
                                <Zap className="w-6 h-6 text-pink-400" />
                            </div>
                        </div>
                        <div className="text-3xl font-bold text-white mb-1">{site.settings.dataRetentionDays}</div>
                        <div className="text-sm text-gray-400">Days Retention</div>
                    </div>
                </div>

                {/* Configuration Status */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
                    <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-6">
                        <h2 className="text-2xl font-bold text-white mb-6">Tracking Configuration</h2>
                        <div className="space-y-4">
                            <div className="flex items-center justify-between p-4 bg-gray-800/50 rounded-lg">
                                <div className="flex items-center space-x-3">
                                    <Eye className="w-5 h-5 text-blue-400" />
                                    <span className="text-white">Visitor Tracking</span>
                                </div>
                                {site.settings.enableTracking ? (
                                    <CheckCircle className="w-5 h-5 text-green-400" />
                                ) : (
                                    <XCircle className="w-5 h-5 text-red-400" />
                                )}
                            </div>

                            <div className="flex items-center justify-between p-4 bg-gray-800/50 rounded-lg">
                                <div className="flex items-center space-x-3">
                                    <MapPin className="w-5 h-5 text-green-400" />
                                    <span className="text-white">Geo-Location</span>
                                </div>
                                {site.settings.enableGeoLocation ? (
                                    <CheckCircle className="w-5 h-5 text-green-400" />
                                ) : (
                                    <XCircle className="w-5 h-5 text-red-400" />
                                )}
                            </div>

                            <div className="flex items-center justify-between p-4 bg-gray-800/50 rounded-lg">
                                <div className="flex items-center space-x-3">
                                    <Activity className="w-5 h-5 text-purple-400" />
                                    <span className="text-white">Behavior Tracking</span>
                                </div>
                                {site.settings.enableBehaviorTracking ? (
                                    <CheckCircle className="w-5 h-5 text-green-400" />
                                ) : (
                                    <XCircle className="w-5 h-5 text-red-400" />
                                )}
                            </div>

                            <div className="flex items-center justify-between p-4 bg-gray-800/50 rounded-lg">
                                <div className="flex items-center space-x-3">
                                    <Database className="w-5 h-5 text-orange-400" />
                                    <span className="text-white">Data Retention</span>
                                </div>
                                <span className="text-purple-400 font-semibold">{site.settings.dataRetentionDays} days</span>
                            </div>
                        </div>
                    </div>

                    <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-6">
                        <h2 className="text-2xl font-bold text-white mb-6">Allowed Domains</h2>
                        {site.allowedDomains && site.allowedDomains.length > 0 ? (
                            <div className="space-y-2">
                                {site.allowedDomains.map((domain, idx) => (
                                    <div key={idx} className="flex items-center space-x-3 p-3 bg-gray-800 rounded-lg">
                                        <Globe className="w-4 h-4 text-blue-400" />
                                        <span className="text-white font-mono text-sm">{domain}</span>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="text-center p-8 border border-dashed border-gray-700 rounded-lg">
                                <Globe className="w-12 h-12 text-gray-600 mx-auto mb-3" />
                                <p className="text-gray-400">All domains allowed</p>
                                <p className="text-sm text-gray-500 mt-1">No restrictions configured</p>
                            </div>
                        )}
                    </div>
                </div>

                {/* Quick Actions */}
                <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-6">
                    <h2 className="text-2xl font-bold text-white mb-6">Quick Actions</h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                        {quickActions.map((action, idx) => (
                            <Link
                                key={idx}
                                href={action.href}
                                className="p-6 bg-gradient-to-br from-gray-800 to-gray-900 rounded-xl hover:from-gray-700 hover:to-gray-800 transition-all border border-white/10 hover:border-purple-500/50 group"
                            >
                                <div className={`p-3 bg-${action.color}-500/20 rounded-lg inline-flex mb-4 group-hover:scale-110 transition-transform`}>
                                    <action.icon className={`w-6 h-6 text-${action.color}-400`} />
                                </div>
                                <h3 className="text-lg font-semibold text-white mb-1">{action.name}</h3>
                                <p className="text-sm text-gray-400">{action.description}</p>
                            </Link>
                        ))}
                    </div>
                </div>

                {/* Site Info */}
                <div className="mt-8 bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-6">
                    <h2 className="text-2xl font-bold text-white mb-6">Site Information</h2>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <div>
                            <div className="text-sm text-gray-400 mb-1">Created</div>
                            <div className="text-white font-medium">{new Date(site.createdAt).toLocaleString()}</div>
                        </div>
                        <div>
                            <div className="text-sm text-gray-400 mb-1">Last Updated</div>
                            <div className="text-white font-medium">{new Date(site.updatedAt).toLocaleString()}</div>
                        </div>
                        <div>
                            <div className="text-sm text-gray-400 mb-1">Owner ID</div>
                            <div className="text-white font-mono text-sm">{site.userId}</div>
                        </div>
                    </div>
                </div>
            </div>
        </DashboardLayout>
    )
}
