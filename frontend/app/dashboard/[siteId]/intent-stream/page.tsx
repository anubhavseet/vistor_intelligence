"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";

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

export default function IntentStreamPage() {
    const { siteId } = useParams();
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
        <div className="min-h-screen bg-slate-950 text-white p-8 font-sans">
            <header className="mb-8 flex justify-between items-center">
                <div>
                    <h1 className="text-4xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-emerald-400">
                        Live Intent Stream
                    </h1>
                    <p className="text-slate-400 mt-2">
                        Real-time behavioral analysis for site: <span className="text-emerald-300 font-mono">{siteId}</span>
                    </p>
                </div>
                <div className="flex gap-4">
                    <div className="bg-slate-900 px-4 py-2 rounded-lg border border-slate-800">
                        <span className="block text-xs text-slate-500 uppercase">Active Sessions</span>
                        <span className="text-2xl font-bold text-white">{sessions.length}</span>
                    </div>
                </div>
            </header>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <AnimatePresence>
                    {sessions.map((session) => (
                        <SessionCard key={session.sessionId} session={session} />
                    ))}
                </AnimatePresence>
            </div>

            {sessions.length === 0 && !loading && (
                <div className="text-center py-20 text-slate-600">
                    <p className="text-xl">Waiting for traffic...</p>
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
            className={`relative bg-slate-900/50 backdrop-blur-xl border ${getBorderColor(session.intentCategory)} rounded-xl p-6 transition-all duration-300 hover:bg-slate-800/50`}
        >
            <div className="flex justify-between items-start mb-4">
                <div>
                    <div className="text-xs text-slate-500 font-mono mb-1">{session.sessionId.slice(0, 8)}...</div>
                    <h3 className={`text-2xl font-bold ${getScoreColor(session.intentScore)}`}>
                        {session.intentScore} <span className="text-sm font-normal text-slate-500">/ 100</span>
                    </h3>
                    <div className="mt-1 inline-block px-2 py-0.5 rounded-full text-xs font-semibold bg-white/5 uppercase tracking-wide">
                        {session.intentCategory}
                    </div>
                </div>
                <div className="text-right">
                    <div className="text-xs text-slate-400">Last active</div>
                    <div className="text-sm font-medium text-white">
                        {new Date(session.lastActivityAt).toLocaleTimeString()}
                    </div>
                </div>
            </div>

            <div className="space-y-3">
                <div>
                    <p className="text-xs text-slate-500 uppercase mb-1">Current Page</p>
                    <p className="text-sm text-blue-300 truncate">
                        {session.pagesVisited[session.pagesVisited.length - 1] || "Unknown"}
                    </p>
                </div>

                {session.suggestedAction && (
                    <div className="bg-emerald-900/20 border border-emerald-900/50 rounded-lg p-3">
                        <div className="flex items-center gap-2 mb-1">
                            <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                            <span className="text-xs font-bold text-emerald-400 uppercase">AI Triggered</span>
                        </div>
                        <p className="text-sm text-emerald-200">
                            Action: <span className="font-semibold">{session.suggestedAction}</span>
                        </p>
                    </div>
                )}
            </div>

            <div className="absolute bottom-0 left-0 w-full h-1 bg-slate-800 rounded-b-xl overflow-hidden">
                <div
                    className={`h-full ${session.intentScore > 70 ? 'bg-emerald-500' : session.intentScore > 40 ? 'bg-amber-500' : 'bg-slate-600'}`}
                    style={{ width: `${session.intentScore}%` }}
                />
            </div>
        </motion.div>
    );
}
