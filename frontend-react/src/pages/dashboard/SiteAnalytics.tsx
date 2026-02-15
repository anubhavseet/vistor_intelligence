import { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useQuery } from '@apollo/client/react';
import {
    BarChart3,
    ArrowUpRight,
    Users,
    Clock,
    MousePointer2,
    Globe,
    ArrowLeft,
    Activity,
    Eye
} from 'lucide-react';
import {
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    AreaChart,
    Area
} from 'recharts';
import { MapContainer, TileLayer, CircleMarker, Popup } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';

import { cn } from '@/lib/utils';
import { BehavioralAnalytics } from '@/components/analytics/BehavioralAnalytics';
import { VisualAnalytics } from '@/components/analytics/VisualAnalytics';
import { GET_ANALYTICS } from '@/lib/queries';

export default function SiteAnalyticsPage() {
    const { siteId } = useParams<{ siteId: string }>();
    const [days, setDays] = useState(30);
    const [activeTab, setActiveTab] = useState<'overview' | 'behavioral' | 'visual'>('overview');
    const [selectedVisualUrl, setSelectedVisualUrl] = useState<string>('');

    const { data, loading, error } = useQuery(GET_ANALYTICS, {
        variables: { siteId: siteId || '', days },
        pollInterval: 60000 // Real-time updates every minute
    });

    if (loading && !data) return (
        <div className="flex h-screen items-center justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
    );

    if (error) return (
        <div className="p-8 text-center text-destructive">
            Default Error: {error.message}
        </div>
    );

    const analytics = (data as any)?.getAnalyticsDashboard;
    const site = (data as any)?.getSite;


    // Format daily stats for chart
    const chartData = analytics?.dailyStats.map((d: any) => ({
        ...d,
        date: new Date(d.date).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })
    }));

    return (
        <div className="space-y-8 p-6 animate-in fade-in duration-500">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <div className="flex items-center gap-2 mb-2">
                        <Link to={`/dashboard/sites/${siteId}`} className="text-muted-foreground hover:text-foreground transition-colors">
                            <ArrowLeft className="w-4 h-4" />
                        </Link>
                        <h1 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-primary to-purple-400 bg-clip-text text-transparent">
                            Analytics Dashboard
                        </h1>
                    </div>
                    <p className="text-muted-foreground">
                        Insights for <span className="font-semibold text-foreground">{site?.name}</span> ({site?.domain})
                    </p>
                </div>

                <div className="flex items-center gap-2 bg-muted/50 p-1 rounded-lg border">
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

            {/* Tabs */}
            <div className="flex items-center gap-4 border-b border-border">
                <button
                    onClick={() => setActiveTab('overview')}
                    className={cn(
                        "pb-3 text-sm font-medium border-b-2 transition-colors",
                        activeTab === 'overview'
                            ? "border-primary text-primary"
                            : "border-transparent text-muted-foreground hover:text-foreground"
                    )}
                >
                    Overview
                </button>
                <button
                    onClick={() => setActiveTab('behavioral')}
                    className={cn(
                        "pb-3 text-sm font-medium border-b-2 transition-colors flex items-center gap-2",
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
                        "pb-3 text-sm font-medium border-b-2 transition-colors flex items-center gap-2",
                        activeTab === 'visual'
                            ? "border-primary text-primary"
                            : "border-transparent text-muted-foreground hover:text-foreground"
                    )}
                >
                    <Eye size={16} />
                    Visual Analytics
                </button>
            </div>

            {activeTab === 'behavioral' && (
                <BehavioralAnalytics
                    pagePerformance={analytics?.pagePerformance}
                    userFlows={analytics?.userFlows}
                    behavioralPatterns={analytics?.behavioralPatterns}
                    topInteractions={analytics?.topInteractions}
                    customEvents={analytics?.customEvents}
                />
            )}

            {activeTab === 'visual' && (
                <VisualAnalytics siteId={siteId || ''} initialUrl={selectedVisualUrl} />
            )}

            {activeTab === 'overview' && (
                <div className="space-y-8">

                    {/* Overview Cards */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                        <OverviewCard
                            title="Total Sessions"
                            value={analytics?.overview.totalSessions.toLocaleString()}
                            icon={Users}
                            trend="+12%" // Placeholder trend
                            color="text-blue-500"
                        />
                        <OverviewCard
                            title="Page Views"
                            value={analytics?.overview.totalPageViews.toLocaleString()}
                            icon={MousePointer2}
                            trend="+5%"
                            color="text-purple-500"
                        />
                        <OverviewCard
                            title="Avg. Duration"
                            value={`${analytics?.overview.avgSessionDuration}s`}
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
                            <div className="h-[300px] w-full">
                                <ResponsiveContainer width="100%" height="100%">
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

                    {/* Geo Heatmap & Top Pages */}
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

                        {/* Map */}
                        <div className="rounded-xl border bg-card/50 backdrop-blur-sm p-0 overflow-hidden shadow-sm h-[400px] relative">
                            <div className="absolute top-4 left-4 z-[1000] bg-background/80 backdrop-blur p-2 rounded-lg border shadow-sm">
                                <h3 className="text-sm font-semibold flex items-center gap-2">
                                    <Globe className="w-4 h-4 text-primary" />
                                    Global Activity
                                </h3>
                            </div>
                            <MapContainer center={[20, 0]} zoom={2} style={{ height: '100%', width: '100%', background: '#0a0a0a' }}>
                                <TileLayer
                                    attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                                    url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
                                />
                                {analytics?.heatMapPoints.map((pt: any, i: number) => (
                                    <CircleMarker
                                        key={i}
                                        center={[pt.lat, pt.lng]}
                                        radius={Math.min(pt.weight * 2, 20)}
                                        pathOptions={{
                                            color: '#8b5cf6',
                                            fillColor: '#8b5cf6',
                                            fillOpacity: 0.6,
                                            weight: 0
                                        }}
                                    >
                                        <Popup>
                                            Visitors: {pt.weight}
                                        </Popup>
                                    </CircleMarker>
                                ))}
                            </MapContainer>
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
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {analytics?.topPages.map((page: any, i: number) => (
                                            <tr key={i} className="border-b border-border/10 hover:bg-muted/20 transition-colors">
                                                <td className="py-3 font-medium text-foreground/80 truncate max-w-[200px]">
                                                    <a href={page.url} target="_blank" rel="noreferrer" className="hover:underline hover:text-primary">
                                                        {page.url.replace(/https?:\/\/[^\/]+/, '') || '/'}
                                                    </a>
                                                    <button
                                                        onClick={() => {
                                                            setSelectedVisualUrl(page.url);
                                                            setActiveTab('visual');
                                                        }}
                                                        className="ml-2 inline-flex items-center text-xs text-muted-foreground hover:text-primary p-1 bg-muted/50 rounded"
                                                        title="View Visual Analytics"
                                                    >
                                                        <Eye size={12} className="mr-1" /> Visuals
                                                    </button>
                                                </td>
                                                <td className="py-3 text-right">{page.views}</td>
                                                <td className="py-3 text-right">{page.visitors}</td>
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
                </div>
            )}
        </div>
    );
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
    );
}
