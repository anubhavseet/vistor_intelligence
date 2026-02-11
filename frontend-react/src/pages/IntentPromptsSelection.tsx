import { gql } from "@apollo/client"
import { useQuery } from "@apollo/client/react"
import { Sparkles, ArrowRight, Loader2 } from "lucide-react"
import { Link } from "react-router-dom"
import { cn } from "@/lib/utils"

const GET_SITES = gql`
  query GetSites {
    getSites {
      id
      siteId
      name
      domain
      isActive
    }
  }
`

export default function IntentPromptsSelection() {
    const { data, loading, error } = useQuery(GET_SITES, {
        fetchPolicy: "network-only"
    })

    if (loading) {
        return (
            <div className="flex h-[50vh] items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
        )
    }

    if (error) {
        return (
            <div className="flex h-[50vh] flex-col items-center justify-center text-center">
                <h3 className="text-lg font-semibold text-destructive">Error loading sites</h3>
                <p className="text-muted-foreground">{error.message}</p>
            </div>
        )
    }

    return (
        <div className="space-y-8 max-w-5xl mx-auto py-8">
            <div className="text-center space-y-4">
                <div className="inline-flex items-center justify-center p-3 rounded-2xl bg-gradient-to-br from-violet-500/20 to-fuchsia-500/20 mb-4">
                    <Sparkles className="w-8 h-8 text-violet-500" />
                </div>
                <h1 className="text-3xl font-bold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-violet-500 to-fuchsia-500">
                    Select a Project for AI Intent
                </h1>
                <p className="text-muted-foreground max-w-2xl mx-auto text-lg">
                    Choose a website to configure AI-powered intent prompts, behavioral triggers, and generated UI elements.
                </p>
            </div>

            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                {(data as any)?.getSites.map((site: any) => (
                    <Link
                        key={site.siteId}
                        to={`/dashboard/sites/${site.siteId}/prompts`}
                        className="group relative overflow-hidden rounded-xl border bg-card p-6 shadow-sm transition-all hover:shadow-lg hover:-translate-y-1 hover:border-violet-500/50 block"
                    >
                        <div className="absolute inset-0 bg-gradient-to-br from-violet-500/5 to-fuchsia-500/5 opacity-0 group-hover:opacity-100 transition-opacity" />

                        <div className="relative z-10">
                            <div className="flex items-center justify-between mb-4">
                                <div className={cn("h-3 w-3 rounded-full", site.isActive ? "bg-green-500 shadow-green-500/50 shadow-sm" : "bg-gray-300")} />
                                <ArrowRight className="w-5 h-5 text-muted-foreground group-hover:text-violet-500 transition-colors transform group-hover:translate-x-1" />
                            </div>

                            <h3 className="font-bold text-lg mb-1 group-hover:text-violet-500 transition-colors">{site.name}</h3>
                            <p className="text-sm text-muted-foreground mb-4 font-mono truncate">{site.domain || 'No domain configured'}</p>

                            <div className="flex items-center text-xs text-muted-foreground bg-muted/50 rounded-lg px-3 py-1 w-fit">
                                ID: {site.siteId.substring(0, 8)}...
                            </div>
                        </div>
                    </Link>
                ))}

                {(data as any)?.getSites.length === 0 && (
                    <div className="col-span-full text-center py-12 text-muted-foreground border-2 border-dashed rounded-xl">
                        No sites found. Please create a site first.
                    </div>
                )}
            </div>
        </div>
    )
}
