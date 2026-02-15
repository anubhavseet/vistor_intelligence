import React, { useState } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { ArrowRight, AlertTriangle, Bug, MousePointerClick, Search, ChevronLeft, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';

interface PagePerformanceStat {
    url: string;
    avgScrollDepth: number;
    avgTimeOnPage: number;
    rageClicks: number;
}

interface UserFlowStat {
    source: string;
    target: string;
    count: number;
}

interface BehavioralPatternStat {
    pattern: string;
    count: number;
    sessionIds: string[];
}

interface BehavioralAnalyticsProps {
    pagePerformance?: PagePerformanceStat[];
    userFlows?: UserFlowStat[];
    behavioralPatterns?: BehavioralPatternStat[];
    topInteractions?: any[];
    customEvents?: any[];
}

const ITEMS_PER_PAGE = 10;

export const BehavioralAnalytics: React.FC<BehavioralAnalyticsProps> = ({
    pagePerformance = [],
    userFlows = [],
    behavioralPatterns = [],
    topInteractions = [],
    customEvents = [],
}) => {
    const [searchTerm, setSearchTerm] = useState('');
    const [currentPage, setCurrentPage] = useState(1);

    // Filter and Pagination Logic
    const filteredPages = pagePerformance.filter(p =>
        p.url.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const totalPages = Math.ceil(filteredPages.length / ITEMS_PER_PAGE);
    const paginatedPages = filteredPages.slice(
        (currentPage - 1) * ITEMS_PER_PAGE,
        currentPage * ITEMS_PER_PAGE
    );

    const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
        setSearchTerm(e.target.value);
        setCurrentPage(1); // Reset to first page on search
    };

    return (
        <div className="space-y-8 animate-in fade-in duration-500">

            {/* 1. Behavioral Patterns Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {behavioralPatterns.map((pattern) => (
                    <div key={pattern.pattern} className="bg-card/50 backdrop-blur-sm p-6 rounded-lg shadow-sm border border-border flex items-center justify-between">
                        <div>
                            <p className="text-sm font-medium text-muted-foreground">{pattern.pattern}</p>
                            <h3 className="text-2xl font-bold mt-1 text-foreground">{pattern.count}</h3>
                            <p className="text-xs text-muted-foreground/70 mt-2">{pattern.sessionIds.length} users affected recently</p>
                        </div>
                        <div className={cn("p-3 rounded-full",
                            pattern.pattern === 'Rage Clicks' ? 'bg-red-500/10 text-red-500' :
                                pattern.pattern === 'JS Errors' ? 'bg-orange-500/10 text-orange-500' :
                                    'bg-blue-500/10 text-blue-500'
                        )}>
                            {pattern.pattern === 'Rage Clicks' && <MousePointerClick size={24} />}
                            {pattern.pattern === 'JS Errors' && <Bug size={24} />}
                            {pattern.pattern !== 'Rage Clicks' && pattern.pattern !== 'JS Errors' && <AlertTriangle size={24} />}
                        </div>
                    </div>
                ))}
            </div>

            {/* 2. Page Performance Chart (Full Width) */}
            <div className="bg-card/50 backdrop-blur-sm p-6 rounded-lg shadow-sm border border-border">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
                    <h3 className="text-lg font-semibold text-foreground">Page Performance</h3>

                    {/* Search & Pagination Controls */}
                    <div className="flex items-center gap-4">
                        <div className="relative">
                            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                            <input
                                type="text"
                                placeholder="Search pages..."
                                className="pl-9 pr-4 py-2 h-9 text-sm rounded-md border border-input bg-background/50 focus:outline-none focus:ring-1 focus:ring-primary w-64"
                                value={searchTerm}
                                onChange={handleSearch}
                            />
                        </div>
                        <div className="flex items-center gap-2 text-sm">
                            <span className="text-muted-foreground">
                                {currentPage} / {totalPages || 1}
                            </span>
                            <div className="flex gap-1">
                                <button
                                    onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                                    disabled={currentPage === 1}
                                    className="p-2 rounded-md hover:bg-muted disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                                >
                                    <ChevronLeft size={16} />
                                </button>
                                <button
                                    onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                                    disabled={currentPage === totalPages || totalPages === 0}
                                    className="p-2 rounded-md hover:bg-muted disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                                >
                                    <ChevronRight size={16} />
                                </button>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="h-[400px] w-full min-w-0">
                    <ResponsiveContainer width="100%" height="100%">
                        <BarChart
                            data={paginatedPages}
                            layout="vertical"
                            margin={{ left: 20, right: 30, top: 20, bottom: 20 }}
                            barCategoryGap={10}
                        >
                            <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#333" opacity={0.2} />
                            <XAxis type="number" stroke="#888888" fontSize={12} tickLine={false} axisLine={false} />
                            <YAxis
                                dataKey="url"
                                type="category"
                                width={150}
                                tickFormatter={(url) => {
                                    const path = url.replace(/^https?:\/\/[^/]+/, '') || '/';
                                    return path.length > 25 ? path.substring(0, 25) + '...' : path;
                                }}
                                stroke="#888888"
                                fontSize={12}
                                tickLine={false}
                                axisLine={false}
                            />
                            <Tooltip
                                cursor={{ fill: 'rgba(255,255,255,0.05)' }}
                                contentStyle={{ backgroundColor: '#1f1f1f', borderRadius: '8px', border: '1px solid #333', color: '#fff' }}
                                itemStyle={{ fontSize: '12px' }}
                                labelFormatter={(url) => url}
                            />
                            <Legend wrapperStyle={{ paddingTop: '20px' }} />
                            <Bar dataKey="avgTimeOnPage" name="Avg Time (s)" fill="#8884d8" radius={[0, 4, 4, 0]} barSize={12} />
                            <Bar dataKey="avgScrollDepth" name="Scroll Depth (%)" fill="#82ca9d" radius={[0, 4, 4, 0]} barSize={12} />
                        </BarChart>
                    </ResponsiveContainer>
                </div>
            </div>

            {/* 3. Grid for Other Metrics */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">

                {/* User Flows */}
                <div className="bg-card/50 backdrop-blur-sm p-6 rounded-lg shadow-sm border border-border">
                    <h3 className="text-lg font-semibold mb-4 text-foreground">Top User Flows</h3>
                    <div className="space-y-4 max-h-[300px] overflow-y-auto pr-2 custom-scrollbar">
                        {userFlows.map((flow, index) => (
                            <div key={index} className="flex items-center justify-between p-3 bg-muted/30 rounded-lg group hover:bg-muted/50 transition-colors border border-transparent hover:border-border/50">
                                <div className="flex items-center gap-3 overflow-hidden">
                                    <div className="px-2 py-1 bg-background rounded border border-border text-xs font-mono text-muted-foreground truncate max-w-[80px]" title={flow.source}>
                                        {flow.source.replace(/^https?:\/\/[^/]+/, '') || '/'}
                                    </div>
                                    <ArrowRight size={16} className="text-muted-foreground/50 flex-shrink-0" />
                                    <div className="px-2 py-1 bg-background rounded border border-border text-xs font-mono text-muted-foreground truncate max-w-[80px]" title={flow.target}>
                                        {flow.target.replace(/^https?:\/\/[^/]+/, '') || '/'}
                                    </div>
                                </div>
                                <div className="flex items-center gap-2">
                                    <span className="font-bold text-foreground">{flow.count}</span>
                                </div>
                            </div>
                        ))}
                        {userFlows.length === 0 && (
                            <div className="flex flex-col items-center justify-center h-40 text-muted-foreground">
                                <p>No flow data available yet</p>
                            </div>
                        )}
                    </div>
                </div>

                {/* Top Interactions */}
                <div className="bg-card/50 backdrop-blur-sm p-6 rounded-lg shadow-sm border border-border">
                    <h3 className="text-lg font-semibold mb-4 text-foreground">Top Clicks</h3>
                    <div className="space-y-4 max-h-[300px] overflow-y-auto pr-2 custom-scrollbar">
                        {topInteractions.map((interaction, index) => (
                            <div key={index} className="flex items-center justify-between p-3 bg-muted/30 rounded-lg group hover:bg-muted/50 transition-colors border border-transparent hover:border-border/50">
                                <div>
                                    <div className="flex items-center gap-2">
                                        <span className="font-mono text-sm font-medium text-primary bg-primary/10 px-2 py-0.5 rounded truncate max-w-[150px]" title={interaction.selector}>
                                            {interaction.selector}
                                        </span>
                                    </div>
                                    <div className="text-xs text-muted-foreground mt-1 truncate max-w-[200px]" title={interaction.pageUrl}>
                                        {interaction.pageUrl.replace(/^https?:\/\/[^/]+/, '') || '/'}
                                    </div>
                                </div>
                                <div className="text-right">
                                    <div className="font-bold text-foreground">{interaction.count}</div>
                                </div>
                            </div>
                        ))}
                        {topInteractions.length === 0 && (
                            <div className="text-center text-muted-foreground py-8">No interaction data yet</div>
                        )}
                    </div>
                </div>

                {/* Custom Events */}
                <div className="bg-card/50 backdrop-blur-sm p-6 rounded-lg shadow-sm border border-border">
                    <h3 className="text-lg font-semibold mb-4 text-foreground">Custom Events</h3>
                    <div className="space-y-4 max-h-[300px] overflow-y-auto pr-2 custom-scrollbar">
                        {customEvents.map((evt, index) => (
                            <div key={index} className="flex items-center justify-between p-3 bg-muted/30 rounded-lg group hover:bg-muted/50 transition-colors border border-transparent hover:border-border/50">
                                <div>
                                    <h4 className="font-medium text-foreground">{evt.eventName}</h4>
                                    <div className="text-xs text-muted-foreground mt-1">
                                        Recent: {evt.recentSessions.length > 0 ? new Date(evt.recentSessions[0]).toLocaleDateString() : 'None'}
                                    </div>
                                </div>
                                <div className="text-right">
                                    <div className="font-bold text-green-500">{evt.count}</div>
                                </div>
                            </div>
                        ))}
                        {customEvents.length === 0 && (
                            <div className="text-center text-muted-foreground py-8">No events</div>
                        )}
                    </div>
                </div>

            </div>
        </div>
    );
};
