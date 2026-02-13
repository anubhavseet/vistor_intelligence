
import React, { useState } from 'react';
import { useQuery } from '@apollo/client/react';
import { Loader2, Clock, MousePointerClick } from 'lucide-react';
import { GET_PAGE_SECTIONS, GET_SECTION_METRICS } from '@/lib/queries/visual-analytics';

interface VisualAnalyticsProps {
    siteId: string;
    url: string; // The specific page URL to analyze
}

export const VisualAnalytics: React.FC<VisualAnalyticsProps> = ({ siteId, url }) => {
    const [days, setDays] = useState(30);

    const { data: sectionsData, loading: sectionsLoading } = useQuery(GET_PAGE_SECTIONS, {
        variables: { siteId, url },
        skip: !url
    });

    const { data: metricsData, loading: metricsLoading } = useQuery(GET_SECTION_METRICS, {
        variables: { siteId, url, days },
        skip: !url
    });

    if (!url) {
        return (
            <div className="h-64 flex items-center justify-center bg-gray-50 rounded-lg border border-dashed border-gray-300">
                <p className="text-gray-500">Select a page from the list to view visual analytics</p>
            </div>
        );
    }

    if (sectionsLoading || metricsLoading) {
        return (
            <div className="h-64 flex items-center justify-center">
                <Loader2 className="animate-spin text-indigo-600" size={32} />
            </div>
        );
    }

    const sections = sectionsData?.getPageSections || [];
    const metrics = metricsData?.getSectionMetrics || [];

    // Create lookup map for metrics
    const metricsMap = new Map(metrics.map((m: any) => [m.selector, m]));

    if (sections.length === 0) {
        return (
            <div className="p-8 text-center">
                <p className="text-gray-500">No crawled content found for this page. Please run the crawler first.</p>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-foreground">Visual Reconstruction</h3>
                <div className="flex gap-2 text-sm text-muted-foreground">
                    <div className="flex items-center gap-1"><span className="w-3 h-3 bg-indigo-500/20 rounded-sm border border-indigo-500/50"></span> Low Engagement</div>
                    <div className="flex items-center gap-1"><span className="w-3 h-3 bg-indigo-500 rounded-sm"></span> High Engagement</div>
                </div>
            </div>

            <div className="border border-border rounded-xl overflow-hidden shadow-sm bg-muted/30 max-h-[800px] overflow-y-auto custom-scrollbar relative">
                <div className="absolute top-0 left-0 w-full h-10 bg-muted border-b border-border flex items-center px-4 gap-2 sticky z-10 backdrop-blur-sm bg-muted/90">
                    <div className="flex gap-1.5">
                        <div className="w-2.5 h-2.5 rounded-full bg-red-500/80"></div>
                        <div className="w-2.5 h-2.5 rounded-full bg-yellow-500/80"></div>
                        <div className="w-2.5 h-2.5 rounded-full bg-green-500/80"></div>
                    </div>
                    <div className="flex-1 text-center text-xs text-muted-foreground font-mono truncate px-4">
                        {url}
                    </div>
                </div>

                <div className="p-8 space-y-4 pt-14">
                    {sections.map((section: any, idx: number) => {
                        const metric = metricsMap.get(section.selector);
                        const dwellTime = metric?.avgDwellTime || 0;

                        // Calculate intensity for heatmap overlay
                        const intensity = Math.min(dwellTime / 10, 1); // Max out at 10s avg
                        const overlayColor = `rgba(99, 102, 241, ${intensity * 0.3})`;
                        const borderColor = `rgba(99, 102, 241, ${intensity})`;

                        return (
                            <div key={idx} className="relative group">
                                {/* Overlay */}
                                <div
                                    className="absolute inset-0 pointer-events-none transition-all duration-300 z-10 rounded border-2"
                                    style={{
                                        backgroundColor: overlayColor,
                                        borderColor: borderColor,
                                        opacity: 0.7
                                    }}
                                />

                                {/* Tooltip on Hover */}
                                <div className="absolute top-2 right-2 z-20 opacity-0 group-hover:opacity-100 transition-opacity bg-popover text-popover-foreground text-xs p-2 rounded shadow-lg border border-border backdrop-blur-sm pointer-events-none">
                                    <div className="font-mono mb-1 text-muted-foreground">{section.selector}</div>
                                    <div className="flex items-center gap-3">
                                        <div className="flex items-center gap-1">
                                            <Clock size={14} className="text-yellow-500" />
                                            <span>{dwellTime}s avg</span>
                                        </div>
                                        <div className="flex items-center gap-1">
                                            <MousePointerClick size={14} className="text-green-500" />
                                            <span>{metric?.clickCount || 0} clicks</span>
                                        </div>
                                    </div>
                                    {section.description && (
                                        <div className="mt-1 pt-1 border-t border-border text-muted-foreground max-w-[200px]">
                                            {section.description}
                                        </div>
                                    )}
                                </div>

                                {/* Content */}
                                {/* Render raw HTML safely - using a simplified renderer or dangerouslySetInnerHTML if trusted */}
                                <div
                                    className="p-4 bg-white shadow-sm rounded border border-gray-200 hover:shadow-md transition-shadow text-black"
                                    dangerouslySetInnerHTML={{ __html: section.html }}
                                />
                            </div>
                        );
                    })}
                </div>
            </div>
        </div>
    );
};
