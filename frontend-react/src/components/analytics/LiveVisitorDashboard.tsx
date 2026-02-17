import React, { useEffect, useState } from 'react';
import { gql } from '@apollo/client';
import { useSubscription } from '@apollo/client/react';
import { Activity, Users, Eye, Zap, AlertTriangle, TrendingUp } from 'lucide-react';
import { cn } from '@/lib/utils';

const LIVE_SESSION_SUBSCRIPTION = gql`
  subscription LiveSessionUpdate($siteId: String!) {
    liveSessionUpdate(siteId: $siteId) {
      sessionId
      siteId
      eventType
      intentScore
      lastActivity
      currentPage
    }
  }
`;

const ADMIN_ALERTS_SUBSCRIPTION = gql`
  subscription AdminAlerts($siteId: String!) {
    adminAlerts(siteId: $siteId)
  }
`;

interface LiveSession {
    sessionId: string;
    siteId: string;
    eventType: string;
    intentScore: number;
    lastActivity: number;
    currentPage: string;
}

interface Alert {
    type: string;
    sessionId?: string;
    score?: number;
    timestamp: number;
    message?: string;
}

interface LiveVisitorDashboardProps {
    siteId: string;
}

export const LiveVisitorDashboard: React.FC<LiveVisitorDashboardProps> = ({ siteId }) => {
    const [liveSessions, setLiveSessions] = useState<Map<string, LiveSession>>(new Map());
    const [alerts, setAlerts] = useState<Alert[]>([]);
    const [stats, setStats] = useState({
        totalActive: 0,
        avgIntent: 0,
        vipCount: 0,
        eventsPerMinute: 0,
    });

    // Subscribe to live session updates
    useSubscription(LIVE_SESSION_SUBSCRIPTION, {
        variables: { siteId },
        onData: ({ data }: { data: any }) => {
            if (data?.data?.liveSessionUpdate) {
                const update = data.data.liveSessionUpdate;
                setLiveSessions((prev) => {
                    const next = new Map(prev);
                    next.set(update.sessionId, update);
                    return next;
                });
            }
        },
    });

    // Subscribe to admin alerts
    useSubscription(ADMIN_ALERTS_SUBSCRIPTION, {
        variables: { siteId },
        onData: ({ data }: { data: any }) => {
            if (data?.data?.adminAlerts) {
                try {
                    const alert = JSON.parse(data.data.adminAlerts);
                    setAlerts((prev) => [alert, ...prev].slice(0, 10)); // Keep last 10 alerts
                } catch (e) {
                    console.error('Failed to parse alert:', e);
                }
            }
        },
    });

    // Cleanup inactive sessions (no activity in last 30 seconds)
    useEffect(() => {
        const interval = setInterval(() => {
            const now = Date.now();
            setLiveSessions((prev) => {
                const next = new Map(prev);
                for (const [sessionId, session] of next.entries()) {
                    if (now - session.lastActivity > 30000) {
                        next.delete(sessionId);
                    }
                }
                return next;
            });
        }, 5000);

        return () => clearInterval(interval);
    }, []);

    // Update stats when sessions change
    useEffect(() => {
        const sessions = Array.from(liveSessions.values());
        const totalActive = sessions.length;
        const avgIntent = sessions.length > 0
            ? sessions.reduce((sum, s) => sum + s.intentScore, 0) / sessions.length
            : 0;
        const vipCount = sessions.filter(s => s.intentScore >= 70).length;

        setStats({
            totalActive,
            avgIntent,
            vipCount,
            eventsPerMinute: 0, // TODO: Calculate from event timestamps
        });
    }, [liveSessions]);

    const getIntentCategory = (score: number) => {
        if (score >= 70) return { label: 'Lead', color: 'text-green-500 bg-green-500/10' };
        if (score >= 30) return { label: 'Researcher', color: 'text-yellow-500 bg-yellow-500/10' };
        return { label: 'Bouncer', color: 'text-gray-500 bg-gray-500/10' };
    };

    const getAlertIcon = (type: string) => {
        switch (type) {
            case 'vip_visitor':
                return <Zap className="w-4 h-4 text-yellow-500" />;
            case 'anomaly':
                return <AlertTriangle className="w-4 h-4 text-red-500" />;
            default:
                return <Activity className="w-4 h-4 text-blue-500" />;
        }
    };

    const sessionsArray = Array.from(liveSessions.values()).sort((a, b) => b.intentScore - a.intentScore);

    return (
        <div className="space-y-6 animate-in fade-in duration-500">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-2xl font-bold flex items-center gap-2">
                        <Eye className="w-6 h-6 text-primary" />
                        Live Visitor Dashboard
                    </h2>
                    <p className="text-sm text-muted-foreground mt-1">
                        Real-time visitor activity powered by GraphQL WebSockets
                    </p>
                </div>
                <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div>
                    <span className="text-sm text-muted-foreground">Live</span>
                </div>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="bg-card border rounded-lg p-4">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm text-muted-foreground">Active Visitors</p>
                            <p className="text-3xl font-bold mt-1">{stats.totalActive}</p>
                        </div>
                        <Users className="w-8 h-8 text-blue-500 opacity-80" />
                    </div>
                </div>

                <div className="bg-card border rounded-lg p-4">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm text-muted-foreground">Avg Intent Score</p>
                            <p className="text-3xl font-bold mt-1">{stats.avgIntent.toFixed(0)}</p>
                        </div>
                        <TrendingUp className="w-8 h-8 text-green-500 opacity-80" />
                    </div>
                </div>

                <div className="bg-card border rounded-lg p-4">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm text-muted-foreground">VIP Visitors</p>
                            <p className="text-3xl font-bold mt-1">{stats.vipCount}</p>
                        </div>
                        <Zap className="w-8 h-8 text-yellow-500 opacity-80" />
                    </div>
                </div>

                <div className="bg-card border rounded-lg p-4">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm text-muted-foreground">Events/min</p>
                            <p className="text-3xl font-bold mt-1">{stats.eventsPerMinute}</p>
                        </div>
                        <Activity className="w-8 h-8 text-purple-500 opacity-80" />
                    </div>
                </div>
            </div>

            {/* Two Column Layout */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Live Sessions List */}
                <div className="lg:col-span-2 bg-card border rounded-lg p-6">
                    <h3 className="text-lg font-semibold mb-4">Active Visitors</h3>

                    {sessionsArray.length === 0 ? (
                        <div className="text-center py-12 text-muted-foreground">
                            <Users className="w-12 h-12 mx-auto mb-3 opacity-50" />
                            <p>No active visitors at the moment</p>
                            <p className="text-sm mt-1">Waiting for real-time connections...</p>
                        </div>
                    ) : (
                        <div className="space-y-3 max-h-[600px] overflow-y-auto pr-2 custom-scrollbar">
                            {sessionsArray.map((session) => {
                                const category = getIntentCategory(session.intentScore);
                                const timeSinceActivity = Math.floor((Date.now() - session.lastActivity) / 1000);

                                return (
                                    <div
                                        key={session.sessionId}
                                        className="flex items-center justify-between p-4 bg-muted/30 rounded-lg hover:bg-muted/50 transition-all border border-transparent hover:border-border group"
                                    >
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center gap-2 mb-1">
                                                <span className="font-mono text-xs text-muted-foreground truncate max-w-[200px]">
                                                    {session.sessionId}
                                                </span>
                                                <span className={cn('px-2 py-0.5 rounded text-xs font-medium', category.color)}>
                                                    {category.label}
                                                </span>
                                            </div>

                                            <div className="flex items-center gap-2 text-sm">
                                                <Activity className="w-3 h-3 text-muted-foreground" />
                                                <span className="text-muted-foreground capitalize">{session.eventType}</span>
                                                <span className="text-muted-foreground">·</span>
                                                <span className="text-muted-foreground">{timeSinceActivity}s ago</span>
                                            </div>

                                            <div className="text-xs text-muted-foreground mt-1 truncate">
                                                {session.currentPage || 'Unknown page'}
                                            </div>
                                        </div>

                                        <div className="flex flex-col items-end gap-2">
                                            <div className="text-2xl font-bold">{session.intentScore}</div>
                                            <button className="text-xs text-primary hover:underline opacity-0 group-hover:opacity-100 transition-opacity">
                                                Watch Live →
                                            </button>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>

                {/* Alerts Panel */}
                <div className="bg-card border rounded-lg p-6">
                    <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                        <AlertTriangle className="w-5 h-5 text-yellow-500" />
                        Live Alerts
                    </h3>

                    {alerts.length === 0 ? (
                        <div className="text-center py-8 text-muted-foreground">
                            <p className="text-sm">No alerts yet</p>
                        </div>
                    ) : (
                        <div className="space-y-3 max-h-[600px] overflow-y-auto pr-2 custom-scrollbar">
                            {alerts.map((alert, idx) => (
                                <div
                                    key={idx}
                                    className="flex items-start gap-3 p-3 bg-muted/20 rounded-lg border border-border/50 animate-in slide-in-from-right duration-300"
                                    style={{ animationDelay: `${idx * 50}ms` }}
                                >
                                    {getAlertIcon(alert.type)}
                                    <div className="flex-1 min-w-0">
                                        <p className="text-sm font-medium">
                                            {alert.type === 'vip_visitor' && 'VIP Visitor Detected'}
                                            {alert.type === 'anomaly' && 'Anomaly Detected'}
                                            {alert.message}
                                        </p>
                                        {alert.sessionId && (
                                            <p className="text-xs text-muted-foreground font-mono mt-1 truncate">
                                                {alert.sessionId}
                                            </p>
                                        )}
                                        {alert.score && (
                                            <p className="text-xs text-muted-foreground mt-1">
                                                Intent Score: {alert.score}
                                            </p>
                                        )}
                                        <p className="text-xs text-muted-foreground mt-1">
                                            {new Date(alert.timestamp).toLocaleTimeString()}
                                        </p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};
