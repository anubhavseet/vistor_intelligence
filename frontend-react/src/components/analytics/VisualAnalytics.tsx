import React, { useState, useEffect } from 'react';
import { useQuery } from '@apollo/client/react';
import { Loader2, Clock, MousePointerClick, ChevronLeft, Layout, Globe, Search } from 'lucide-react';
import { GET_PAGE_SECTIONS, GET_SECTION_METRICS } from '@/lib/queries/visual-analytics';
import { GET_CRAWLED_PAGES } from '@/lib/graphql/site-operations';

interface VisualAnalyticsProps {
    siteId: string;
    initialUrl?: string;
}

interface PageSection {
    selector: string;
    html: string;
    description?: string;
}

interface SectionMetric {
    selector: string;
    avgDwellTime: number;
    clickCount: number;
}

interface PageSectionsData {
    getPageSections: PageSection[];
}

interface SectionMetricsData {
    getSectionMetrics: SectionMetric[];
}

interface CrawledPagesData {
    getCrawledPages: string[];
}

export const VisualAnalytics: React.FC<VisualAnalyticsProps> = ({ siteId, initialUrl }) => {
    const [selectedUrl, setSelectedUrl] = useState<string | null>(initialUrl || null);
    const [searchTerm, setSearchTerm] = useState('');
    const [days] = useState(30);

    // 1. Fetch List of Crawled Pages
    const { data: crawledData, loading: loadingPages, error: pagesError } = useQuery<CrawledPagesData>(GET_CRAWLED_PAGES, {
        variables: { siteId },
        skip: !!selectedUrl
    });

    // 2. Fetch Visual Data for Selected Page
    const { data: sectionsData, loading: sectionsLoading } = useQuery<PageSectionsData>(GET_PAGE_SECTIONS, {
        variables: { siteId, url: selectedUrl || '' },
        skip: !selectedUrl
    });

    const { data: metricsData, loading: metricsLoading } = useQuery<SectionMetricsData>(GET_SECTION_METRICS, {
        variables: { siteId, url: selectedUrl || '', days },
        skip: !selectedUrl
    });

    // Effect to update selected URL if initialUrl changes
    useEffect(() => {
        if (initialUrl) setSelectedUrl(initialUrl);
    }, [initialUrl]);


    // RENDER: Page Selection List
    if (!selectedUrl) {
        if (loadingPages) {
            return (
                <div className="flex flex-col items-center justify-center p-12 h-64 border rounded-xl bg-card">
                    <Loader2 className="animate-spin text-primary mb-4" size={32} />
                    <p className="text-muted-foreground">Loading crawled pages...</p>
                </div>
            );
        }

        if (pagesError) {
            return (
                <div className="flex flex-col items-center justify-center p-12 h-64 border rounded-xl bg-destructive/10 text-destructive border-destructive/20">
                    <p className="font-semibold">Error loading pages</p>
                    <p className="text-sm mt-1">{pagesError.message}</p>
                </div>
            );
        }

        const pages = crawledData?.getCrawledPages || [];
        const filteredPages = pages.filter(p => p.toLowerCase().includes(searchTerm.toLowerCase()));

        return (
            <div className="space-y-6 animate-in fade-in duration-300">
                <div className="flex items-center justify-between">
                    <h3 className="text-lg font-semibold flex items-center gap-2">
                        <Layout className="w-5 h-5 text-primary" />
                        Select Page to Visualize
                    </h3>
                    <div className="relative w-64">
                        <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                        <input
                            type="text"
                            placeholder="Search URL..."
                            className="w-full pl-9 pr-4 py-2 text-sm border rounded-md bg-background focus:outline-none focus:ring-2 focus:ring-primary/50"
                            value={searchTerm}
                            onChange={e => setSearchTerm(e.target.value)}
                        />
                    </div>
                </div>

                {pages.length === 0 ? (
                    <div className="text-center p-12 border border-dashed rounded-xl bg-muted/30">
                        <Globe className="w-12 h-12 text-muted-foreground mx-auto mb-4 opacity-50" />
                        <h4 className="font-medium text-lg">No crawled pages found</h4>
                        <p className="text-muted-foreground mt-2 max-w-sm mx-auto">
                            Start a new crawl in the "Crawling" tab to index your site content for visual analytics.
                        </p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {filteredPages.map((url) => (
                            <button
                                key={url}
                                onClick={() => setSelectedUrl(url)}
                                className="flex items-start p-4 text-left border rounded-lg hover:border-primary/50 hover:bg-primary/5 transition-all group"
                            >
                                <div className="mt-1 p-2 bg-primary/10 rounded-md mr-3 group-hover:bg-primary/20 transition-colors">
                                    <Layout className="w-4 h-4 text-primary" />
                                </div>
                                <div className="flex-1 min-w-0">
                                    <div className="font-medium text-sm truncate" title={url}>
                                        {url.replace(/^https?:\/\/[^/]+/, '') || '/'}
                                    </div>
                                    <div className="text-xs text-muted-foreground truncate mt-1 opacity-70">
                                        {url}
                                    </div>
                                </div>
                            </button>
                        ))}
                    </div>
                )}
            </div>
        );
    }

    // RENDER: Visual Analysis (Detail View)
    if (sectionsLoading || metricsLoading) {
        return (
            <div className="h-[600px] flex flex-col items-center justify-center border rounded-xl bg-card">
                <Loader2 className="animate-spin text-primary mb-4" size={32} />
                <p className="text-muted-foreground">Reconstructing page visualization...</p>
            </div>
        );
    }

    const sections = sectionsData?.getPageSections || [];
    const metrics = metricsData?.getSectionMetrics || [];
    const metricsMap = new Map(metrics.map((m) => [m.selector, m]));

    return (
        <div className="space-y-6 animate-in slide-in-from-right-4 duration-500">
            {/* Header / Navigation */}
            <div className="flex items-center justify-between pb-4 border-b">
                <div className="flex items-center gap-4">
                    <button
                        onClick={() => setSelectedUrl(null)}
                        className="p-2 hover:bg-accent rounded-full transition-colors"
                        title="Back to pages list"
                    >
                        <ChevronLeft className="w-5 h-5" />
                    </button>
                    <div>
                        <h3 className="font-semibold text-lg flex items-center gap-2">
                            Visual Reconstruction
                        </h3>
                        <p className="text-xs text-muted-foreground font-mono mt-0.5">{selectedUrl}</p>
                    </div>
                </div>

                <div className="flex gap-4 text-sm">
                    <div className="flex items-center gap-2">
                        <div className="w-24 h-2 rounded-full bg-gradient-to-r from-indigo-500/20 to-indigo-500"></div>
                        <span className="text-xs text-muted-foreground">Engagement Intensity</span>
                    </div>
                </div>
            </div>

            {sections.length === 0 ? (
                <div className="p-12 text-center border rounded-xl bg-muted/10">
                    <p className="text-muted-foreground">No visual content found for this URL.</p>
                    <button
                        onClick={() => setSelectedUrl(null)}
                        className="mt-4 text-primary hover:underline text-sm"
                    >
                        Select another page
                    </button>
                </div>
            ) : (
                <div className="border border-border/50 rounded-xl overflow-hidden shadow-sm bg-muted/10 relative">
                    {/* Browser Chrome */}
                    <div className="bg-muted border-b border-border flex items-center px-4 h-10 gap-2 sticky top-0 z-20 backdrop-blur-md bg-muted/80">
                        <div className="flex gap-1.5">
                            <div className="w-2.5 h-2.5 rounded-full bg-red-400/80"></div>
                            <div className="w-2.5 h-2.5 rounded-full bg-yellow-400/80"></div>
                            <div className="w-2.5 h-2.5 rounded-full bg-green-400/80"></div>
                        </div>
                        <div className="flex-1 mx-4">
                            <div className="bg-background/50 h-6 rounded px-3 flex items-center text-xs text-muted-foreground font-mono truncate">
                                {selectedUrl}
                            </div>
                        </div>
                    </div>

                    {/* Content */}
                    <div className="p-8 space-y-6 max-h-[800px] overflow-y-auto custom-scrollbar bg-white/50 backdrop-blur-sm">
                        {sections.map((section, idx) => {
                            const metric = metricsMap.get(section.selector);
                            const dwellTime = metric?.avgDwellTime || 0;
                            const clicks = metric?.clickCount || 0;

                            // Intensity Calculation (0 to 1)
                            const intensity = Math.min((dwellTime / 10) + (clicks / 5), 1);
                            const overlayColor = `rgba(99, 102, 241, ${intensity * 0.15})`; // Subtle indigo overlay
                            const borderColor = `rgba(99, 102, 241, ${Math.max(intensity, 0.2)})`;
                            const shadow = intensity > 0.1 ? `0 4px 20px -2px rgba(99, 102, 241, ${intensity * 0.2})` : 'none';

                            return (
                                <div key={idx} className="relative group rounded-lg bg-white shadow-sm border border-border/40 transition-all duration-300 hover:shadow-md">
                                    {/* Heatmap Overlay */}
                                    <div
                                        className="absolute inset-0 pointer-events-none z-10 rounded-lg transition-all duration-500"
                                        style={{
                                            backgroundColor: overlayColor,
                                            border: `2px solid ${borderColor}`,
                                            boxShadow: shadow
                                        }}
                                    />

                                    {/* Tooltip */}
                                    <div className="absolute -top-3 right-4 z-30 opacity-0 group-hover:opacity-100 transition-all duration-200 translate-y-2 group-hover:translate-y-0">
                                        <div className="bg-popover text-popover-foreground text-xs p-3 rounded-lg shadow-xl border border-border flex gap-4 min-w-[200px]">
                                            <div className="flex flex-col gap-1">
                                                <div className="flex items-center gap-1.5 text-muted-foreground text-[10px] uppercase font-bold tracking-wider">
                                                    <Clock size={10} /> Dwell
                                                </div>
                                                <span className="font-medium text-base">{dwellTime.toFixed(1)}s</span>
                                            </div>
                                            <div className="flex flex-col gap-1 border-l pl-4 border-border">
                                                <div className="flex items-center gap-1.5 text-muted-foreground text-[10px] uppercase font-bold tracking-wider">
                                                    <MousePointerClick size={10} /> Clicks
                                                </div>
                                                <span className="font-medium text-base">{clicks}</span>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Section Content */}
                                    <div className="relative overflow-hidden rounded-lg">
                                        {/* Label Tag */}
                                        {section.description && (
                                            <div className="absolute top-0 left-0 bg-muted/90 backdrop-blur text-xs font-medium px-2 py-1 rounded-br-lg border-b border-r border-border z-20 text-muted-foreground">
                                                {section.description}
                                            </div>
                                        )}

                                        <div
                                            className="p-6 text-sm text-foreground/90 font-sans"
                                            dangerouslySetInnerHTML={{ __html: section.html }}
                                            style={{ minHeight: '60px' }}
                                        />
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            )}
        </div>
    );
};
