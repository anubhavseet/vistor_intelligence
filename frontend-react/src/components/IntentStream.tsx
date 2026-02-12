import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
    Activity,

    Eye,
    MousePointer2,
    X,
    Clock,
    Globe,
    Smartphone,
    Monitor,
    Shield,
    Link as LinkIcon
} from "lucide-react";
import { gql } from "@apollo/client";
import { useQuery } from "@apollo/client/react";
import { cn } from "@/lib/utils";

const GET_LIVE_SESSIONS = gql`
  query GetLiveSessions($siteId: String!) {
    getLiveSessions(siteId: $siteId) {
      sessionId
      intentScore
      intentCategory
      pagesVisited
      lastActivityAt
      isActive
      startedAt
      totalTimeSpent
      totalPageViews
      referrer
      userAgent
      organizationName
      geo {
        country
        city
        region
      }
      flags {
        isMobile
        isVPN
      }
    }
  }
`;

export default function IntentStream({ siteId }: { siteId: string }) {
    const [selectedSession, setSelectedSession] = useState<any>(null);
    const { data, loading } = useQuery(GET_LIVE_SESSIONS, {
        variables: { siteId },
        pollInterval: 3000,
        fetchPolicy: "network-only"
    });

    const sessions = (data as any)?.getLiveSessions || [];

    return (
        <div className="relative min-h-[600px]">
            {/* Main Stream View */}
            <div className="space-y-6">
                <div className="flex items-center justify-between p-4 rounded-xl bg-card border shadow-sm">
                    <div>
                        <h2 className="text-xl font-bold flex items-center gap-2">
                            <Activity className="w-5 h-5 text-primary" />
                            Live Intent Stream
                        </h2>
                        <p className="text-muted-foreground text-sm">
                            Real-time visitor processing
                        </p>
                    </div>
                    <div className="flex items-center gap-2 px-3 py-1 bg-primary/10 rounded-full text-primary text-sm font-medium">
                        <span className="relative flex h-2 w-2">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
                            <span className="relative inline-flex rounded-full h-2 w-2 bg-primary"></span>
                        </span>
                        {sessions.length} Active
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    <AnimatePresence mode="popLayout">
                        {sessions.map((session: any) => (
                            <SessionCard
                                key={session.sessionId}
                                session={session}
                                onClick={() => setSelectedSession(session)}
                            />
                        ))}
                    </AnimatePresence>
                </div>

                {sessions.length === 0 && !loading && (
                    <div className="flex flex-col items-center justify-center py-20 text-muted-foreground border-2 border-dashed rounded-xl">
                        <Eye className="w-12 h-12 mb-4 opacity-20" />
                        <p className="text-lg">Waiting for visitor traffic...</p>
                    </div>
                )}
            </div>

            {/* Detail View Overlay */}
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
                            initial={{ x: "100%" }}
                            animate={{ x: 0 }}
                            exit={{ x: "100%" }}
                            transition={{ type: "spring", damping: 25, stiffness: 200 }}
                            className="fixed top-0 right-0 h-full w-full md:w-[500px] bg-background border-l shadow-2xl z-50 overflow-y-auto"
                        >
                            <SessionDetailPanel
                                session={selectedSession}
                                onClose={() => setSelectedSession(null)}
                            />
                        </motion.div>
                    </>
                )}
            </AnimatePresence>
        </div>
    );
}

function SessionCard({ session, onClick }: { session: any, onClick: () => void }) {
    const getScoreColor = (score: number) => {
        if (score > 70) return "text-emerald-500";
        if (score > 40) return "text-amber-500";
        return "text-muted-foreground";
    };

    const getScoreBg = (score: number) => {
        if (score > 70) return "bg-emerald-500/10 border-emerald-500/20";
        if (score > 40) return "bg-amber-500/10 border-amber-500/20";
        return "bg-muted border-border";
    };

    return (
        <motion.div
            layoutId={session.sessionId}
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            onClick={onClick}
            className={cn(
                "group relative bg-card hover:bg-accent/50 border rounded-xl p-4 transition-all cursor-pointer shadow-sm hover:shadow-md",
                getScoreBg(session.intentScore)
            )}
        >
            <div className="flex justify-between items-start mb-3">
                <div className="flex items-center gap-2">
                    <div className={cn("text-2xl font-bold", getScoreColor(session.intentScore))}>
                        {session.intentScore}
                    </div>
                    <div className="flex flex-col">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Score</span>
                        <div className={cn("text-xs font-medium px-1.5 py-0.5 rounded-full w-fit",
                            session.intentCategory === 'Lead' ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400" :
                                session.intentCategory === 'Researcher' ? "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400" :
                                    "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-400"
                        )}>
                            {session.intentCategory}
                        </div>
                    </div>
                </div>
                {session.isActive && (
                    <div className="flex items-center gap-1.5 text-[10px] font-bold text-primary uppercase tracking-wider">
                        <div className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
                        Live
                    </div>
                )}
            </div>

            <div className="space-y-2 text-sm">
                <div className="flex items-center gap-2 text-muted-foreground">
                    <Globe className="w-3.5 h-3.5" />
                    <span className="truncate">
                        {session.geo?.city ? `${session.geo.city}, ${session.geo.country}` : (session.geo?.country || "Unknown Location")}
                    </span>
                </div>

                <div className="flex items-center gap-2 text-muted-foreground">
                    <MousePointer2 className="w-3.5 h-3.5" />
                    <span className="truncate max-w-[200px]" title={session.pagesVisited[session.pagesVisited.length - 1]}>
                        {session.pagesVisited[session.pagesVisited.length - 1] || "Land"}
                    </span>
                </div>
            </div>

            <div className="mt-4 pt-3 border-t flex items-center justify-between text-xs text-muted-foreground">
                <span className="font-mono">{session.sessionId.slice(0, 8)}</span>
                <span className="flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    {new Date(session.lastActivityAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </span>
            </div>
        </motion.div>
    );
}

