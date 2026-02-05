import { useEffect } from 'react'
import { useNavigate, useParams, Link } from 'react-router-dom'
import { useSite } from '@/hooks/use-sites'
import { useAuth } from '@/hooks/use-auth'
import { cn } from '@/lib/utils'

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
    ExternalLink,
    Bot
} from 'lucide-react'

export default function SiteOverviewPage() {
    const navigate = useNavigate()
    const { siteId } = useParams<{ siteId: string }>()
    const { isAuthenticated } = useAuth()

    const { site, loading, error } = useSite(siteId || '')

    useEffect(() => {
        if (!isAuthenticated) {
            navigate('/')
        }
    }, [isAuthenticated, navigate])

    if (!isAuthenticated) {
        return null
    }

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[50vh]">
                <div className="text-center">
                    <RefreshCw className="w-8 h-8 animate-spin mx-auto mb-4 text-primary" />
                    <p className="text-muted-foreground">Loading site overview...</p>
                </div>
            </div>
        )
    }

    if (error || !site) {
        return (
            <div className="p-8">
                <div className="rounded-lg bg-destructive/10 border border-destructive/20 p-6 text-center">
                    <AlertCircle className="w-12 h-12 text-destructive mx-auto mb-4" />
                    <h3 className="text-xl font-bold text-destructive mb-2">Error Loading Site</h3>
                    <p className="text-muted-foreground">{error?.message || 'Site not found'}</p>
                </div>
            </div>
        )
    }

    const quickActions = [
        {
            name: 'Site Settings',
            description: 'Configure tracking and permissions',
            icon: Settings,
            href: `/dashboard/sites/${siteId}/settings`,
            color: 'text-blue-500',
            bgColor: 'bg-blue-500/10'
        },
        {
            name: 'Tracking Code',
            description: 'Get installation code',
            icon: Code,
            href: '/dashboard/tracking-code',
            color: 'text-green-500',
            bgColor: 'bg-green-500/10'
        },
        {
            name: 'Start Crawling',
            description: 'Index website content',
            icon: Zap,
            href: '/dashboard/crawling',
            color: 'text-purple-500',
            bgColor: 'bg-purple-500/10'
        },
        {
            name: 'View Analytics',
            description: 'See visitor insights',
            icon: BarChart3,
            href: `/dashboard/${siteId}?tab=analytics`,
            color: 'text-pink-500',
            bgColor: 'bg-pink-500/10'
        },
        {
            name: 'AI Intent Prompts',
            description: 'Configure AI triggers',
            icon: Bot,
            href: `/dashboard/sites/${siteId}/prompts`,
            color: 'text-yellow-500',
            bgColor: 'bg-yellow-500/10'
        }
    ]

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                    <div className="p-3 bg-primary/10 rounded-xl">
                        <Globe className="w-8 h-8 text-primary" />
                    </div>
                    <div>
                        <h1 className="text-3xl font-bold tracking-tight">{site.name}</h1>
                        <div className="flex items-center space-x-2 mt-1">
                            <span className="text-muted-foreground text-sm">{site.domain || 'No domain set'}</span>
                            {site.domain && (
                                <a
                                    href={`https://${site.domain}`}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="text-primary hover:underline"
                                >
                                    <ExternalLink className="w-3.5 h-3.5" />
                                </a>
                            )}
                        </div>
                    </div>
                </div>
                <div className="flex items-center space-x-3">
                    <span
                        className={cn(
                            "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 border-transparent",
                            site.isActive
                                ? "bg-green-500/15 text-green-700 dark:text-green-400"
                                : "bg-red-500/15 text-red-700 dark:text-red-400"
                        )}
                    >
                        {site.isActive ? '● Active' : '● Inactive'}
                    </span>
                    <Link
                        to={`/dashboard/sites/${siteId}/settings`}
                        className="inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 border border-input bg-background shadow-sm hover:bg-accent hover:text-accent-foreground h-9 px-4 py-2"
                    >
                        <Settings className="mr-2 h-4 w-4" />
                        Settings
                    </Link>
                </div>
            </div>

            {/* Site ID */}
            <div className="flex items-center space-x-2">
                <span className="text-sm text-muted-foreground">Site ID:</span>
                <code className="rounded bg-muted px-[0.3rem] py-[0.2rem] font-mono text-sm font-semibold">{site.siteId}</code>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <div className="rounded-lg border bg-card text-card-foreground shadow-sm p-6">
                    <div className="flex items-center justify-between mb-2">
                        <div className="p-2 bg-blue-500/10 rounded-lg">
                            <Users className="w-4 h-4 text-blue-500" />
                        </div>
                        <TrendingUp className="w-4 h-4 text-green-500" />
                    </div>
                    <div className="text-2xl font-bold">0</div>
                    <div className="text-xs text-muted-foreground">Total Visitors</div>
                </div>

                <div className="rounded-lg border bg-card text-card-foreground shadow-sm p-6">
                    <div className="flex items-center justify-between mb-2">
                        <div className="p-2 bg-purple-500/10 rounded-lg">
                            <Activity className="w-4 h-4 text-purple-500" />
                        </div>
                        <TrendingUp className="w-4 h-4 text-green-500" />
                    </div>
                    <div className="text-2xl font-bold">0</div>
                    <div className="text-xs text-muted-foreground">Pageviews</div>
                </div>

                <div className="rounded-lg border bg-card text-card-foreground shadow-sm p-6">
                    <div className="flex items-center justify-between mb-2">
                        <div className="p-2 bg-green-500/10 rounded-lg">
                            <BarChart3 className="w-4 h-4 text-green-500" />
                        </div>
                        <TrendingUp className="w-4 h-4 text-green-500" />
                    </div>
                    <div className="text-2xl font-bold">0</div>
                    <div className="text-xs text-muted-foreground">Identified Accounts</div>
                </div>

                <div className="rounded-lg border bg-card text-card-foreground shadow-sm p-6">
                    <div className="flex items-center justify-between mb-2">
                        <div className="p-2 bg-pink-500/10 rounded-lg">
                            <Zap className="w-4 h-4 text-pink-500" />
                        </div>
                    </div>
                    <div className="text-2xl font-bold">{site.settings.dataRetentionDays}</div>
                    <div className="text-xs text-muted-foreground">Days Retention</div>
                </div>
            </div>

            {/* Configuration Status */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <div className="rounded-lg border bg-card text-card-foreground shadow-sm p-6">
                    <h2 className="text-lg font-semibold mb-4">Tracking Configuration</h2>
                    <div className="space-y-4">
                        <div className="flex items-center justify-between p-3 rounded-md border bg-muted/30">
                            <div className="flex items-center space-x-3">
                                <Eye className="w-4 h-4 text-blue-500" />
                                <span className="font-medium">Visitor Tracking</span>
                            </div>
                            {site.settings.enableTracking ? (
                                <CheckCircle className="w-5 h-5 text-green-500" />
                            ) : (
                                <XCircle className="w-5 h-5 text-destructive" />
                            )}
                        </div>

                        <div className="flex items-center justify-between p-3 rounded-md border bg-muted/30">
                            <div className="flex items-center space-x-3">
                                <MapPin className="w-4 h-4 text-green-500" />
                                <span className="font-medium">Geo-Location</span>
                            </div>
                            {site.settings.enableGeoLocation ? (
                                <CheckCircle className="w-5 h-5 text-green-500" />
                            ) : (
                                <XCircle className="w-5 h-5 text-destructive" />
                            )}
                        </div>

                        <div className="flex items-center justify-between p-3 rounded-md border bg-muted/30">
                            <div className="flex items-center space-x-3">
                                <Activity className="w-4 h-4 text-purple-500" />
                                <span className="font-medium">Behavior Tracking</span>
                            </div>
                            {site.settings.enableBehaviorTracking ? (
                                <CheckCircle className="w-5 h-5 text-green-500" />
                            ) : (
                                <XCircle className="w-5 h-5 text-destructive" />
                            )}
                        </div>

                        <div className="flex items-center justify-between p-3 rounded-md border bg-muted/30">
                            <div className="flex items-center space-x-3">
                                <Database className="w-4 h-4 text-orange-500" />
                                <span className="font-medium">Data Retention</span>
                            </div>
                            <span className="font-semibold">{site.settings.dataRetentionDays} days</span>
                        </div>
                    </div>
                </div>

                <div className="rounded-lg border bg-card text-card-foreground shadow-sm p-6">
                    <h2 className="text-lg font-semibold mb-4">Allowed Domains</h2>
                    {site.allowedDomains && site.allowedDomains.length > 0 ? (
                        <div className="space-y-2">
                            {site.allowedDomains.map((domain, idx) => (
                                <div key={idx} className="flex items-center space-x-3 p-3 rounded-md border bg-muted/30">
                                    <Globe className="w-4 h-4 text-blue-500" />
                                    <span className="font-mono text-sm">{domain}</span>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="text-center p-8 border border-dashed rounded-lg">
                            <Globe className="w-10 h-10 text-muted-foreground mx-auto mb-3 opacity-50" />
                            <p className="font-medium">All domains allowed</p>
                            <p className="text-sm text-muted-foreground mt-1">No restrictions. Tracking works on any domain where the script is installed.</p>
                        </div>
                    )}
                </div>
            </div>

            {/* Quick Actions */}
            <div className="rounded-lg border bg-card text-card-foreground shadow-sm p-6">
                <h2 className="text-lg font-semibold mb-4">Quick Actions</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    {quickActions.map((action, idx) => (
                        <Link
                            key={idx}
                            to={action.href}
                            className="group flex flex-col p-4 rounded-lg border hover:bg-accent hover:text-accent-foreground transition-all"
                        >
                            <div className={cn("p-2 rounded-lg inline-flex mb-3 w-fit transition-transform group-hover:scale-110", action.bgColor)}>
                                <action.icon className={cn("w-5 h-5", action.color)} />
                            </div>
                            <h3 className="font-semibold mb-1">{action.name}</h3>
                            <p className="text-sm text-muted-foreground">{action.description}</p>
                        </Link>
                    ))}
                </div>
            </div>

            {/* Site Info */}
            <div className="rounded-lg border bg-card text-card-foreground shadow-sm p-6">
                <h2 className="text-lg font-semibold mb-4">Site Information</h2>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-sm">
                    <div>
                        <div className="text-muted-foreground mb-1">Created</div>
                        <div className="font-medium">{new Date(site.createdAt).toLocaleString()}</div>
                    </div>
                    <div>
                        <div className="text-muted-foreground mb-1">Last Updated</div>
                        <div className="font-medium">{new Date(site.updatedAt).toLocaleString()}</div>
                    </div>
                    <div>
                        <div className="text-muted-foreground mb-1">Owner ID</div>
                        <div className="font-mono text-xs">{site.userId}</div>
                    </div>
                </div>
            </div>
        </div>
    )
}
