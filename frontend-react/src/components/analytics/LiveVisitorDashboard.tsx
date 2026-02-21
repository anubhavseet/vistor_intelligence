import React, { useEffect, useState } from 'react';
import { gql } from '@apollo/client';
import { useSubscription } from '@apollo/client/react';
import { Activity, Users, Eye, Zap, AlertTriangle, TrendingUp, X, Globe, MousePointer2, Clock, ExternalLink } from 'lucide-react';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from "@/components/ui/sheet";
import { VisitorProfile } from './VisitorProfile';

const LIVE_SESSION_SUBSCRIPTION = gql`
  subscription LiveSessionUpdate($siteId: String!) {
    liveSessionUpdate(siteId: $siteId) {
      sessionId
      siteId
      eventType
      intentScore
      lastActivity
      currentPage
      visitorId
    }
  }
`;

const ADMIN_ALERTS_SUBSCRIPTION = gql`
  subscription AdminAlerts($siteId: String!) {
    adminAlerts(siteId: $siteId) {
      type
      sessionId
      score
      timestamp
      message
      severity
    }
  }
`;

interface LiveSession {
    sessionId: string;
    siteId: string;
    eventType: string;
    intentScore: number;
    lastActivity: number;
    currentPage: string;
    visitorId?: string;
}

interface Alert {
    type: string;
    sessionId?: string;
    score?: number;
    timestamp: number;
    message?: string;
    severity?: string;
}

interface LiveVisitorDashboardProps {
    siteId: string;
}

