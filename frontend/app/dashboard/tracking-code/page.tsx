'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useQuery } from '@apollo/client'
import { useAuthStore } from '@/lib/auth-store'
import DashboardLayout from '@/components/DashboardLayout'
import { Code, Copy, Check, Globe, AlertCircle } from 'lucide-react'
import { GET_SITES, type GetSitesResponse } from '@/lib/graphql/site-operations'

export default function TrackingCodePage() {
    const router = useRouter()
    const isAuthenticated = useAuthStore((state) => state.isAuthenticated)
    const [selectedSite, setSelectedSite] = useState<string | null>(null)
    const [copiedId, setCopiedId] = useState<string | null>(null)

    const { data, loading, error } = useQuery(GET_SITES, {
        skip: !isAuthenticated(),
    })

    useEffect(() => {
        if (!isAuthenticated()) {
            router.push('/')
        }
    }, [isAuthenticated, router])

    useEffect(() => {
        if (data?.getSites?.length > 0 && !selectedSite) {
            setSelectedSite(data.getSites[0].siteId)
        }
    }, [data, selectedSite])

    if (!isAuthenticated()) {
        return null
    }

    const sites = data?.getSites || []
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
    script.src = 'https://cdn.visitorintel.com/tracker.js';
    script.async = true;
    script.setAttribute('data-site-id', '${currentSite.siteId}');
    script.setAttribute('data-api-key', '${currentSite.apiKey}');
    document.head.appendChild(script);
  })();
</script>
<!-- End Visitor Intel Tracking Code -->` : ''

    const reactCode = currentSite ? `import { useEffect } from 'react';

export default function App() {
  useEffect(() => {
    const script = document.createElement('script');
    script.src = 'https://cdn.visitorintel.com/tracker.js';
    script.async = true;
    script.setAttribute('data-site-id', '${currentSite.siteId}');
    script.setAttribute('data-api-key', '${currentSite.apiKey}');
    document.head.appendChild(script);

    return () => {
      document.head.removeChild(script);
    };
  }, []);

  return <div>Your App</div>;
}` : ''

    const nextJsCode = currentSite ? `// pages/_app.tsx or app/layout.tsx
import Script from 'next/script';

