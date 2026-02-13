import React from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { ArrowRight, AlertTriangle, Bug, MousePointerClick } from 'lucide-react';
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
}

export const BehavioralAnalytics: React.FC<BehavioralAnalyticsProps> = ({
    pagePerformance = [],
    userFlows = [],
    behavioralPatterns = [],
}) => {
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

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* 2. Page Performance Chart */}
                <div className="bg-card/50 backdrop-blur-sm p-6 rounded-lg shadow-sm border border-border">
                    <h3 className="text-lg font-semibold mb-4 text-foreground">Page Performance</h3>
                    <div className="h-[300px] w-full min-w-0">
                        <ResponsiveContainer width="100%" height="100%" minWidth={0}>
                            <BarChart data={pagePerformance}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#333" opacity={0.2} />
                                <XAxis
                                    dataKey="url"
                                    tickFormatter={(url) => url.split('/').pop() || '/'}
                                    stroke="#888888"
                                    fontSize={12}
                                    tickLine={false}
                                    axisLine={false}
                                />
                                <YAxis
                                    yAxisId="left"
                                    orientation="left"
                                    stroke="#888888"
                                    fontSize={12}
                                    tickLine={false}
                                    axisLine={false}
                                />
                                <YAxis
                                    yAxisId="right"
                                    orientation="right"
                                    stroke="#888888"
                                    fontSize={12}
                                    tickLine={false}
                                    axisLine={false}
                                />
                                <Tooltip
                                    contentStyle={{ backgroundColor: '#1f1f1f', borderRadius: '8px', border: '1px solid #333', color: '#fff' }}
                                    itemStyle={{ fontSize: '12px' }}
                                    cursor={{ fill: 'rgba(255,255,255,0.05)' }}
                                />
                                <Legend wrapperStyle={{ paddingTop: '10px' }} />
                                <Bar yAxisId="left" dataKey="avgTimeOnPage" name="Avg Time (s)" fill="#8884d8" radius={[4, 4, 0, 0]} />
                                <Bar yAxisId="right" dataKey="avgScrollDepth" name="Scroll Depth" fill="#82ca9d" radius={[4, 4, 0, 0]} />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* 3. Common User Flows */}
                <div className="bg-card/50 backdrop-blur-sm p-6 rounded-lg shadow-sm border border-border">
                    <h3 className="text-lg font-semibold mb-4 text-foreground">Top User Flows</h3>
                    <div className="space-y-4 max-h-[300px] overflow-y-auto pr-2 custom-scrollbar">
                        {userFlows.map((flow, index) => (
                            <div key={index} className="flex items-center justify-between p-3 bg-muted/30 rounded-lg group hover:bg-muted/50 transition-colors border border-transparent hover:border-border/50">
                                <div className="flex items-center gap-3 overflow-hidden">
                                    <div className="px-2 py-1 bg-background rounded border border-border text-xs font-mono text-muted-foreground truncate max-w-[120px]" title={flow.source}>
                                        {flow.source.replace(/^https?:\/\/[^/]+/, '') || '/'}
                                    </div>
                                    <ArrowRight size={16} className="text-muted-foreground/50 flex-shrink-0" />
                                    <div className="px-2 py-1 bg-background rounded border border-border text-xs font-mono text-muted-foreground truncate max-w-[120px]" title={flow.target}>
                                        {flow.target.replace(/^https?:\/\/[^/]+/, '') || '/'}
                                    </div>
                                </div>
                                <div className="flex items-center gap-2">
                                    <span className="font-bold text-foreground">{flow.count}</span>
                                    <span className="text-xs text-muted-foreground">transitions</span>
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
            </div>
        </div>
    );
};
