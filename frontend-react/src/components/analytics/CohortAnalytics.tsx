import React, { useState, useMemo } from 'react';
import { gql } from '@apollo/client';
import { useQuery } from '@apollo/client/react';
import { Users, TrendingUp, Calendar, Target, Clock, Award } from 'lucide-react';
import { cn } from '@/lib/utils';

const GET_COHORT_RETENTION = gql`
  query GetCohortRetention($siteId: String!, $startDate: DateTime!, $endDate: DateTime!) {
    getCohortRetention(siteId: $siteId, startDate: $startDate, endDate: $endDate) {
      cohortId
      firstSeen
      visitorCount
      avgIntentScore
      conversionRate
      retention {
        day1
        day7
        day30
      }
    }
  }
`;

const GET_VISITOR_LIFECYCLE = gql`
  query GetVisitorLifecycle($siteId: String!) {
    getVisitorLifecycle(siteId: $siteId) {
      total
      stages {
        stage
        count
        avgSessionCount
        avgIntentScore
        avgTimeSpent
      }
    }
  }
`;

interface CohortAnalyticsProps {
    siteId: string;
}

interface CohortRetentionData {
    getCohortRetention: any[];
}

interface CohortRetentionVars {
    siteId: string;
    startDate: string;
    endDate: string;
}

interface VisitorLifecycleData {
    getVisitorLifecycle: any;
}

interface VisitorLifecycleVars {
    siteId: string;
}