export default function RootLayout({ children }) {
  return (
    <>
      <Script
        src="https://cdn.visitorintel.com/tracker.js"
        strategy="afterInteractive"
        data-site-id="${currentSite.siteId}"
        data-api-key="${currentSite.apiKey}"
      />
      {children}
    </>
  );
}` : ''

    return (
        <DashboardLayout currentSiteId={selectedSite || undefined}>
            <div className="p-8 max-w-7xl mx-auto">
                {/* Header */}
                <div className="mb-8">
                    <div className="flex items-center space-x-3 mb-2">
                        <div className="p-3 bg-gradient-to-br from-green-600 to-emerald-600 rounded-xl shadow-lg">
                            <Code className="w-8 h-8 text-white" />
                        </div>
                        <div>
                            <h1 className="text-4xl font-bold text-white">Tracking Code</h1>
                            <p className="text-gray-300 text-lg">
                                Install the tracking script on your website
                            </p>
                        </div>
                    </div>
                </div>

                {loading && (
                    <div className="text-center p-12 text-gray-400">
                        Loading sites...
                    </div>
                )}

                {error && (
                    <div className="bg-red-900/20 border border-red-500/30 text-red-300 px-4 py-3 rounded-lg mb-8">
                        Error loading sites: {error.message}
                    </div>
                )}

                {!loading && sites.length === 0 && (
                    <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-12 text-center">
                        <Globe className="w-20 h-20 text-gray-600 mx-auto mb-6" />
                        <h3 className="text-2xl font-bold text-white mb-3">No websites registered</h3>
                        <p className="text-gray-400 mb-8">
                            You need to add a website before you can get the tracking code
                        </p>
                        <button
                            onClick={() => router.push('/dashboard/sites')}
                            className="px-8 py-4 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-xl hover:from-purple-700 hover:to-pink-700 transition-all font-medium shadow-lg shadow-purple-500/30"
                        >
                            Add Your First Website
                        </button>
                    </div>
                )}

                {!loading && sites.length > 0 && (
                    <>
                        {/* Site Selector */}
                        <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-6 mb-8">
                            <h2 className="text-xl font-bold text-white mb-4">Select Website</h2>
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                {sites.map((site: any) => (
                                    <button
                                        key={site.id}
                                        onClick={() => setSelectedSite(site.siteId)}
                                        className={`p-4 rounded-xl transition-all text-left ${selectedSite === site.siteId
                                            ? 'bg-gradient-to-r from-purple-600/20 to-pink-600/20 border-2 border-purple-500'
                                            : 'bg-gray-800/50 border border-white/10 hover:bg-gray-800'
                                            }`}
                                    >
                                        <div className="flex items-center space-x-3 mb-2">
                                            <Globe className="w-5 h-5 text-purple-400" />
                                            <h3 className="font-semibold text-white">{site.name}</h3>
                                        </div>
                                        <p className="text-sm text-gray-400">{site.domain || 'No domain set'}</p>
                                    </button>
                                ))}
                            </div>
                        </div>

                        {currentSite && (
                            <>
                                {/* Info Banner */}
                                <div className="bg-blue-900/30 border border-blue-500/30 rounded-2xl p-6 mb-8 flex items-start space-x-4">
                                    <AlertCircle className="w-6 h-6 text-blue-400 flex-shrink-0 mt-1" />
                                    <div>
                                        <h3 className="text-lg font-bold text-white mb-2">Installation Instructions</h3>
                                        <ul className="text-sm text-gray-300 space-y-2">
                                            <li>• Copy the tracking code below</li>
                                            <li>• Paste it into the <code className="px-2 py-0.5 bg-gray-800 rounded">&lt;head&gt;</code> section of your website</li>
                                            <li>• The script loads asynchronously and won't affect page performance</li>
                                            <li>• Tracking will start immediately after installation</li>
                                        </ul>
                                    </div>
                                </div>

                                {/* Standard HTML Code */}
                                <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-6 mb-8">
                                    <div className="flex items-center justify-between mb-4">
                                        <h2 className="text-xl font-bold text-white">Standard HTML</h2>
                                        <button
                                            onClick={() => handleCopy(trackingCode, 'html')}
                                            className="px-4 py-2 bg-gradient-to-r from-purple-600/20 to-pink-600/20 border border-purple-500/50 text-purple-300 rounded-lg hover:from-purple-600/30 hover:to-pink-600/30 transition-all flex items-center space-x-2"
                                        >
                                            {copiedId === 'html' ? (
                                                <>
                                                    <Check className="w-4 h-4" />
                                                    <span>Copied!</span>
                                                </>
                                            ) : (
                                                <>
                                                    <Copy className="w-4 h-4" />
                                                    <span>Copy Code</span>
                                                </>
                                            )}
                                        </button>
                                    </div>
                                    <pre className="bg-gray-900 border border-gray-700 rounded-xl p-6 overflow-x-auto">
                                        <code className="text-sm text-gray-300 font-mono">{trackingCode}</code>
                                    </pre>
                                </div>

                                {/* React Code */}
                                <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-6 mb-8">
                                    <div className="flex items-center justify-between mb-4">
                                        <h2 className="text-xl font-bold text-white">React / Vue / Angular</h2>
                                        <button
                                            onClick={() => handleCopy(reactCode, 'react')}
                                            className="px-4 py-2 bg-gradient-to-r from-purple-600/20 to-pink-600/20 border border-purple-500/50 text-purple-300 rounded-lg hover:from-purple-600/30 hover:to-pink-600/30 transition-all flex items-center space-x-2"
                                        >
                                            {copiedId === 'react' ? (
                                                <>
                                                    <Check className="w-4 h-4" />
                                                    <span>Copied!</span>
                                                </>
                                            ) : (
                                                <>
                                                    <Copy className="w-4 h-4" />
                                                    <span>Copy Code</span>
                                                </>
                                            )}
                                        </button>
                                    </div>
                                    <pre className="bg-gray-900 border border-gray-700 rounded-xl p-6 overflow-x-auto">
                                        <code className="text-sm text-gray-300 font-mono">{reactCode}</code>
                                    </pre>
                                </div>

                                {/* Next.js Code */}
                                <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-6">
                                    <div className="flex items-center justify-between mb-4">
                                        <h2 className="text-xl font-bold text-white">Next.js</h2>
                                        <button
                                            onClick={() => handleCopy(nextJsCode, 'nextjs')}
                                            className="px-4 py-2 bg-gradient-to-r from-purple-600/20 to-pink-600/20 border border-purple-500/50 text-purple-300 rounded-lg hover:from-purple-600/30 hover:to-pink-600/30 transition-all flex items-center space-x-2"
                                        >
                                            {copiedId === 'nextjs' ? (
                                                <>
                                                    <Check className="w-4 h-4" />
                                                    <span>Copied!</span>
                                                </>
                                            ) : (
                                                <>
                                                    <Copy className="w-4 h-4" />
                                                    <span>Copy Code</span>
                                                </>
                                            )}
                                        </button>
                                    </div>
                                    <pre className="bg-gray-900 border border-gray-700 rounded-xl p-6 overflow-x-auto">
                                        <code className="text-sm text-gray-300 font-mono">{nextJsCode}</code>
                                    </pre>
                                </div>
                            </>
                        )}
                    </>
                )}
            </div>
        </DashboardLayout>
    )
}
