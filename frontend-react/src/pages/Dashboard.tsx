import { useEffect, useState, useMemo } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import {
  Plus, Globe, Activity, Users, Zap, ArrowRight,
  BarChart3, Eye, Timer, ArrowUpRight,
  ChevronDown, Sparkles, CreditCard, ExternalLink
} from 'lucide-react'
import { AddSiteModal } from '@/components/sites/AddSiteModal'
import { useSites } from '@/hooks/use-sites'
import { useDashboardData } from '@/hooks/use-dashboard'
import { useAuth } from '@/hooks/use-auth'
import { cn } from '@/lib/utils'
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer
} from 'recharts'

function formatDuration(seconds: number): string {
  if (!seconds || seconds <= 0) return '0s'
  const m = Math.floor(seconds / 60)
  const s = Math.round(seconds % 60)
  if (m === 0) return `${s}s`
  return `${m}m ${s}s`
}

function formatNumber(num: number): string {
  if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M'
  if (num >= 1000) return (num / 1000).toFixed(1) + 'K'
  return num.toString()
}

function shortenUrl(url: string): string {
  try {
    const u = new URL(url)
    return u.pathname === '/' ? '/' : u.pathname
  } catch {
    return url.length > 40 ? url.slice(0, 40) + '…' : url
  }
}

// Skeleton loader
function Skeleton({ className }: { className?: string }) {
  return <div className={cn("animate-pulse rounded-md bg-muted/50", className)} />
}

// Sparkline mini chart
function MiniSparkline({ data, dataKey, color }: { data: any[]; dataKey: string; color: string }) {
  if (!data || data.length === 0) return null
  return (
    <ResponsiveContainer width="100%" height={40}>
      <AreaChart data={data} margin={{ top: 0, right: 0, left: 0, bottom: 0 }}>
        <defs>
          <linearGradient id={`spark-${dataKey}`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={color} stopOpacity={0.3} />
            <stop offset="100%" stopColor={color} stopOpacity={0} />
          </linearGradient>
        </defs>
        <Area
          type="monotone"
          dataKey={dataKey}
          stroke={color}
          strokeWidth={1.5}
          fill={`url(#spark-${dataKey})`}
          dot={false}
          isAnimationActive={true}
        />
      </AreaChart>
    </ResponsiveContainer>
  )
}

// Custom chart tooltip
function ChartTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null
  return (
    <div className="rounded-lg border bg-card/95 backdrop-blur-sm px-3 py-2 shadow-xl text-xs">
      <p className="text-muted-foreground mb-1">{label}</p>
      {payload.map((p: any, i: number) => (
        <p key={i} className="font-medium" style={{ color: p.color }}>
          {p.name}: {formatNumber(p.value)}
        </p>
      ))}
    </div>
  )
}

// Intent score color
function intentColor(score: number): string {
  if (score >= 80) return 'text-green-400'
  if (score >= 60) return 'text-yellow-400'
  if (score >= 40) return 'text-orange-400'
  return 'text-red-400'
}

function intentBg(score: number): string {
  if (score >= 80) return 'bg-green-500/10 border-green-500/30'
  if (score >= 60) return 'bg-yellow-500/10 border-yellow-500/30'
  if (score >= 40) return 'bg-orange-500/10 border-orange-500/30'
  return 'bg-red-500/10 border-red-500/30'
}

