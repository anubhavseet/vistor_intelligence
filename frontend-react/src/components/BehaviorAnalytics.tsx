import { useState } from 'react'
import { useQuery } from '@apollo/client/react'
import {
  BarChart3,
  ArrowUpRight,
  Users,
  Clock,
  MousePointer2,
  LayoutGrid,
  Activity,
  Eye,
} from 'lucide-react'
import {
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  AreaChart,
  Area
} from 'recharts'
import { cn } from '@/lib/utils'
import { BehavioralAnalytics } from './analytics/BehavioralAnalytics'
import { VisualAnalytics } from './analytics/VisualAnalytics'
import { Button } from '@components/ui/button'


import { GET_BEHAVIOR_ANALYTICS } from '@/lib/queries/behavior-analytics'

const GET_ANALYTICS = GET_BEHAVIOR_ANALYTICS;

interface BehaviorAnalyticsProps {
  siteId: string
}

export default function BehaviorAnalytics({ siteId }: BehaviorAnalyticsProps) {
  const [days, setDays] = useState(30)
  const [activeTab, setActiveTab] = useState<'overview' | 'behavioral' | 'visual'>('overview')
  const [selectedVisualUrl, setSelectedVisualUrl] = useState<string | null>(null)

  const formatDuration = (seconds: number) => {
    if (!seconds) return '0s'
    const h = Math.floor(seconds / 3600)
    const m = Math.floor((seconds % 3600) / 60)
    const s = Math.floor(seconds % 60)

    if (h > 0) return `${h}h ${m}m ${s}s`
    if (m > 0) return `${m}m ${s}s`
    return `${s}s`
  }

  const { data, loading, error } = useQuery<any>(GET_ANALYTICS, {
    variables: { siteId, days },
    pollInterval: 60000 // Real-time updates every minute
  })

  if (loading && !data) return (
    <div className="flex h-64 items-center justify-center">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
    </div>
  )

  if (error) return (
    <div className="p-8 text-center text-destructive">
      Default Error: {error.message}
    </div>
  )

  const analytics = data?.getAnalyticsDashboard

  // Format daily stats for chart
  const chartData = analytics?.dailyStats.map((d: any) => ({
    ...d,
    date: new Date(d.date).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })
  }))

  return (
    <div className="space-y-6 animate-in fade-in duration-500">

      {/* Header Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        {/* Tabs */}
        <div className="flex items-center gap-4 border-b border-border w-full sm:w-auto overflow-x-auto">
          <button
            onClick={() => setActiveTab('overview')}
            className={cn(
              "pb-3 text-sm font-medium border-b-2 transition-colors flex items-center gap-2 whitespace-nowrap",
              activeTab === 'overview'
                ? "border-primary text-primary"
                : "border-transparent text-muted-foreground hover:text-foreground"
            )}
          >
            <LayoutGrid size={16} />
            Overview
          </button>
          <button
            onClick={() => setActiveTab('behavioral')}
            className={cn(
              "pb-3 text-sm font-medium border-b-2 transition-colors flex items-center gap-2 whitespace-nowrap",
              activeTab === 'behavioral'
                ? "border-primary text-primary"
                : "border-transparent text-muted-foreground hover:text-foreground"
            )}
          >
            <Activity size={16} />
            Behavioral
          </button>
          <button
            onClick={() => setActiveTab('visual')}
            className={cn(
              "pb-3 text-sm font-medium border-b-2 transition-colors flex items-center gap-2 whitespace-nowrap",
              activeTab === 'visual'
                ? "border-primary text-primary"
                : "border-transparent text-muted-foreground hover:text-foreground"
            )}
          >
            <Eye size={16} />
            Visual Analytics
          </button>
        </div>

        {/* Days Filter */}
        <div className="flex items-center gap-2 bg-muted/50 p-1 rounded-lg border flex-shrink-0">
          {[7, 30, 90].map((d) => (
            <button
              key={d}
              onClick={() => setDays(d)}
              className={cn(
                "px-3 py-1.5 text-sm font-medium rounded-md transition-all",
                days === d
                  ? "bg-background text-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              {d} Days
            </button>
          ))}
        </div>
      </div>

      {/* OVERVIEW TAB */}
      {activeTab === 'overview' && (
        <div className="space-y-6 animate-in fade-in duration-300">
          {/* Overview Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <OverviewCard
              title="Total Sessions"
              value={analytics?.overview.totalSessions.toLocaleString()}
              icon={Users}
              color="text-blue-500"
            />
            <OverviewCard
              title="Page Views"
              value={analytics?.overview.totalPageViews.toLocaleString()}
              icon={MousePointer2}
              color="text-purple-500"
            />
            <OverviewCard
              title="Avg. Duration"
              value={formatDuration(analytics?.overview.avgSessionDuration)}
              icon={Clock}
              color="text-amber-500"
            />
            <OverviewCard
              title="Bounce Rate"
              value={`${analytics?.overview.bounceRate}%`}
              icon={ArrowUpRight}
              inverseTrend // high is bad usually
              color="text-pink-500"
            />
          </div>

          {/* Main Chart */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 rounded-xl border bg-card/50 backdrop-blur-sm p-6 shadow-sm">
              <h3 className="text-lg font-semibold mb-6 flex items-center gap-2">
                <BarChart3 className="w-5 h-5 text-primary" />
                Traffic Overview
              </h3>
              <div className="h-[300px] w-full min-w-0">
                <ResponsiveContainer width="100%" height="100%" minWidth={0}>
                  <AreaChart data={chartData}>
                    <defs>
                      <linearGradient id="colorSessions" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#8884d8" stopOpacity={0.3} />
                        <stop offset="95%" stopColor="#8884d8" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#333" opacity={0.2} />
                    <XAxis
                      dataKey="date"
                      stroke="#888888"
                      fontSize={12}
                      tickLine={false}
                      axisLine={false}
                    />
                    <YAxis
                      stroke="#888888"
                      fontSize={12}
                      tickLine={false}
                      axisLine={false}
                      tickFormatter={(value) => `${value}`}
                    />
                    <Tooltip
                      contentStyle={{ backgroundColor: '#1f1f1f', border: '1px solid #333', borderRadius: '8px' }}
                    />
                    <Area
                      type="monotone"
                      dataKey="sessions"
                      stroke="#8884d8"
                      strokeWidth={3}
                      fillOpacity={1}
                      fill="url(#colorSessions)"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Referrers List */}
            <div className="rounded-xl border bg-card/50 backdrop-blur-sm p-6 shadow-sm">
              <h3 className="text-lg font-semibold mb-4">Top Sources</h3>
              <div className="space-y-4">
                {analytics?.referrers.map((ref: any, i: number) => (
                  <div key={i} className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-xs font-bold text-primary">
                        {ref.source[0]?.toUpperCase()}
                      </div>
                      <span className="text-sm font-medium truncate max-w-[120px]" title={ref.source}>
                        {ref.source.replace('https://', '').replace('http://', '').split('/')[0]}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="h-2 w-16 bg-muted rounded-full overflow-hidden">
                        <div
                          className="h-full bg-primary"
                          style={{ width: `${(ref.count / (analytics.referrers[0]?.count || 1)) * 100}%` }}
                        />
                      </div>
                      <span className="text-sm text-muted-foreground w-8 text-right">{ref.count}</span>
                    </div>
                  </div>
                ))}
                {analytics?.referrers.length === 0 && (
                  <div className="text-center text-muted-foreground py-8">No referrer data yet</div>
                )}
              </div>
            </div>
          </div>

          {/* Top Pages Table */}
          <div className="rounded-xl border bg-card/50 backdrop-blur-sm p-6 shadow-sm overflow-hidden flex flex-col">
            <h3 className="text-lg font-semibold mb-4">Top Pages</h3>
            <div className="overflow-auto flex-1">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border/50 text-left text-muted-foreground">
                    <th className="pb-3 font-medium">Page Path</th>
                    <th className="pb-3 font-medium text-right">Views</th>
                    <th className="pb-3 font-medium text-right">Visitors</th>
                    <th className="pb-3 font-medium text-right">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {analytics?.topPages.map((page: any, i: number) => (
                    <tr key={i} className="border-b border-border/10 hover:bg-muted/20 transition-colors">
                      <td className="py-3 font-medium text-foreground/80 truncate max-w-[400px]">
                        <a href={page.url} target="_blank" rel="noreferrer" className="hover:underline hover:text-primary">
                          {page.url.replace(/https?:\/\/[^\/]+/, '') || '/'}
                        </a>
                      </td>
                      <td className="py-3 text-right">{page.views}</td>
                      <td className="py-3 text-right">{page.visitors}</td>
                      <td className="py-3 text-right">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            setSelectedVisualUrl(page.url);
                            setActiveTab('visual');
                          }}
                          className="h-8 text-xs flex items-center gap-1"
                        >
                          <Eye size={12} />
                          Visualize
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {analytics?.topPages.length === 0 && (
                <div className="text-center text-muted-foreground py-12">No page data yet</div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* BEHAVIORAL TAB */}
      {activeTab === 'behavioral' && (
        <BehavioralAnalytics
          pagePerformance={analytics?.pagePerformance}
          userFlows={analytics?.userFlows}
          behavioralPatterns={analytics?.behavioralPatterns}
        />
      )}

      {/* VISUAL ANALYTICS TAB */}
      {activeTab === 'visual' && (
        <div className="space-y-6 animate-in fade-in duration-300">
          <div className="flex gap-4 overflow-x-auto pb-4 custom-scrollbar">
            {analytics?.topPages.map((page: any) => (
              <button
                key={page.url}
                onClick={() => setSelectedVisualUrl(page.url)}
                className={cn(
                  "px-4 py-2 rounded-lg border text-sm whitespace-nowrap transition-colors",
                  selectedVisualUrl === page.url
                    ? "bg-primary/10 border-primary text-primary font-medium"
                    : "bg-card border-border hover:bg-accent hover:text-accent-foreground text-muted-foreground"
                )}
              >
                {page.url.replace(/^https?:\/\/[^/]+/, '') || '/'}
              </button>
            ))}
          </div>

          <VisualAnalytics
            siteId={siteId}
            url={selectedVisualUrl || analytics?.topPages[0]?.url}
          />
        </div>
      )}
    </div>
  )
}

function OverviewCard({ title, value, icon: Icon, trend, inverseTrend, color }: any) {
  return (
    <div className="rounded-xl border bg-card/50 backdrop-blur-sm p-6 shadow-sm hover:border-primary/50 transition-colors group cursor-default">
      <div className="flex items-center justify-between mb-4">
        <div className={cn("p-2 rounded-lg bg-muted text-foreground group-hover:bg-primary/10 transition-colors", color && `group-hover:${color.replace('text-', 'text-')}`)}>
          <Icon className={cn("w-5 h-5 text-muted-foreground group-hover:text-primary transition-colors", color)} />
        </div>
        {trend && (
          <div className={cn("text-xs font-semibold px-2 py-1 rounded-full",
            (inverseTrend ? trend.startsWith('-') : trend.startsWith('+'))
              ? "bg-green-500/10 text-green-500"
              : "bg-red-500/10 text-red-500"
          )}>
            {trend}
          </div>
        )}
      </div>
      <div>
        <div className="text-2xl font-bold tracking-tight">{value}</div>
        <div className="text-xs text-muted-foreground mt-1">{title}</div>
      </div>
    </div>
  )
}