export const CohortAnalytics: React.FC<CohortAnalyticsProps> = ({ siteId }) => {
    const [dateRange, setDateRange] = useState(30);

    const { startDate, endDate } = useMemo(() => {
        const end = new Date();
        const start = new Date(end.getTime() - dateRange * 24 * 60 * 60 * 1000);
        return { startDate: start, endDate: end };
    }, [dateRange]);

    const { data: cohortData, loading: cohortLoading } = useQuery<CohortRetentionData, CohortRetentionVars>(GET_COHORT_RETENTION, {
        variables: {
            siteId,
            startDate: startDate.toISOString(),
            endDate: endDate.toISOString(),
        },
        skip: !siteId,
    });

    const { data: lifecycleData, loading: lifecycleLoading } = useQuery<VisitorLifecycleData, VisitorLifecycleVars>(GET_VISITOR_LIFECYCLE, {
        variables: { siteId },
        skip: !siteId,
    });

    if (cohortLoading || lifecycleLoading) {
        return (
            <div className="flex h-64 items-center justify-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
        );
    }

    const cohorts = cohortData?.getCohortRetention ?? [];
    const lifecycle = lifecycleData?.getVisitorLifecycle ?? null;

    // Calculate average retention rates
    const avgRetention = cohorts.length > 0 ? {
        day1: cohorts.reduce((sum: number, c: any) => sum + c.retention.day1, 0) / cohorts.length,
        day7: cohorts.reduce((sum: number, c: any) => sum + c.retention.day7, 0) / cohorts.length,
        day30: cohorts.reduce((sum: number, c: any) => sum + c.retention.day30, 0) / cohorts.length,
    } : { day1: 0, day7: 0, day30: 0 };

    const getLifecycleColor = (stage: string) => {
        switch (stage) {
            case 'New': return 'text-blue-500 bg-blue-500/10';
            case 'Active': return 'text-green-500 bg-green-500/10';
            case 'Power User': return 'text-purple-500 bg-purple-500/10';
            case 'Casual': return 'text-yellow-500 bg-yellow-500/10';
            case 'Churned': return 'text-red-500 bg-red-500/10';
            default: return 'text-gray-500 bg-gray-500/10';
        }
    };

    const getLifecycleIcon = (stage: string) => {
        switch (stage) {
            case 'New': return Users;
            case 'Active': return TrendingUp;
            case 'Power User': return Award;
            case 'Casual': return Clock;
            case 'Churned': return Target;
            default: return Users;
        }
    };

    return (
        <div className="space-y-6 animate-in fade-in duration-500">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-2xl font-bold flex items-center gap-2">
                        <Calendar className="w-6 h-6 text-primary" />
                        Cohort & Lifecycle Analytics
                    </h2>
                    <p className="text-sm text-muted-foreground mt-1">
                        Track visitor retention and lifecycle progression
                    </p>
                </div>

                <div className="flex items-center gap-2">
                    {[30, 60, 90].map((days) => (
                        <button
                            key={days}
                            onClick={() => setDateRange(days)}
                            className={cn(
                                "px-3 py-1.5 text-sm font-medium rounded-md transition-all",
                                dateRange === days
                                    ? "bg-primary text-primary-foreground"
                                    : "bg-muted text-muted-foreground hover:bg-muted/80"
                            )}
                        >
                            {days} Days
                        </button>
                    ))}
                </div>
            </div>

            {/* Retention Overview Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-card border rounded-lg p-6">
                    <div className="flex items-center justify-between mb-2">
                        <h3 className="text-sm font-medium text-muted-foreground">Day 1 Retention</h3>
                        <Users className="w-5 h-5 text-blue-500" />
                    </div>
                    <div className="text-3xl font-bold">{avgRetention.day1.toFixed(1)}%</div>
                    <p className="text-xs text-muted-foreground mt-1">Visitors returning next day</p>
                </div>

                <div className="bg-card border rounded-lg p-6">
                    <div className="flex items-center justify-between mb-2">
                        <h3 className="text-sm font-medium text-muted-foreground">Day 7 Retention</h3>
                        <TrendingUp className="w-5 h-5 text-green-500" />
                    </div>
                    <div className="text-3xl font-bold">{avgRetention.day7.toFixed(1)}%</div>
                    <p className="text-xs text-muted-foreground mt-1">Visitors active after a week</p>
                </div>

                <div className="bg-card border rounded-lg p-6">
                    <div className="flex items-center justify-between mb-2">
                        <h3 className="text-sm font-medium text-muted-foreground">Day 30 Retention</h3>
                        <Award className="w-5 h-5 text-purple-500" />
                    </div>
                    <div className="text-3xl font-bold">{avgRetention.day30.toFixed(1)}%</div>
                    <p className="text-xs text-muted-foreground mt-1">Long-term engaged visitors</p>
                </div>
            </div>

            {/* Cohort Retention Table */}
            <div className="bg-card border rounded-lg p-6">
                <h3 className="text-lg font-semibold mb-4">Cohort Retention Analysis</h3>

                {cohorts.length === 0 ? (
                    <div className="text-center py-12 text-muted-foreground">
                        <Calendar className="w-12 h-12 mx-auto mb-3 opacity-50" />
                        <p>No cohort data available for this period</p>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead>
                                <tr className="border-b border-border/50 text-left">
                                    <th className="pb-3 font-medium text-muted-foreground">Cohort Date</th>
                                    <th className="pb-3 font-medium text-muted-foreground text-right">Visitors</th>
                                    <th className="pb-3 font-medium text-muted-foreground text-right">Day 1</th>
                                    <th className="pb-3 font-medium text-muted-foreground text-right">Day 7</th>
                                    <th className="pb-3 font-medium text-muted-foreground text-right">Day 30</th>
                                    <th className="pb-3 font-medium text-muted-foreground text-right">Avg Intent</th>
                                </tr>
                            </thead>
                            <tbody>
                                {cohorts.map((cohort: any, idx: number) => (
                                    <tr key={idx} className="border-b border-border/10 hover:bg-muted/20 transition-colors">
                                        <td className="py-3 font-medium">
                                            {new Date(cohort.firstSeen).toLocaleDateString()}
                                        </td>
                                        <td className="py-3 text-right">{cohort.visitorCount}</td>
                                        <td className="py-3 text-right">
                                            <span className={cn(
                                                "px-2 py-1 rounded text-xs font-medium",
                                                cohort.retention.day1 >= 50 ? "bg-green-500/10 text-green-500" :
                                                    cohort.retention.day1 >= 30 ? "bg-yellow-500/10 text-yellow-500" :
                                                        "bg-red-500/10 text-red-500"
                                            )}>
                                                {(cohort.retention.day1 || 0).toFixed(1)}%
                                            </span>
                                        </td>
                                        <td className="py-3 text-right">
                                            <span className={cn(
                                                "px-2 py-1 rounded text-xs font-medium",
                                                cohort.retention.day7 >= 30 ? "bg-green-500/10 text-green-500" :
                                                    cohort.retention.day7 >= 15 ? "bg-yellow-500/10 text-yellow-500" :
                                                        "bg-red-500/10 text-red-500"
                                            )}>
                                                {(cohort.retention.day7 || 0).toFixed(1)}%
                                            </span>
                                        </td>
                                        <td className="py-3 text-right">
                                            <span className={cn(
                                                "px-2 py-1 rounded text-xs font-medium",
                                                cohort.retention.day30 >= 20 ? "bg-green-500/10 text-green-500" :
                                                    cohort.retention.day30 >= 10 ? "bg-yellow-500/10 text-yellow-500" :
                                                        "bg-red-500/10 text-red-500"
                                            )}>
                                                {(cohort.retention.day30 || 0).toFixed(1)}%
                                            </span>
                                        </td>
                                        <td className="py-3 text-right">{(cohort.avgIntentScore || 0).toFixed(0)}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            {/* Visitor Lifecycle Stages */}
            <div className="bg-card border rounded-lg p-6">
                <h3 className="text-lg font-semibold mb-4">Visitor Lifecycle Stages</h3>

                {!lifecycle || lifecycle.stages.length === 0 ? (
                    <div className="text-center py-12 text-muted-foreground">
                        <Users className="w-12 h-12 mx-auto mb-3 opacity-50" />
                        <p>No lifecycle data available</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {lifecycle.stages.map((stage: any, idx: number) => {
                            const Icon = getLifecycleIcon(stage.stage);
                            const percentage = lifecycle.total > 0 ? (stage.count / lifecycle.total) * 100 : 0;

                            return (
                                <div key={idx} className="border rounded-lg p-4 hover:border-primary/50 transition-all">
                                    <div className="flex items-center justify-between mb-3">
                                        <span className={cn("px-2 py-1 rounded text-xs font-medium", getLifecycleColor(stage.stage))}>
                                            {stage.stage}
                                        </span>
                                        <Icon className="w-5 h-5 text-muted-foreground" />
                                    </div>

                                    <div className="space-y-2">
                                        <div>
                                            <div className="text-2xl font-bold">{stage.count}</div>
                                            <div className="text-xs text-muted-foreground">{percentage.toFixed(1)}% of total</div>
                                        </div>

                                        <div className="h-1 w-full bg-muted rounded-full overflow-hidden">
                                            <div
                                                className="h-full bg-primary transition-all duration-500"
                                                style={{ width: `${percentage}%` }}
                                            />
                                        </div>

                                        <div className="grid grid-cols-2 gap-2 text-xs mt-3">
                                            <div>
                                                <div className="text-muted-foreground">Avg Sessions</div>
                                                <div className="font-medium">{(stage.avgSessionCount || 0).toFixed(1)}</div>
                                            </div>
                                            <div>
                                                <div className="text-muted-foreground">Avg Intent</div>
                                                <div className="font-medium">{(stage.avgIntentScore || 0).toFixed(0)}</div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}

                {lifecycle && lifecycle.total > 0 && (
                    <div className="mt-4 pt-4 border-t border-border/50">
                        <div className="text-sm text-muted-foreground">
                            Total Visitors (Last 90 Days): <span className="font-bold text-foreground">{lifecycle.total.toLocaleString()}</span>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};