export default function DashboardPage() {
  const navigate = useNavigate()
  const { isAuthenticated, user } = useAuth()
  const [showAddModal, setShowAddModal] = useState(false)
  const [selectedDays, setSelectedDays] = useState(30)
  const [selectedSiteId, setSelectedSiteId] = useState<string | null>(null)

  const { sites, loading: sitesLoading, refetch } = useSites()

  // Auto-select first site
  useEffect(() => {
    if (!selectedSiteId && sites.length > 0) {
      setSelectedSiteId(sites[0].siteId)
    }
  }, [sites, selectedSiteId])

  const {
    overview, dailyStats, referrers, topPages,
    topAccounts, liveVisitors, subscription,
    loading: dataLoading, error: _dataError
  } = useDashboardData(selectedSiteId, selectedDays)

  const selectedSite = useMemo(
    () => sites.find((s: any) => s.siteId === selectedSiteId),
    [sites, selectedSiteId]
  )

  useEffect(() => {
    if (!isAuthenticated) navigate('/')
  }, [isAuthenticated, navigate])

  if (!isAuthenticated) return null

  const loading = sitesLoading || dataLoading
  const hasSites = sites.length > 0

  // Greeting based on time of day
  const hour = new Date().getHours()
  const greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening'

  // Usage percentages for subscription
  const usageItems = subscription?.plan?.features
    ? [
      {
        label: 'Sites',
        used: subscription.currentUsage.sitesCreated,
        max: subscription.plan.features.maxSites,
        color: 'from-purple-500 to-violet-500'
      },
      {
        label: 'Sessions',
        used: subscription.currentUsage.sessionsTracked,
        max: subscription.plan.features.maxSessionsPerMonth,
        color: 'from-blue-500 to-cyan-500'
      },
      {
        label: 'AI Calls',
        used: subscription.currentUsage.aiCallsMade,
        max: subscription.plan.features.maxAiCallsPerMonth,
        color: 'from-pink-500 to-rose-500'
      },
      {
        label: 'Crawl Pages',
        used: subscription.currentUsage.crawlPagesUsed,
        max: subscription.plan.features.maxCrawlPages,
        color: 'from-amber-500 to-orange-500'
      },
    ]
    : []

  return (
    <div className="space-y-8 max-w-[1400px] mx-auto">
      {/* ─── Header ─────────────────────────────────────────────── */}
      <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">
            {greeting}, {user?.name?.split(' ')[0] || 'User'}! 👋
          </h1>
          <p className="text-muted-foreground text-base mt-1">
            {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })}
          </p>
        </div>

        <div className="flex items-center gap-3 flex-wrap">
          {/* Site Selector */}
          {hasSites && (
            <div className="relative">
              <select
                value={selectedSiteId || ''}
                onChange={(e) => setSelectedSiteId(e.target.value)}
                className="appearance-none bg-card border rounded-lg px-4 py-2 pr-8 text-sm font-medium cursor-pointer hover:border-primary/50 transition-colors focus:outline-none focus:ring-2 focus:ring-primary/20"
              >
                {sites.map((site: any) => (
                  <option key={site.siteId} value={site.siteId}>
                    {site.name}
                  </option>
                ))}
              </select>
              <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
            </div>
          )}

          {/* Period Toggle */}
          <div className="flex items-center rounded-lg border bg-card p-0.5 text-sm">
            {[7, 30, 90].map((d) => (
              <button
                key={d}
                onClick={() => setSelectedDays(d)}
                className={cn(
                  "px-3 py-1.5 rounded-md font-medium transition-all",
                  selectedDays === d
                    ? "bg-primary text-primary-foreground shadow-sm"
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                {d}d
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* No Sites — Onboarding */}
      {!sitesLoading && !hasSites && (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <div className="rounded-full bg-primary/10 p-6 mb-6 animate-pulse">
            <Globe className="w-12 h-12 text-primary" />
          </div>
          <h2 className="text-2xl font-bold mb-2">Welcome to your dashboard!</h2>
          <p className="text-muted-foreground mb-6 max-w-md">
            Get started by adding your first website to begin tracking visitor intelligence.
          </p>
          <button
            onClick={() => setShowAddModal(true)}
            className="rounded-lg bg-gradient-to-r from-violet-600 to-indigo-600 px-6 py-3 text-sm font-medium text-white shadow-lg shadow-violet-500/20 hover:shadow-violet-500/40 transition-shadow"
          >
            <Plus className="w-4 h-4 inline mr-2" />
            Add Your First Site
          </button>
        </div>
      )}

      {/* ─── KPI Stats Row ──────────────────────────────────────── */}
      {hasSites && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Live Visitors — special pulse card */}
          <div className="relative overflow-hidden rounded-xl border bg-card p-5 group hover:shadow-lg hover:shadow-green-500/5 transition-all">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <div className="relative">
                  <div className="absolute inset-0 rounded-lg bg-green-500/20 animate-ping" />
                  <div className="relative p-2 rounded-lg bg-green-500/10 text-green-500">
                    <Activity className="w-4 h-4" />
                  </div>
                </div>
                <span className="text-xs font-medium text-green-500 uppercase tracking-wider">Live</span>
              </div>
            </div>
            {loading ? (
              <Skeleton className="h-8 w-20 mb-1" />
            ) : (
              <h3 className="text-3xl font-bold mb-1">{liveVisitors}</h3>
            )}
            <p className="text-muted-foreground text-sm">Active visitors now</p>
          </div>

          {/* Total Sessions */}
          <div className="relative overflow-hidden rounded-xl border bg-card p-5 group hover:shadow-lg hover:shadow-purple-500/5 transition-all">
            <div className="flex items-center justify-between mb-3">
              <div className="p-2 rounded-lg bg-purple-500/10 text-purple-500">
                <Eye className="w-4 h-4" />
              </div>
              <div className="w-20 h-8">
                <MiniSparkline data={dailyStats} dataKey="sessions" color="#a855f7" />
              </div>
            </div>
            {loading ? (
              <Skeleton className="h-8 w-24 mb-1" />
            ) : (
              <h3 className="text-3xl font-bold mb-1">{formatNumber(overview?.totalSessions ?? 0)}</h3>
            )}
            <p className="text-muted-foreground text-sm">Total sessions</p>
          </div>

          {/* Total Pageviews */}
          <div className="relative overflow-hidden rounded-xl border bg-card p-5 group hover:shadow-lg hover:shadow-blue-500/5 transition-all">
            <div className="flex items-center justify-between mb-3">
              <div className="p-2 rounded-lg bg-blue-500/10 text-blue-500">
                <BarChart3 className="w-4 h-4" />
              </div>
              <div className="w-20 h-8">
                <MiniSparkline data={dailyStats} dataKey="pageViews" color="#3b82f6" />
              </div>
            </div>
            {loading ? (
              <Skeleton className="h-8 w-24 mb-1" />
            ) : (
              <h3 className="text-3xl font-bold mb-1">{formatNumber(overview?.totalPageViews ?? 0)}</h3>
            )}
            <p className="text-muted-foreground text-sm">Total page views</p>
          </div>

          {/* Avg Duration & Bounce */}
          <div className="relative overflow-hidden rounded-xl border bg-card p-5 group hover:shadow-lg hover:shadow-amber-500/5 transition-all">
            <div className="flex items-center justify-between mb-3">
              <div className="p-2 rounded-lg bg-amber-500/10 text-amber-500">
                <Timer className="w-4 h-4" />
              </div>
            </div>
            {loading ? (
              <Skeleton className="h-8 w-24 mb-1" />
            ) : (
              <h3 className="text-3xl font-bold mb-1">{formatDuration(overview?.avgSessionDuration ?? 0)}</h3>
            )}
            <p className="text-muted-foreground text-sm">
              Avg duration · <span className="text-foreground font-medium">{(overview?.bounceRate ?? 0).toFixed(1)}%</span> bounce
            </p>
          </div>
        </div>
      )}

      {/* ─── Traffic Trends Chart ───────────────────────────────── */}
      {hasSites && (
        <div className="rounded-xl border bg-card p-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-lg font-semibold">Traffic Trends</h2>
              <p className="text-muted-foreground text-sm">Sessions & page views over the last {selectedDays} days</p>
            </div>
            {selectedSite && (
              <Link
                to={`/dashboard/sites/${selectedSite.siteId}/analytics`}
                className="text-sm font-medium text-primary hover:text-primary/80 flex items-center gap-1 transition-colors"
              >
                Full Analytics <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            )}
          </div>
          {loading ? (
            <Skeleton className="h-[280px] w-full" />
          ) : dailyStats.length > 0 ? (
            <ResponsiveContainer width="100%" height={280}>
              <AreaChart data={dailyStats} margin={{ top: 5, right: 10, left: -10, bottom: 0 }}>
                <defs>
                  <linearGradient id="gradSessions" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#a855f7" stopOpacity={0.25} />
                    <stop offset="100%" stopColor="#a855f7" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="gradPageViews" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#3b82f6" stopOpacity={0.2} />
                    <stop offset="100%" stopColor="#3b82f6" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.4} />
                <XAxis
                  dataKey="date"
                  tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }}
                  tickLine={false}
                  axisLine={false}
                  tickFormatter={(d: string) => {
                    const date = new Date(d)
                    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
                  }}
                />
                <YAxis
                  tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }}
                  tickLine={false}
                  axisLine={false}
                  tickFormatter={formatNumber}
                />
                <Tooltip content={<ChartTooltip />} />
                <Area
                  type="monotone"
                  dataKey="sessions"
                  name="Sessions"
                  stroke="#a855f7"
                  strokeWidth={2}
                  fill="url(#gradSessions)"
                  dot={false}
                  activeDot={{ r: 4, fill: '#a855f7', stroke: '#fff', strokeWidth: 2 }}
                />
                <Area
                  type="monotone"
                  dataKey="pageViews"
                  name="Page Views"
                  stroke="#3b82f6"
                  strokeWidth={2}
                  fill="url(#gradPageViews)"
                  dot={false}
                  activeDot={{ r: 4, fill: '#3b82f6', stroke: '#fff', strokeWidth: 2 }}
                />
              </AreaChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex items-center justify-center h-[280px] text-muted-foreground text-sm">
              No traffic data available for this period
            </div>
          )}
        </div>
      )}

      {/* ─── Two Column: Top Pages + Sources ────────────────────── */}
      {hasSites && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Top Pages */}
          <div className="rounded-xl border bg-card">
            <div className="p-5 border-b">
              <h3 className="font-semibold">Top Pages</h3>
              <p className="text-muted-foreground text-xs mt-0.5">Most visited pages</p>
            </div>
            <div className="p-4">
              {loading ? (
                <div className="space-y-3">
                  {[...Array(5)].map((_, i) => <Skeleton key={i} className="h-8 w-full" />)}
                </div>
              ) : topPages.length > 0 ? (
                <div className="space-y-1">
                  {topPages.slice(0, 8).map((page, i) => {
                    const maxViews = topPages[0]?.views || 1
                    const pct = (page.views / maxViews) * 100
                    return (
                      <div key={i} className="group relative flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-muted/30 transition-colors">
                        <div
                          className="absolute inset-y-0 left-0 rounded-lg bg-primary/5"
                          style={{ width: `${pct}%` }}
                        />
                        <span className="relative text-sm font-mono text-muted-foreground min-w-[1.5rem]">{i + 1}</span>
                        <span className="relative flex-1 text-sm font-medium truncate">{shortenUrl(page.url)}</span>
                        <span className="relative text-sm text-muted-foreground tabular-nums">{formatNumber(page.views)}</span>
                        <span className="relative text-xs text-muted-foreground/60 tabular-nums">{formatNumber(page.visitors)} visitors</span>
                      </div>
                    )
                  })}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground py-6 text-center">No page data yet</p>
              )}
            </div>
          </div>

          {/* Top Sources */}
          <div className="rounded-xl border bg-card">
            <div className="p-5 border-b">
              <h3 className="font-semibold">Top Sources</h3>
              <p className="text-muted-foreground text-xs mt-0.5">Where your visitors come from</p>
            </div>
            <div className="p-4">
              {loading ? (
                <div className="space-y-3">
                  {[...Array(5)].map((_, i) => <Skeleton key={i} className="h-8 w-full" />)}
                </div>
              ) : referrers.length > 0 ? (
                <div className="space-y-1">
                  {referrers.slice(0, 8).map((ref, i) => {
                    const maxCount = referrers[0]?.count || 1
                    const pct = (ref.count / maxCount) * 100
                    return (
                      <div key={i} className="group relative flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-muted/30 transition-colors">
                        <div
                          className="absolute inset-y-0 left-0 rounded-lg bg-indigo-500/5"
                          style={{ width: `${pct}%` }}
                        />
                        <div className="relative w-5 h-5 rounded bg-muted/50 flex items-center justify-center text-xs font-bold text-muted-foreground">
                          {ref.source.charAt(0).toUpperCase()}
                        </div>
                        <span className="relative flex-1 text-sm font-medium truncate">{ref.source || 'Direct'}</span>
                        <span className="relative text-sm text-muted-foreground tabular-nums">{formatNumber(ref.count)}</span>
                      </div>
                    )
                  })}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground py-6 text-center">No referrer data yet</p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ─── Two Column: High Intent + Subscription ─────────────── */}
      {hasSites && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* High Intent Accounts */}
          <div className="rounded-xl border bg-card">
            <div className="p-5 border-b flex items-center justify-between">
              <div>
                <h3 className="font-semibold">High Intent Accounts</h3>
                <p className="text-muted-foreground text-xs mt-0.5">Top accounts by intent score</p>
              </div>
              <Sparkles className="w-4 h-4 text-yellow-400" />
            </div>
            <div className="p-4">
              {loading ? (
                <div className="space-y-3">
                  {[...Array(5)].map((_, i) => <Skeleton key={i} className="h-14 w-full" />)}
                </div>
              ) : topAccounts.length > 0 ? (
                <div className="space-y-2">
                  {topAccounts.map((account) => (
                    <div
                      key={account.id}
                      className="flex items-center gap-3 p-3 rounded-lg border border-transparent hover:border-border hover:bg-muted/20 transition-all group"
                    >
                      <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-violet-500/20 to-indigo-500/20 flex items-center justify-center text-sm font-bold text-violet-400 flex-shrink-0">
                        {(account.organizationName || account.domain || '?').charAt(0).toUpperCase()}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">
                          {account.organizationName || account.domain || 'Unknown'}
                        </p>
                        <p className="text-xs text-muted-foreground truncate">
                          {account.domain} · {account.totalSessions} sessions
                        </p>
                      </div>
                      <div className={cn("px-2.5 py-1 rounded-full text-xs font-semibold border", intentBg(account.intentScore))}>
                        <span className={intentColor(account.intentScore)}>{account.intentScore}</span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="flex flex-col items-center py-8 text-center">
                  <Users className="w-8 h-8 text-muted-foreground/40 mb-2" />
                  <p className="text-sm text-muted-foreground">No high intent accounts detected yet</p>
                </div>
              )}
            </div>
          </div>

          {/* Subscription Usage */}
          <div className="rounded-xl border bg-card">
            <div className="p-5 border-b flex items-center justify-between">
              <div>
                <h3 className="font-semibold">Plan Usage</h3>
                <p className="text-muted-foreground text-xs mt-0.5">
                  {subscription?.plan?.name ?? 'No Plan'} plan
                </p>
              </div>
              <Link
                to="/dashboard/subscription"
                className="text-xs font-medium text-primary hover:text-primary/80 flex items-center gap-1"
              >
                Manage <ExternalLink className="w-3 h-3" />
              </Link>
            </div>
            <div className="p-5 space-y-4">
              {usageItems.length > 0 ? (
                usageItems.map((item, i) => {
                  const pct = item.max > 0 ? Math.min((item.used / item.max) * 100, 100) : 0
                  const isHigh = pct >= 80
                  return (
                    <div key={i}>
                      <div className="flex justify-between text-sm mb-1.5">
                        <span className="text-muted-foreground">{item.label}</span>
                        <span className={cn("font-medium tabular-nums", isHigh && "text-red-400")}>
                          {formatNumber(item.used)} / {formatNumber(item.max)}
                        </span>
                      </div>
                      <div className="h-2 rounded-full bg-muted/50 overflow-hidden">
                        <div
                          className={cn(
                            "h-full rounded-full transition-all duration-700 bg-gradient-to-r",
                            isHigh ? "from-red-500 to-red-400" : item.color
                          )}
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                    </div>
                  )
                })
              ) : (
                <div className="flex flex-col items-center py-6 text-center">
                  <CreditCard className="w-8 h-8 text-muted-foreground/40 mb-2" />
                  <p className="text-sm text-muted-foreground">No active subscription</p>
                  <Link
                    to="/dashboard/subscription"
                    className="mt-3 text-sm font-medium text-primary hover:underline"
                  >
                    View Plans →
                  </Link>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ─── Your Websites ──────────────────────────────────────── */}
      {hasSites && (
        <div className="rounded-xl border bg-card">
          <div className="flex items-center justify-between p-5 border-b">
            <h2 className="font-semibold">Your Websites</h2>
            <div className="flex items-center gap-3">
              <button
                onClick={() => setShowAddModal(true)}
                className="text-xs font-medium bg-primary/10 text-primary px-3 py-1.5 rounded-md hover:bg-primary/20 transition-colors"
              >
                <Plus className="w-3 h-3 inline mr-1" />Add Site
              </button>
              <Link
                to="/dashboard/sites"
                className="text-sm font-medium text-primary hover:text-primary/80 flex items-center transition-colors"
              >
                View All <ArrowRight className="w-3.5 h-3.5 ml-1" />
              </Link>
            </div>
          </div>
          <div className="p-5">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {sites.slice(0, 6).map((site: any) => (
                <Link
                  key={site.id}
                  to={`/dashboard/sites/${site.siteId}`}
                  className="group block rounded-xl border p-4 hover:border-primary/30 hover:shadow-md hover:shadow-primary/5 transition-all"
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-lg bg-primary/10 text-primary group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
                        <Globe className="w-4 h-4" />
                      </div>
                      <div className="min-w-0">
                        <p className="font-medium truncate">{site.name}</p>
                        <p className="text-xs text-muted-foreground truncate">{site.domain || 'No domain'}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <span className={cn("h-2 w-2 rounded-full", site.isActive ? "bg-green-500" : "bg-gray-400")} />
                      <span className="text-xs text-muted-foreground">{site.isActive ? 'Active' : 'Inactive'}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-muted-foreground group-hover:text-primary transition-colors">
                    View Details <ArrowUpRight className="w-3 h-3" />
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ─── Quick Actions ──────────────────────────────────────── */}
      {hasSites && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <button
            onClick={() => setShowAddModal(true)}
            className="group relative flex flex-col items-start overflow-hidden rounded-xl border bg-card p-6 text-left transition-all hover:border-primary/50 hover:shadow-lg hover:shadow-primary/5"
          >
            <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
              <Plus className="w-24 h-24 text-primary" />
            </div>
            <div className="mb-3 rounded-lg bg-primary/10 p-2.5 text-primary group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
              <Plus className="w-5 h-5" />
            </div>
            <h3 className="text-base font-semibold mb-1">Add New Website</h3>
            <p className="text-muted-foreground text-sm mb-3 max-w-sm">
              Register a new site to start tracking visitor intelligence
            </p>
            <div className="mt-auto flex items-center text-sm font-medium text-primary group-hover:translate-x-1 transition-transform">
              Get Started <ArrowRight className="w-4 h-4 ml-1" />
            </div>
          </button>

          <Link
            to="/dashboard/crawling"
            className="group relative flex flex-col items-start overflow-hidden rounded-xl border bg-card p-6 text-left transition-all hover:border-blue-500/50 hover:shadow-lg hover:shadow-blue-500/5"
          >
            <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
              <Zap className="w-24 h-24 text-blue-500" />
            </div>
            <div className="mb-3 rounded-lg bg-blue-500/10 p-2.5 text-blue-500 group-hover:bg-blue-600 group-hover:text-white transition-colors">
              <Zap className="w-5 h-5" />
            </div>
            <h3 className="text-base font-semibold mb-1">Website Crawling</h3>
            <p className="text-muted-foreground text-sm mb-3 max-w-sm">
              Crawl and index your website content for AI-powered insights
            </p>
            <div className="mt-auto flex items-center text-sm font-medium text-blue-500 group-hover:translate-x-1 transition-transform">
              View Crawler <ArrowRight className="w-4 h-4 ml-1" />
            </div>
          </Link>
        </div>
      )}

      {/* Add Site Modal */}
      <AddSiteModal
        isOpen={showAddModal}
        onClose={() => setShowAddModal(false)}
        onSuccess={() => {
          refetch()
          setShowAddModal(false)
        }}
      />
    </div>
  )
}
