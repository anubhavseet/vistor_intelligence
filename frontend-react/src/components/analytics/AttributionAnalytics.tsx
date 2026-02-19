import React, { useState } from 'react';
import { gql } from '@apollo/client';
import { useQuery } from '@apollo/client/react';
import { BarChart3, Monitor, Smartphone, Tablet, Globe, Search } from 'lucide-react';
import { cn } from '@/lib/utils';
import { motion } from 'framer-motion';

const GET_ATTRIBUTION_DATA = gql`
  query GetAttributionData($siteId: String!, $days: Int!) {
    getUtmCampaigns(siteId: $siteId, days: $days) {
      campaign
      source
      medium
      visitors
      newVisitors
      bounceRate
      avgTimeSpent
      conversionRate
    }
    getDeviceStats(siteId: $siteId, days: $days) {
      deviceType
      browser
      visitors
      avgIntentScore
    }
  }
`;

interface AttributionAnalyticsProps {
    siteId: string;
}

interface CampaignData {
    campaign: string;
    source: string;
    medium: string;
    visitors: number;
    newVisitors: number;
    bounceRate: number;
    avgTimeSpent: number;
    conversionRate: number;
}

interface DeviceData {
    deviceType: string;
    browser: string;
    visitors: number;
    avgIntentScore: number;
}

