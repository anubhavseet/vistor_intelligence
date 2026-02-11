import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useQuery } from '@apollo/client/react'
import { useAuth } from '@/hooks/use-auth'
import { Copy, Check, Globe, AlertCircle } from 'lucide-react'
import { GET_SITES } from '@/lib/graphql/site-operations'
import { cn } from '@/lib/utils'

export default function TrackingCodePage() {
    const navigate = useNavigate()
    const { isAuthenticated } = useAuth()
    const [selectedSite, setSelectedSite] = useState<string | null>(null)
    const [copiedId, setCopiedId] = useState<string | null>(null)

    const { data, loading, error } = useQuery(GET_SITES, {
        skip: !isAuthenticated,
    })

    useEffect(() => {
        if (!isAuthenticated) {
            navigate('/')
        }
    }, [isAuthenticated, navigate])

    useEffect(() => {
        if ((data as any)?.getSites?.length > 0 && !selectedSite) {
            setSelectedSite((data as any).getSites[0].siteId)
        }
    }, [data, selectedSite])

    if (!isAuthenticated) {
        return null
    }

    const sites = (data as any)?.getSites || []
    const currentSite = sites.find((s: any) => s.siteId === selectedSite)

    const handleCopy = (text: string, id: string) => {
        navigator.clipboard.writeText(text)
        setCopiedId(id)
        setTimeout(() => setCopiedId(null), 2000)
    }

    const trackingCode = currentSite ? `<!-- Visitor Intel Tracking Code -->
<script>
  (function() {
    var script = document.createElement('script');
    script.src = '${window.location.origin}/tracker.js';
    script.async = true;
    script.setAttribute('data-site-id', '${currentSite.siteId}');
    script.setAttribute('data-api-key', '${currentSite.apiKey}');
    script.setAttribute('data-graphql-endpoint', '${import.meta.env.VITE_GRAPHQL_URI || (import.meta.env.VITE_API_URL ? import.meta.env.VITE_API_URL + '/graphql' : 'http://localhost:4040/graphql')}');
    document.head.appendChild(script);
  })();
</script>
<!-- End Visitor Intel Tracking Code -->` : ''

    const reactCode = currentSite ? `import { useEffect } from 'react';

export default function App() {
  useEffect(() => {
    const script = document.createElement('script');
    script.src = '${window.location.origin}/tracker.js';
    script.async = true;
    script.setAttribute('data-site-id', '${currentSite.siteId}');
    script.setAttribute('data-api-key', '${currentSite.apiKey}');
    script.setAttribute('data-graphql-endpoint', '${import.meta.env.VITE_GRAPHQL_URI || (import.meta.env.VITE_API_URL ? import.meta.env.VITE_API_URL + '/graphql' : 'http://localhost:4040/graphql')}');
    document.head.appendChild(script);

    return () => {
      document.head.removeChild(script);
    };
  }, []);

  return <div>Your App</div>;
}` : ''

    const nextJsCode = currentSite ? `// pages/_app.tsx or app/layout.tsx

// Usage via next/script
import Script from 'next/script';

export default function RootLayout({ children }) {
  return (
    <>
      <Script
        src="${window.location.origin}/tracker.js"
        strategy="afterInteractive"
        data-site-id="${currentSite.siteId}"
        data-api-key="${currentSite.apiKey}"
        data-graphql-endpoint="${import.meta.env.VITE_GRAPHQL_URI || (import.meta.env.VITE_API_URL ? import.meta.env.VITE_API_URL + '/graphql' : 'http://localhost:4040/graphql')}"
      />
      {children}
    </>
  );
}` : ''

    return (
        <div className="space-y-6">
            {/* Header */}
            <div>
                <h1 className="text-3xl font-bold tracking-tight">Tracking Code</h1>
                <p className="text-muted-foreground">
                    Install the tracking script on your website to start collecting data.
                </p>
            </div>

            {loading && (
                <div className="flex justify-center p-8">
                    <div className="h-6 w-6 animate-spin rounded-full border-b-2 border-primary"></div>
                </div>
            )}

            {error && (
                <div className="rounded-md bg-destructive/15 p-4 text-sm text-destructive">
                    Error loading sites: {error.message}
                </div>
            )}

            {!loading && sites.length === 0 && (
                <div className="rounded-lg border border-dashed bg-card p-12 text-center">
                    <Globe className="mx-auto mb-4 h-12 w-12 text-muted-foreground opacity-50" />
                    <h3 className="text-lg font-semibold">No websites registered</h3>
                    <p className="text-muted-foreground mb-4">
                        You need to add a website before you can get the tracking code.
                    </p>
                    <button
                        onClick={() => navigate('/dashboard/sites')}
                        className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
                    >
                        Add Your First Website
                    </button>
                </div>
            )}

            {!loading && sites.length > 0 && (
                <>
                    {/* Site Selector */}
                    <div className="rounded-lg border bg-card p-6 shadow-sm">
                        <h2 className="text-lg font-semibold mb-4">Select Website</h2>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            {sites.map((site: any) => (
                                <button
                                    key={site.id}
                                    onClick={() => setSelectedSite(site.siteId)}
                                    className={cn(
                                        "flex flex-col items-start p-4 rounded-lg border transition-all hover:bg-accent",
                                        selectedSite === site.siteId
                                            ? "border-primary bg-primary/5 ring-1 ring-primary"
                                            : "border-input bg-card"
                                    )}
                                >
                                    <div className="flex items-center space-x-2 mb-2 w-full">
                                        <Globe className={cn("h-4 w-4", selectedSite === site.siteId ? "text-primary" : "text-muted-foreground")} />
                                        <span className="font-semibold truncate">{site.name}</span>
                                    </div>
                                    <span className="text-xs text-muted-foreground truncate w-full text-left">{site.domain || 'No domain'}</span>
                                </button>
                            ))}
                        </div>
                    </div>

                    {currentSite && (
                        <>
                            {/* Info Banner */}
                            <div className="rounded-lg bg-blue-50/80 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 p-4 text-sm text-blue-900 dark:text-blue-300 flex gap-3">
                                <AlertCircle className="h-5 w-5 flex-shrink-0 text-blue-600 dark:text-blue-400" />
                                <div className="space-y-1">
                                    <p className="font-semibold">Installation Instructions</p>
                                    <ul className="list-disc pl-4 space-y-1 text-blue-800 dark:text-blue-300">
                                        <li>Copy the tracking code below.</li>
                                        <li>Paste it into the <code>&lt;head&gt;</code> section of your website.</li>
                                        <li>Tracking will start immediately after installation.</li>
                                    </ul>
                                </div>
                            </div>

                            {/* Standard HTML Code */}
                            <div className="rounded-lg border bg-card shadow-sm">
                                <div className="flex items-center justify-between border-b p-4">
                                    <h2 className="font-semibold">Standard HTML</h2>
                                    <button
                                        onClick={() => handleCopy(trackingCode, 'html')}
                                        className="inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 border border-input bg-background shadow-sm hover:bg-accent hover:text-accent-foreground h-9 px-4 py-2"
                                    >
                                        {copiedId === 'html' ? (
                                            <>
                                                <Check className="mr-2 h-4 w-4" />
                                                Copied!
                                            </>
                                        ) : (
                                            <>
                                                <Copy className="mr-2 h-4 w-4" />
                                                Copy Code
                                            </>
                                        )}
                                    </button>
                                </div>
                                <div className="p-4 bg-gray-50 dark:bg-muted/50 overflow-x-auto">
                                    <pre className="text-sm font-mono text-foreground">
                                        {trackingCode}
                                    </pre>
                                </div>
                            </div>

                            {/* React Code */}
                            <div className="rounded-lg border bg-card shadow-sm">
                                <div className="flex items-center justify-between border-b p-4">
                                    <h2 className="font-semibold">React / Vue / Angular</h2>
                                    <button
                                        onClick={() => handleCopy(reactCode, 'react')}
                                        className="inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 border border-input bg-background shadow-sm hover:bg-accent hover:text-accent-foreground h-9 px-4 py-2"
                                    >
                                        {copiedId === 'react' ? (
                                            <>
                                                <Check className="mr-2 h-4 w-4" />
                                                Copied!
                                            </>
                                        ) : (
                                            <>
                                                <Copy className="mr-2 h-4 w-4" />
                                                Copy Code
                                            </>
                                        )}
                                    </button>
                                </div>
                                <div className="p-4 bg-gray-50 dark:bg-muted/50 overflow-x-auto">
                                    <pre className="text-sm font-mono text-foreground">
                                        {reactCode}
                                    </pre>
                                </div>
                            </div>

                            {/* Next.js Code */}
                            <div className="rounded-lg border bg-card shadow-sm">
                                <div className="flex items-center justify-between border-b p-4">
                                    <h2 className="font-semibold">Next.js</h2>
                                    <button
                                        onClick={() => handleCopy(nextJsCode, 'nextjs')}
                                        className="inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 border border-input bg-background shadow-sm hover:bg-accent hover:text-accent-foreground h-9 px-4 py-2"
                                    >
                                        {copiedId === 'nextjs' ? (
                                            <>
                                                <Check className="mr-2 h-4 w-4" />
                                                Copied!
                                            </>
                                        ) : (
                                            <>
                                                <Copy className="mr-2 h-4 w-4" />
                                                Copy Code
                                            </>
                                        )}
                                    </button>
                                </div>
                                <div className="p-4 bg-gray-50 dark:bg-muted/50 overflow-x-auto">
                                    <pre className="text-sm font-mono text-foreground">
                                        {nextJsCode}
                                    </pre>
                                </div>
                            </div>
                        </>
                    )}
                </>
            )}
        </div>
    )
}