function SessionDetailPanel({ session, onClose }: { session: any, onClose: () => void }) {
    return (
        <div className="h-full flex flex-col bg-background text-foreground">
            {/* Header */}
            <div className="p-6 border-b flex items-start justify-between bg-muted/30">
                <div>
                    <div className="flex items-center gap-2 mb-2">
                        <h2 className="text-2xl font-bold tracking-tight">Session Details</h2>
                        {session.isActive && (
                            <span className="px-2 py-0.5 rounded-full bg-primary/10 text-primary text-xs font-bold uppercase">Live</span>
                        )}
                    </div>
                    <div className="font-mono text-sm text-muted-foreground bg-muted w-fit px-2 py-1 rounded">
                        ID: {session.sessionId}
                    </div>
                </div>
                <button onClick={onClose} className="p-2 hover:bg-muted rounded-full transition-colors">
                    <X className="w-5 h-5" />
                </button>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto p-6 space-y-8">
                {/* Score Section */}
                <div className="grid grid-cols-2 gap-4">
                    <div className="p-4 bg-card border rounded-xl text-center">
                        <div className="text-sm text-muted-foreground mb-1 uppercase tracking-wider font-semibold">Intent Score</div>
                        <div className="text-4xl font-bold text-primary">{session.intentScore}</div>
                        <div className="text-xs text-muted-foreground mt-1">Based on signals</div>
                    </div>
                    <div className="p-4 bg-card border rounded-xl text-center">
                        <div className="text-sm text-muted-foreground mb-1 uppercase tracking-wider font-semibold">Classification</div>
                        <div className="text-xl font-bold mt-1">{session.intentCategory}</div>
                    </div>
                </div>

                {/* Info List */}
                <div className="space-y-4">
                    <h3 className="text-lg font-semibold flex items-center gap-2">
                        <Activity className="w-4 h-4" />
                        Activity
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                        <div className="flex flex-col p-3 bg-muted/30 rounded-lg">
                            <span className="text-muted-foreground text-xs mb-1">Started At</span>
                            <span className="font-medium">{new Date(session.startedAt).toLocaleString()}</span>
                        </div>
                        <div className="flex flex-col p-3 bg-muted/30 rounded-lg">
                            <span className="text-muted-foreground text-xs mb-1">Duration</span>
                            <span className="font-medium">{Math.floor(session.totalTimeSpent / 60)}m {session.totalTimeSpent % 60}s</span>
                        </div>
                        <div className="flex flex-col p-3 bg-muted/30 rounded-lg">
                            <span className="text-muted-foreground text-xs mb-1">Page Views</span>
                            <span className="font-medium">{session.totalPageViews}</span>
                        </div>
                        <div className="flex flex-col p-3 bg-muted/30 rounded-lg">
                            <span className="text-muted-foreground text-xs mb-1">Last Active</span>
                            <span className="font-medium">{new Date(session.lastActivityAt).toLocaleTimeString()}</span>
                        </div>
                    </div>
                </div>

                <div className="space-y-4">
                    <h3 className="text-lg font-semibold flex items-center gap-2">
                        <Shield className="w-4 h-4" />
                        Identity & Tech
                    </h3>
                    <div className="space-y-3 text-sm">
                        <div className="flex justify-between items-center py-2 border-b">
                            <span className="text-muted-foreground flex items-center gap-2">
                                <Globe className="w-4 h-4" /> Location
                            </span>
                            <span className="font-medium">
                                {session.geo?.city ? `${session.geo.city}, ${session.geo.country}` : session.geo?.country || "Unknown"}
                            </span>
                        </div>
                        <div className="flex justify-between items-center py-2 border-b">
                            <span className="text-muted-foreground flex items-center gap-2">
                                {session.flags?.isMobile ? <Smartphone className="w-4 h-4" /> : <Monitor className="w-4 h-4" />}
                                Device Type
                            </span>
                            <span className="font-medium">
                                {session.flags?.isMobile ? "Mobile" : "Desktop"}
                            </span>
                        </div>
                        <div className="flex justify-between items-center py-2 border-b">
                            <span className="text-muted-foreground flex items-center gap-2">
                                <LinkIcon className="w-4 h-4" /> Referrer
                            </span>
                            <span className="font-medium truncate max-w-[200px]" title={session.referrer}>
                                {session.referrer || "Direct / None"}
                            </span>
                        </div>
                        <div className="flex justify-between items-center py-2 border-b">
                            <span className="text-muted-foreground">Organization</span>
                            <span className="font-medium">{session.organizationName || "Unknown"}</span>
                        </div>
                    </div>
                </div>

                {/* Journey Timeline */}
                <div className="space-y-4">
                    <h3 className="text-lg font-semibold flex items-center gap-2">
                        <MousePointer2 className="w-4 h-4" />
                        Page Journey
                    </h3>
                    <div className="relative border-l-2 border-muted ml-2 space-y-6 pl-6 pb-2">
                        {session.pagesVisited.map((page: string, i: number) => (
                            <div key={i} className="relative">
                                <div className="absolute -left-[31px] top-1 h-3 w-3 rounded-full bg-primary ring-4 ring-background" />
                                <div className="text-sm font-medium break-all">{page}</div>
                                <div className="text-xs text-muted-foreground mt-0.5">Step {i + 1}</div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
}

