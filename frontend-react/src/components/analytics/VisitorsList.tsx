import React, { useState } from 'react';
import { useQuery } from '@apollo/client/react';
import { GET_VISITORS } from '@/lib/graphql/visitor-queries';
import { VisitorProfile } from './VisitorProfile';
import { Users, Clock, MousePointer2, Globe, Monitor, Smartphone, ChevronLeft, ChevronRight, Zap, ArrowUpRight, ArrowDownRight } from 'lucide-react';
import { cn } from '@/lib/utils';

// Helper to format time
const formatDuration = (seconds: number) => {
    if (seconds < 60) return `${Math.round(seconds)}s`;
    const mins = Math.floor(seconds / 60);
    const secs = Math.round(seconds % 60);
    return `${mins}m ${secs}s`;
};

// Helper to format date
const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString(undefined, {
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });
};

interface VisitorsListProps {
    siteId: string;
}

export const VisitorsList: React.FC<VisitorsListProps> = ({ siteId }) => {
    const [page, setPage] = useState(0);
    const limit = 15;
    const [sortBy, setSortBy] = useState('lastSeenAt');
    const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
    const [selectedVisitorId, setSelectedVisitorId] = useState<string | null>(null);

    const { data, loading, error } = useQuery<any>(GET_VISITORS, {
        variables: {
            siteId,
            limit,
            offset: page * limit,
            sortBy,
            sortOrder,
        },
        fetchPolicy: 'cache-and-network'
    });

    const handleSort = (field: string) => {
        if (sortBy === field) {
            setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
        } else {
            setSortBy(field);
            setSortOrder('desc');
        }
        setPage(0);
    };

    if (error) {
        return (
            <div className="p-8 text-center bg-red-500/10 text-red-500 rounded-xl border border-red-500/20">
                Failed to load visitors: {error.message}
            </div>
        );
    }

    const visitorsData = data?.getVisitors;
    const visitors = visitorsData?.visitors || [];
    const total = visitorsData?.total || 0;
    const totalPages = Math.ceil(total / limit);

    return (
        <div className="space-y-4">
            <div className="rounded-xl border bg-card/50 backdrop-blur-sm shadow-sm overflow-hidden flex flex-col">
                <div className="flex items-center justify-between p-4 border-b">
                    <h3 className="text-lg font-semibold flex items-center gap-2">
                        <Users className="w-5 h-5 text-primary" />
                        Persistent Visitors
                        <span className="text-sm font-normal text-muted-foreground ml-2">({total} total)</span>
                    </h3>
                </div>

                <div className="overflow-x-auto relative min-h-[400px]">
                    {loading && visitors.length === 0 && (
                        <div className="absolute inset-0 flex items-center justify-center bg-background/50 z-10 backdrop-blur-[1px]">
                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                        </div>
                    )}

                    <table className="w-full text-sm">
                        <thead>
                            <tr className="border-b border-border/50 text-left bg-muted/20">
                                <th className="p-4 font-medium text-muted-foreground cursor-pointer hover:text-foreground transition-colors" onClick={() => handleSort('lastSeenAt')}>
                                    <div className="flex items-center gap-1">
                                        Last Seen
                                        {sortBy === 'lastSeenAt' && (sortOrder === 'desc' ? <ArrowDownRight size={14} /> : <ArrowUpRight size={14} />)}
                                    </div>
                                </th>
                                <th className="p-4 font-medium text-muted-foreground">Visitor Identity</th>
                                <th className="p-4 font-medium text-muted-foreground cursor-pointer hover:text-foreground transition-colors" onClick={() => handleSort('avgIntentScore')}>
                                    <div className="flex items-center gap-1">
                                        Avg Intent
                                        {sortBy === 'avgIntentScore' && (sortOrder === 'desc' ? <ArrowDownRight size={14} /> : <ArrowUpRight size={14} />)}
                                    </div>
                                </th>
                                <th className="p-4 font-medium text-muted-foreground cursor-pointer hover:text-foreground transition-colors text-right" onClick={() => handleSort('totalSessions')}>
                                    <div className="flex items-center justify-end gap-1">
                                        Sessions
                                        {sortBy === 'totalSessions' && (sortOrder === 'desc' ? <ArrowDownRight size={14} /> : <ArrowUpRight size={14} />)}
                                    </div>
                                </th>
                                <th className="p-4 font-medium text-muted-foreground text-right cursor-pointer hover:text-foreground transition-colors" onClick={() => handleSort('totalPageViews')}>
                                    <div className="flex items-center justify-end gap-1">
                                        Views
                                        {sortBy === 'totalPageViews' && (sortOrder === 'desc' ? <ArrowDownRight size={14} /> : <ArrowUpRight size={14} />)}
                                    </div>
                                </th>
                                <th className="p-4 font-medium text-muted-foreground text-right cursor-pointer hover:text-foreground transition-colors" onClick={() => handleSort('totalTimeSpent')}>
                                    <div className="flex items-center justify-end gap-1">
                                        Time
                                        {sortBy === 'totalTimeSpent' && (sortOrder === 'desc' ? <ArrowDownRight size={14} /> : <ArrowUpRight size={14} />)}
                                    </div>
                                </th>
                                <th className="p-4 font-medium text-muted-foreground">Location & Device</th>
                                <th className="p-4 text-right"></th>
                            </tr>
                        </thead>
                        <tbody className={cn(loading && "opacity-50 pointer-events-none transition-opacity duration-300")}>
                            {visitors.map((v: any) => (
                                <tr key={v.visitorId} className="border-b border-border/10 hover:bg-muted/30 transition-colors group">
                                    <td className="p-4 text-muted-foreground">
                                        <div className="flex flex-col">
                                            <span className="text-foreground">{formatDate(v.lastSeenAt)}</span>
                                            <span className="text-xs">First: {formatDate(v.firstSeenAt)}</span>
                                        </div>
                                    </td>
                                    <td className="p-4">
                                        <div className="flex items-center gap-3">
                                            <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-xs">
                                                {v.visitorId.substring(0, 2).toUpperCase()}
                                            </div>
                                            <div className="flex flex-col">
                                                <span className="font-mono text-xs text-foreground/80">{v.visitorId}</span>
                                                {v.tags?.length > 0 && (
                                                    <div className="flex gap-1 mt-1">
                                                        {v.tags.map((tag: string) => (
                                                            <span key={tag} className="text-[10px] px-1.5 py-0.5 rounded-full bg-blue-500/10 text-blue-500 font-medium">
                                                                {tag}
                                                            </span>
                                                        ))}
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    </td>
                                    <td className="p-4">
                                        <div className="flex items-center gap-2">
                                            <Zap className={cn("w-4 h-4", v.avgIntentScore > 70 ? "text-amber-500" : "text-muted-foreground")} />
                                            <span className={cn("font-medium", v.avgIntentScore > 70 ? "text-amber-500" : "text-foreground")}>
                                                {v.avgIntentScore.toFixed(0)}
                                            </span>
                                        </div>
                                    </td>
                                    <td className="p-4 text-right font-medium">
                                        {v.totalSessions}
                                    </td>
                                    <td className="p-4 text-right">
                                        <div className="flex items-center justify-end gap-1 text-muted-foreground">
                                            <MousePointer2 className="w-3 h-3" />
                                            {v.totalPageViews}
                                        </div>
                                    </td>
                                    <td className="p-4 text-right text-muted-foreground">
                                        <div className="flex items-center justify-end gap-1">
                                            <Clock className="w-3 h-3" />
                                            {formatDuration(v.totalTimeSpent)}
                                        </div>
                                    </td>
                                    <td className="p-4">
                                        <div className="flex flex-col text-xs text-muted-foreground gap-1">
                                            {v.geo?.country && (
                                                <div className="flex items-center gap-1">
                                                    <Globe className="w-3 h-3" />
                                                    {v.geo.city ? `${v.geo.city}, ` : ''}{v.geo.country}
                                                </div>
                                            )}
                                            {v.deviceStats?.lastDevice && (
                                                <div className="flex items-center gap-1">
                                                    {v.deviceStats.lastDevice.toLowerCase() === 'mobile' ? <Smartphone className="w-3 h-3" /> : <Monitor className="w-3 h-3" />}
                                                    <span className="capitalize">{v.deviceStats.lastDevice}</span>
                                                </div>
                                            )}
                                        </div>
                                    </td>
                                    <td className="p-4 text-right">
                                        <button
                                            onClick={() => setSelectedVisitorId(v.visitorId)}
                                            className="px-3 py-1.5 text-xs font-medium bg-primary/10 text-primary hover:bg-primary hover:text-primary-foreground rounded-md transition-all opacity-0 group-hover:opacity-100 focus:opacity-100 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-1 focus:ring-offset-background"
                                        >
                                            View Profile
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>

                    {!loading && visitors.length === 0 && (
                        <div className="flex flex-col items-center justify-center p-12 text-muted-foreground">
                            <Users className="w-12 h-12 mb-4 opacity-20" />
                            <p>No visitors found</p>
                        </div>
                    )}
                </div>

                {/* Pagination */}
                {totalPages > 1 && (
                    <div className="flex items-center justify-between p-4 border-t bg-muted/10">
                        <div className="text-sm text-muted-foreground">
                            Showing page {page + 1} of {totalPages}
                        </div>
                        <div className="flex items-center gap-2">
                            <button
                                onClick={() => setPage(Math.max(0, page - 1))}
                                disabled={page === 0 || loading}
                                className="p-1 rounded-md hover:bg-muted disabled:opacity-50 transition-colors"
                            >
                                <ChevronLeft className="w-5 h-5" />
                            </button>
                            <button
                                onClick={() => setPage(Math.min(totalPages - 1, page + 1))}
                                disabled={page >= totalPages - 1 || loading}
                                className="p-1 rounded-md hover:bg-muted disabled:opacity-50 transition-colors"
                            >
                                <ChevronRight className="w-5 h-5" />
                            </button>
                        </div>
                    </div>
                )}
            </div>

            {selectedVisitorId && (
                <VisitorProfile
                    siteId={siteId}
                    visitorId={selectedVisitorId}
                    isOpen={!!selectedVisitorId}
                    onClose={() => setSelectedVisitorId(null)}
                />
            )}
        </div>
    );
};