export const LiveVisitorDashboard: React.FC<LiveVisitorDashboardProps> = ({ siteId }) => {
    const [liveSessions, setLiveSessions] = useState<Map<string, LiveSession>>(new Map());
    const [alerts, setAlerts] = useState<Alert[]>([]);
    const [selectedSession, setSelectedSession] = useState<LiveSession | null>(null);
    const [selectedVisitorId, setSelectedVisitorId] = useState<string | null>(null);
    const [isVisitorProfileOpen, setIsVisitorProfileOpen] = useState(false);

    // Track per-session event counts for eventsPerMinute calculation
    const [sessionEventTimes, setSessionEventTimes] = useState<Map<string, number[]>>(new Map());

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

                // Bug #10 fix: track per-session event timestamps to compute events/min
                setSessionEventTimes(prev => {
                    const next = new Map(prev);
                    const times = prev.get(update.sessionId) || [];
                    const now = Date.now();
                    // Keep only timestamps from the last 60 seconds
                    const recent = [...times.filter(t => now - t < 60000), now];
                    next.set(update.sessionId, recent);
                    return next;
                });
            }
        },
    });

    // Subscribe to admin alerts — Bug #14 fixed: now receives typed object, not JSON string
    useSubscription(ADMIN_ALERTS_SUBSCRIPTION, {
        variables: { siteId },
        onData: ({ data }: { data: any }) => {
            if (data?.data?.adminAlerts) {
                const alert = data.data.adminAlerts; // Already a typed object
                setAlerts((prev) => [alert, ...prev].slice(0, 10));
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

    // Update stats when sessions change — Bug #10 fix: compute eventsPerMinute from tracked timestamps
    useEffect(() => {
        const sessions = Array.from(liveSessions.values());
        const totalActive = sessions.length;
        const avgIntent = sessions.length > 0
            ? sessions.reduce((sum, s) => sum + s.intentScore, 0) / sessions.length
            : 0;
        const vipCount = sessions.filter(s => s.intentScore >= 70).length;

        // Sum total events across all sessions in the last 60 seconds
        const now = Date.now();
        let totalRecentEvents = 0;
        sessionEventTimes.forEach((times) => {
            totalRecentEvents += times.filter(t => now - t < 60000).length;
        });

        setStats({
            totalActive,
            avgIntent,
            vipCount,
            eventsPerMinute: totalRecentEvents, // Events fired in last 60s = events/min
        });
    }, [liveSessions, sessionEventTimes]);

    const getIntentCategory = (score: number) => {
        if (score >= 70) return { label: 'Lead', color: 'text-emerald-500 bg-emerald-500/10' };
        if (score >= 30) return { label: 'Researcher', color: 'text-amber-500 bg-amber-500/10' };
        return { label: 'Bouncer', color: 'text-gray-500 bg-gray-500/10' };
    };

    const getAlertIcon = (type: string) => {
        switch (type) {
            case 'vip_visitor':
                return <Zap className="w-4 h-4 text-yellow-500" />;
            case 'anomaly':
            case 'rage_click':
            case 'high_event_rate':
                return <AlertTriangle className="w-4 h-4 text-red-500" />;
            default:
                return <Activity className="w-4 h-4 text-blue-500" />;
        }
    };

    const getAlertSeverityColor = (severity?: string) => {
        switch (severity) {
            case 'critical': return 'border-red-500/30 bg-red-500/5';
            case 'warning': return 'border-amber-500/30 bg-amber-500/5';
            default: return 'border-border/50 bg-muted/20';
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

                {/* Bug #10 fixed: now shows real events/min count */}
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
                                                <MousePointer2 className="w-3 h-3 inline mr-1" />
                                                {session.currentPage || 'Unknown page'}
                                            </div>
                                        </div>

                                        <div className="flex flex-col items-end gap-2">
                                            <div className={cn('text-2xl font-bold', category.color.split(' ')[0])}>
                                                {session.intentScore}
                                            </div>
                                            {/* Bug #12 fixed: Watch Live button now opens session detail panel */}
                                            <button
                                                onClick={() => setSelectedSession(session)}
                                                className="text-xs text-primary hover:underline opacity-0 group-hover:opacity-100 transition-opacity"
                                            >
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
                            <p className="text-xs mt-1 opacity-60">VIP visitors & anomalies will appear here</p>
                        </div>
                    ) : (
                        <div className="space-y-3 max-h-[600px] overflow-y-auto pr-2 custom-scrollbar">
                            {alerts.map((alert, idx) => (
                                <div
                                    key={idx}
                                    className={cn(
                                        'flex items-start gap-3 p-3 rounded-lg border animate-in slide-in-from-right duration-300',
                                        getAlertSeverityColor(alert.severity)
                                    )}
                                    style={{ animationDelay: `${idx * 50}ms` }}
                                >
                                    {getAlertIcon(alert.type)}
                                    <div className="flex-1 min-w-0">
                                        <p className="text-sm font-medium">
                                            {alert.type === 'vip_visitor' && '⭐ VIP Visitor Detected'}
                                            {alert.type === 'anomaly' && '⚠️ Anomaly Detected'}
                                            {alert.type === 'rage_click' && '😤 Rage Click'}
                                            {alert.type === 'high_event_rate' && '🤖 High Event Rate'}
                                            {alert.message && !['vip_visitor', 'anomaly', 'rage_click', 'high_event_rate'].includes(alert.type) && alert.message}
                                        </p>
                                        {alert.message && (
                                            <p className="text-xs text-muted-foreground mt-0.5 truncate">{alert.message}</p>
                                        )}
                                        {alert.sessionId && (
                                            <p className="text-xs text-muted-foreground font-mono mt-1 truncate">
                                                {alert.sessionId.slice(0, 12)}...
                                            </p>
                                        )}
                                        {alert.score != null && (
                                            <p className="text-xs text-muted-foreground mt-1">
                                                Score: <span className="font-semibold text-foreground">{alert.score}</span>
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

            {/* Bug #12: Session Detail Panel — slides in when Watch Live is clicked */}
            <AnimatePresence>
                {selectedSession && (
                    <>
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 0.5 }}
                            exit={{ opacity: 0 }}
                            onClick={() => setSelectedSession(null)}
                            className="fixed inset-0 bg-black z-40"
                        />
                        <motion.div
                            initial={{ x: '100%' }}
                            animate={{ x: 0 }}
                            exit={{ x: '100%' }}
                            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
                            className="fixed top-0 right-0 h-full w-full md:w-[420px] bg-background border-l shadow-2xl z-50 overflow-y-auto"
                        >
                            <div className="h-full flex flex-col">
                                {/* Panel Header */}
                                <div className="p-6 border-b bg-muted/30 flex items-start justify-between">
                                    <div>
                                        <div className="flex items-center gap-2 mb-1">
                                            <h2 className="text-xl font-bold">Live Session</h2>
                                            <span className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-green-500/10 text-green-500 text-xs font-bold uppercase">
                                                <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
                                                Live
                                            </span>
                                        </div>
                                        <p className="font-mono text-xs text-muted-foreground">{selectedSession.sessionId}</p>
                                    </div>
                                    <button
                                        onClick={() => setSelectedSession(null)}
                                        className="p-2 hover:bg-muted rounded-full transition-colors"
                                    >
                                        <X className="w-5 h-5" />
                                    </button>
                                </div>

                                {/* Panel Content */}
                                <div className="flex-1 p-6 space-y-6">
                                    {/* Intent Score */}
                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="p-4 bg-card border rounded-xl text-center">
                                            <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Intent Score</p>
                                            <p className={cn('text-4xl font-bold', getIntentCategory(selectedSession.intentScore).color.split(' ')[0])}>
                                                {selectedSession.intentScore}
                                            </p>
                                        </div>
                                        <div className="p-4 bg-card border rounded-xl text-center">
                                            <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Category</p>
                                            <span className={cn('inline-block mt-1 px-3 py-1 rounded-full text-sm font-semibold', getIntentCategory(selectedSession.intentScore).color)}>
                                                {getIntentCategory(selectedSession.intentScore).label}
                                            </span>
                                        </div>
                                    </div>

                                    {/* Current Activity */}
                                    <div className="rounded-xl border bg-card/50 p-4 space-y-3">
                                        <h3 className="font-semibold text-sm uppercase tracking-wider text-muted-foreground">Current Activity</h3>
                                        <div className="flex items-start gap-3">
                                            <Globe className="w-4 h-4 text-muted-foreground mt-0.5 shrink-0" />
                                            <div className="min-w-0">
                                                <p className="text-xs text-muted-foreground mb-0.5">Current Page</p>
                                                <a
                                                    href={selectedSession.currentPage}
                                                    target="_blank"
                                                    rel="noreferrer"
                                                    className="text-sm font-medium break-all hover:text-primary flex items-center gap-1"
                                                >
                                                    {selectedSession.currentPage?.replace(/^https?:\/\/[^/]+/, '') || '/'}
                                                    <ExternalLink className="w-3 h-3 shrink-0 opacity-50" />
                                                </a>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-3">
                                            <Activity className="w-4 h-4 text-muted-foreground shrink-0" />
                                            <div>
                                                <p className="text-xs text-muted-foreground mb-0.5">Last Event</p>
                                                <p className="text-sm font-medium capitalize">{selectedSession.eventType}</p>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-3">
                                            <Clock className="w-4 h-4 text-muted-foreground shrink-0" />
                                            <div>
                                                <p className="text-xs text-muted-foreground mb-0.5">Last Active</p>
                                                <p className="text-sm font-medium">
                                                    {Math.floor((Date.now() - selectedSession.lastActivity) / 1000)}s ago
                                                </p>
                                            </div>
                                        </div>
                                    </div>

                                    <p className="text-xs text-center text-muted-foreground">
                                        Full session details available in the{' '}
                                        <span className="text-primary font-medium">Intent Stream</span> tab
                                    </p>
                                </div>
                            </div>
                        </motion.div>
                    </>
                )}
            </AnimatePresence>

            {/* Session Detail Sheet */}
            <Sheet open={!!selectedSession} onOpenChange={() => setSelectedSession(null)}>
                <SheetContent className="w-[400px] sm:w-[540px] overflow-y-auto">
                    {selectedSession && (
                        <div className="space-y-6">
                            <SheetHeader>
                                <SheetTitle className="flex items-center gap-2">
                                    <Activity className="w-5 h-5 text-primary" />
                                    Session Details
                                </SheetTitle>
                                <SheetDescription>
                                    ID: <span className="font-mono">{selectedSession.sessionId}</span>
                                </SheetDescription>
                            </SheetHeader>

                            <div className="space-y-4">
                                <div>
                                    <h4 className="text-sm font-medium text-muted-foreground mb-2">Actions</h4>
                                    <button
                                        onClick={() => {
                                            if (selectedSession.visitorId) {
                                                setSelectedVisitorId(selectedSession.visitorId);
                                                setIsVisitorProfileOpen(true);
                                            } else {
                                                console.warn('Visitor ID not available for this session');
                                            }
                                        }}
                                        disabled={!selectedSession.visitorId}
                                        className={cn(
                                            "flex items-center gap-2 px-3 py-1.5 text-xs font-medium rounded-md transition-colors",
                                            selectedSession.visitorId
                                                ? "bg-primary/10 text-primary hover:bg-primary/20"
                                                : "bg-muted text-muted-foreground opacity-50 cursor-not-allowed"
                                        )}
                                    >
                                        <Users className="w-3 h-3" />
                                        View Visitor History
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}
                </SheetContent>
            </Sheet>

            {/* Visitor Profile Modal */}
            {selectedVisitorId && (
                <VisitorProfile
                    siteId={siteId}
                    visitorId={selectedVisitorId}
                    isOpen={isVisitorProfileOpen}
                    onClose={() => setIsVisitorProfileOpen(false)}
                />
            )}
        </div>
    );
};