export const AttributionAnalytics: React.FC<AttributionAnalyticsProps> = ({ siteId }) => {
    const [days, setDays] = useState(30);

    const { data, loading } = useQuery(GET_ATTRIBUTION_DATA, {
        variables: { siteId, days },
        fetchPolicy: 'cache-and-network',
    });

    const campaigns: CampaignData[] = (data as any)?.getUtmCampaigns || [];
    const devices: DeviceData[] = (data as any)?.getDeviceStats || [];

    if (loading && !data) {
        return (
            <div className="flex h-64 items-center justify-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
        );
    }

    // Aggregate device stats for chart
    const deviceTypeStats = devices.reduce((acc: Record<string, { count: number; intentSum: number }>, d: DeviceData) => {
        const type = d.deviceType || 'unknown';
        if (!acc[type]) acc[type] = { count: 0, intentSum: 0 };
        acc[type].count += d.visitors;
        acc[type].intentSum += d.visitors * d.avgIntentScore;
        return acc;
    }, {});

    const totalv = Object.values(deviceTypeStats).reduce((sum: number, d: any) => sum + d.count, 0) as number;

    const getDeviceIcon = (type: string) => {
        switch (type.toLowerCase()) {
            case 'mobile': return Smartphone;
            case 'tablet': return Tablet;
            case 'desktop': return Monitor;
            default: return Globe;
        }
    };

    return (
        <div className="space-y-6 animate-in fade-in duration-500">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-2xl font-bold flex items-center gap-2">
                        <BarChart3 className="w-6 h-6 text-primary" />
                        Attribution & Devices
                    </h2>
                    <p className="text-sm text-muted-foreground mt-1">
                        Track campaigns, traffic sources, and device performance
                    </p>
                </div>
                <div className="flex items-center gap-2 bg-muted rounded-lg p-1">
                    {[30, 60, 90].map((d) => (
                        <button
                            key={d}
                            onClick={() => setDays(d)}
                            className={cn(
                                "px-3 py-1.5 text-xs font-medium rounded-md transition-all",
                                days === d
                                    ? "bg-background shadow-sm text-foreground"
                                    : "text-muted-foreground hover:text-foreground"
                            )}
                        >
                            {d}d
                        </button>
                    ))}
                </div>
            </div>

            {/* Campaign Performance Table */}
            <div className="bg-card border rounded-lg overflow-hidden">
                <div className="p-6 border-b">
                    <h3 className="text-lg font-semibold flex items-center gap-2">
                        <Search className="w-5 h-5 text-blue-500" />
                        Campaign Performance
                    </h3>
                </div>

                {campaigns.length === 0 ? (
                    <div className="p-12 text-center text-muted-foreground">
                        <p>No campaign data found for this period.</p>
                        <p className="text-xs mt-1">Check your UTM parameters (utm_source, utm_campaign)</p>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm text-left">
                            <thead className="bg-muted/50 text-muted-foreground">
                                <tr>
                                    <th className="px-6 py-3 font-medium">Campaign</th>
                                    <th className="px-6 py-3 font-medium">Source / Medium</th>
                                    <th className="px-6 py-3 font-medium text-right">Visitors</th>
                                    <th className="px-6 py-3 font-medium text-right">Bounce Rate</th>
                                    <th className="px-6 py-3 font-medium text-right">Conversion</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-border/50">
                                {campaigns.map((c: CampaignData, i: number) => (
                                    <tr key={i} className="hover:bg-muted/20">
                                        <td className="px-6 py-3 font-medium">{c.campaign}</td>
                                        <td className="px-6 py-3 text-muted-foreground">
                                            {c.source} / {c.medium}
                                        </td>
                                        <td className="px-6 py-3 text-right">{c.visitors}</td>
                                        <td className="px-6 py-3 text-right">
                                            <span className={cn(
                                                "px-2 py-0.5 rounded text-xs",
                                                c.bounceRate > 70 ? "bg-red-500/10 text-red-500" : "bg-green-500/10 text-green-500"
                                            )}>
                                                {c.bounceRate}%
                                            </span>
                                        </td>
                                        <td className="px-6 py-3 text-right font-medium">
                                            {c.conversionRate}%
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            {/* Device Breakdown */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-card border rounded-lg p-6">
                    <h3 className="text-lg font-semibold mb-6 flex items-center gap-2">
                        <Monitor className="w-5 h-5 text-purple-500" />
                        Device Breakdown
                    </h3>
                    <div className="space-y-4">
                        {Object.entries(deviceTypeStats).map(([type, stat]) => {
                            const Icon = getDeviceIcon(type);
                            const percent = ((stat.count / totalv) * 100).toFixed(1);
                            const avgIntent = (stat.intentSum / stat.count).toFixed(0);

                            return (
                                <div key={type} className="flex items-center gap-4">
                                    <div className="p-2 bg-muted rounded-lg">
                                        <Icon className="w-5 h-5 text-muted-foreground" />
                                    </div>
                                    <div className="flex-1 space-y-2">
                                        <div className="flex justify-between text-sm">
                                            <span className="font-medium capitalize">{type}</span>
                                            <span className="text-muted-foreground">{percent}% ({stat.count})</span>
                                        </div>
                                        <div className="h-2 bg-muted rounded-full overflow-hidden">
                                            <motion.div
                                                initial={{ width: 0 }}
                                                animate={{ width: `${percent}%` }}
                                                className="h-full bg-primary"
                                            />
                                        </div>
                                    </div>
                                    <div className="text-right min-w-[60px]">
                                        <div className="text-xs text-muted-foreground">Intent</div>
                                        <div className="font-bold text-sm">{avgIntent}</div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>

                <div className="bg-card border rounded-lg p-6">
                    <h3 className="text-lg font-semibold mb-6 flex items-center gap-2">
                        <Globe className="w-5 h-5 text-blue-500" />
                        Top Browsers
                    </h3>
                    <div className="space-y-3">
                        {devices.slice(0, 5).map((d: DeviceData, i: number) => (
                            <div key={i} className="flex items-center justify-between p-3 bg-muted/20 rounded-lg">
                                <span className="text-sm font-medium">{d.browser}</span>
                                <div className="flex items-center gap-4 text-sm">
                                    <span className="text-muted-foreground">{d.visitors} users</span>
                                    <span className={cn(
                                        "w-8 text-right font-bold",
                                        d.avgIntentScore >= 60 ? "text-green-500" : "text-muted-foreground"
                                    )}>
                                        {d.avgIntentScore.toFixed(0)}
                                    </span>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
};
