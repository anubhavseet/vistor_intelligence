import React from 'react';
import { gql } from '@apollo/client';
import { useQuery } from '@apollo/client/react';
import {
    User, Clock, Activity, Target,
    FileText
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";

const GET_VISITOR_PROFILE = gql`
  query GetVisitorProfile($siteId: String!, $visitorId: String!) {
    getVisitorProfile(siteId: $siteId, visitorId: $visitorId) {
      visitorId
      firstSeenAt
      lastSeenAt
      totalSessions
      totalPageViews
      totalTimeSpent
      avgIntentScore
      tags
      sessions {
        sessionId
        startedAt
        duration
        pageViews
        intentScore
        intentCategory
      }
    }
  }
`;

interface VisitorProfileProps {
    siteId: string;
    visitorId: string;
    isOpen: boolean;
    onClose: () => void;
}

export const VisitorProfile: React.FC<VisitorProfileProps> = ({
    siteId, visitorId, isOpen, onClose
}) => {
    const { data, loading, error } = useQuery(GET_VISITOR_PROFILE, {
        variables: { siteId, visitorId },
        skip: !isOpen || !visitorId
    });

    const visitor = (data as any)?.getVisitorProfile;

    if (!isOpen) return null;

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2 text-xl">
                        <User className="w-5 h-5 text-primary" />
                        Visitor Profile
                    </DialogTitle>
                </DialogHeader>

                {loading ? (
                    <div className="flex h-64 items-center justify-center">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                    </div>
                ) : error ? (
                    <div className="p-4 text-red-500 bg-red-50 rounded-md">
                        Failed to load visitor profile
                    </div>
                ) : !visitor ? (
                    <div className="p-4 text-muted-foreground text-center">
                        Visitor not found
                    </div>
                ) : (
                    <div className="space-y-6">
                        {/* Header Stats */}
                        <div className="flex flex-col md:flex-row gap-4 items-start justify-between bg-muted/30 p-4 rounded-lg border">
                            <div>
                                <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wider mb-1">
                                    Visitor ID
                                </h3>
                                <div className="font-mono text-lg font-bold select-all">
                                    {visitor.visitorId}
                                </div>
                                <div className="flex gap-2 mt-2">
                                    {visitor.tags.map((tag: string) => (
                                        <span key={tag} className="px-2 py-0.5 bg-primary/10 text-primary text-xs rounded-full font-medium">
                                            {tag}
                                        </span>
                                    ))}
                                </div>
                            </div>

                            <div className="flex gap-6 text-sm">
                                <div>
                                    <div className="text-muted-foreground">First Seen</div>
                                    <div className="font-medium">{new Date(visitor.firstSeenAt).toLocaleDateString()}</div>
                                </div>
                                <div>
                                    <div className="text-muted-foreground">Last Seen</div>
                                    <div className="font-medium">{new Date(visitor.lastSeenAt).toLocaleDateString()}</div>
                                </div>
                            </div>
                        </div>

                        {/* Key Metrics Grid */}
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                            <div className="bg-card p-4 rounded-lg border">
                                <div className="flex items-center justify-between mb-2">
                                    <span className="text-xs text-muted-foreground">Total Sessions</span>
                                    <Activity className="w-4 h-4 text-blue-500" />
                                </div>
                                <div className="text-2xl font-bold">{visitor.totalSessions}</div>
                            </div>
                            <div className="bg-card p-4 rounded-lg border">
                                <div className="flex items-center justify-between mb-2">
                                    <span className="text-xs text-muted-foreground">Total Page Views</span>
                                    <FileText className="w-4 h-4 text-purple-500" />
                                </div>
                                <div className="text-2xl font-bold">{visitor.totalPageViews}</div>
                            </div>
                            <div className="bg-card p-4 rounded-lg border">
                                <div className="flex items-center justify-between mb-2">
                                    <span className="text-xs text-muted-foreground">Total Time</span>
                                    <Clock className="w-4 h-4 text-green-500" />
                                </div>
                                <div className="text-2xl font-bold">{(visitor.totalTimeSpent / 60).toFixed(0)}m</div>
                            </div>
                            <div className="bg-card p-4 rounded-lg border">
                                <div className="flex items-center justify-between mb-2">
                                    <span className="text-xs text-muted-foreground">Avg Intent</span>
                                    <Target className="w-4 h-4 text-red-500" />
                                </div>
                                <div className="text-2xl font-bold">{visitor.avgIntentScore.toFixed(0)}</div>
                            </div>
                        </div>

                        {/* Session History */}
                        <div>
                            <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
                                <Activity className="w-5 h-5 text-primary" />
                                Session History
                            </h3>
                            <div className="border rounded-lg overflow-hidden">
                                <table className="w-full text-sm">
                                    <thead className="bg-muted/50">
                                        <tr className="text-left border-b">
                                            <th className="p-3 font-medium text-muted-foreground">Date</th>
                                            <th className="p-3 font-medium text-muted-foreground">Duration</th>
                                            <th className="p-3 font-medium text-muted-foreground">Pages</th>
                                            <th className="p-3 font-medium text-muted-foreground">Intent</th>
                                            <th className="p-3 font-medium text-muted-foreground">Category</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {visitor.sessions.map((session: any) => (
                                            <tr key={session.sessionId} className="border-b last:border-0 hover:bg-muted/20">
                                                <td className="p-3">
                                                    {new Date(session.startedAt).toLocaleString()}
                                                </td>
                                                <td className="p-3">
                                                    {(session.duration / 60).toFixed(1)}m
                                                </td>
                                                <td className="p-3">{session.pageViews}</td>
                                                <td className="p-3">
                                                    <span className={cn(
                                                        "px-2 py-0.5 rounded text-xs font-medium",
                                                        session.intentScore >= 70 ? "bg-green-100 text-green-700" :
                                                            session.intentScore >= 40 ? "bg-yellow-100 text-yellow-700" :
                                                                "bg-gray-100 text-gray-700"
                                                    )}>
                                                        {session.intentScore}
                                                    </span>
                                                </td>
                                                <td className="p-3">
                                                    <span className="text-muted-foreground text-xs uppercase">
                                                        {session.intentCategory || 'unknown'}
                                                    </span>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>
                )}
            </DialogContent>
        </Dialog>
    );
};
