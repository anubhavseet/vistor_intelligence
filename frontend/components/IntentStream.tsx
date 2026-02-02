"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Activity, Zap, Eye, MousePointer2 } from "lucide-react";

interface VisitorSession {
    sessionId: string;
    intentScore: number;
    intentCategory: "Bouncer" | "Researcher" | "Lead";
    pagesVisited: string[];
    lastActivityAt: string;
    suggestedAction?: string;
    userAgent?: string;
    ui_payload?: any;
}

export default function IntentStream({ siteId }: { siteId: string }) {
    const [sessions, setSessions] = useState<VisitorSession[]>([]);
    const [loading, setLoading] = useState(true);

    const fetchSessions = async () => {
        try {
            // In production, use env var for API URL
            const res = await fetch(`http://localhost:4040/api/v1/track/live/${siteId}`);
            if (!res.ok) throw new Error("Failed to fetch");
            const data = await res.json();
            setSessions(data);
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchSessions();
        const interval = setInterval(fetchSessions, 3000); // Poll every 3s
        return () => clearInterval(interval);
    }, [siteId]);

    return (
        <div className="bg-slate-950 text-white p-6 rounded-2xl font-sans min-h-[600px]">
            <div className="mb-8 flex justify-between items-center bg-slate-900/50 p-4 rounded-xl border border-slate-800">
                <div>
                    <h2 className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-emerald-400 flex items-center gap-2">
                        <Activity className="w-6 h-6 text-blue-400" />
                        Live Intent Stream
                    </h2>
                    <p className="text-slate-400 text-sm mt-1">
                        Analyzing behavioral signals for <span className="text-emerald-300 font-mono">{siteId}</span>
                    </p>
                </div>
                <div className="flex gap-4">
                    <div className="bg-slate-900 px-4 py-2 rounded-lg border border-slate-800 flex flex-col items-center">
                        <span className="text-[10px] text-slate-500 uppercase tracking-wider">Active</span>
                        <span className="text-xl font-bold text-white">{sessions.length}</span>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                <AnimatePresence>
                    {sessions.map((session) => (
                        <SessionCard key={session.sessionId} session={session} />
                    ))}
                </AnimatePresence>
            </div>

            {sessions.length === 0 && !loading && (
                <div className="flex flex-col items-center justify-center py-20 text-slate-600">
                    <Eye className="w-12 h-12 mb-4 opacity-20" />
                    <p className="text-lg">Waiting for visitor traffic...</p>
                </div>
            )}
        </div>
    );
}

function SessionCard({ session }: { session: VisitorSession }) {
    const getScoreColor = (score: number) => {
        if (score > 70) return "text-emerald-400";
        if (score > 40) return "text-amber-400";
        return "text-slate-400";
    };

    const getBorderColor = (category: string) => {
        if (category === "Lead") return "border-emerald-500/50 shadow-[0_0_15px_rgba(16,185,129,0.2)]";
        if (category === "Researcher") return "border-blue-500/30";
        return "border-slate-800";
    };

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95 }}
            layout
            className={`relative bg-slate-900/80 backdrop-blur-xl border ${getBorderColor(session.intentCategory)} rounded-xl p-5 transition-all duration-300 hover:bg-slate-800/80 group`}
        >
            <div className="flex justify-between items-start mb-3">
                <div>
                    <div className="text-[10px] text-slate-500 font-mono mb-1 uppercase tracking-wider flex items-center gap-1">
                        <MousePointer2 className="w-3 h-3" />
                        {session.sessionId.slice(0, 8)}
                    </div>
                    <div className="flex items-baseline gap-2">
                        <h3 className={`text-2xl font-bold ${getScoreColor(session.intentScore)}`}>
                            {session.intentScore}
                        </h3>
                        <span className="text-xs font-normal text-slate-600">INTENT</span>
                    </div>
                </div>
                <div className="text-right">
                    <div className={`inline-block px-2 py-1 rounded text-[10px] font-bold uppercase tracking-wide ${session.intentCategory === 'Lead' ? 'bg-emerald-900/50 text-emerald-400' :
                            session.intentCategory === 'Researcher' ? 'bg-blue-900/50 text-blue-400' :
                                'bg-slate-800 text-slate-400'
                        }`}>
                        {session.intentCategory}
                    </div>
                </div>
            </div>

            <div className="space-y-3 mb-2">
                <div className="bg-black/20 rounded p-2">
                    <p className="text-[10px] text-slate-500 uppercase mb-1">Active Page</p>
                    <p className="text-sm text-blue-300 truncate font-mono" title={session.pagesVisited[session.pagesVisited.length - 1]}>
                        {session.pagesVisited[session.pagesVisited.length - 1] || "Unknown"}
                    </p>
                </div>

                {session.suggestedAction && (
                    <div className="bg-gradient-to-r from-emerald-950 to-slate-950 border border-emerald-900/50 rounded-lg p-3 relative overflow-hidden">
                        <div className="absolute top-0 right-0 p-1 opacity-20">
                            <Zap className="w-8 h-8 text-emerald-500" />
                        </div>
                        <div className="flex items-center gap-2 mb-1 relative z-10">
                            <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                            <span className="text-[10px] font-bold text-emerald-400 uppercase tracking-wider">AI Intervention</span>
                        </div>
                        <p className="text-xs text-emerald-200 relative z-10 font-medium">
                            {session.suggestedAction.split('_').join(' ')}
                        </p>
                    </div>
                )}
            </div>

            <div className="absolute bottom-0 left-0 w-full h-1 bg-slate-800 rounded-b-xl overflow-hidden">
                <div
                    className={`h-full transition-all duration-500 ${session.intentScore > 70 ? 'bg-emerald-500' : session.intentScore > 40 ? 'bg-amber-500' : 'bg-slate-600'}`}
                    style={{ width: `${session.intentScore}%` }}
                />
            </div>
        </motion.div>
    );
}
