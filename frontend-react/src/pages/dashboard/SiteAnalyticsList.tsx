import { gql } from "@apollo/client"
import { useQuery } from "@apollo/client/react"
import { BarChart3, Globe, Loader2, ArrowRight } from "lucide-react"
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
      createdAt
    }
  }
`

export default function SiteAnalyticsListPage() {
    const { data, loading, error } = useQuery<any>(GET_SITES, {
        fetchPolicy: "network-only"
    })

    if (error) {
        return (
            <div className="flex h-[50vh] flex-col items-center justify-center text-center">
                <h3 className="text-lg font-semibold text-destructive">Error loading sites</h3>
                <p className="text-muted-foreground">{error.message}</p>
            </div>
        )
    }

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-3xl font-bold tracking-tight">Site Analytics</h1>
                <p className="text-muted-foreground">Select a website to view detailed analytics and reports.</p>
            </div>

            {loading ? (
                <div className="flex h-64 items-center justify-center">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                </div>
            ) : (
                <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                    {data?.getSites.length === 0 ? (
                        <div className="col-span-full flex h-64 flex-col items-center justify-center rounded-lg border border-dashed bg-card/50 p-8 text-center text-muted-foreground">
                            <BarChart3 className="h-12 w-12 opacity-50 mb-4" />
                            <p>No websites found. Add a website to see analytics.</p>
                        </div>
                    ) : (
                        data?.getSites.map((site: any) => (
                            <Link
                                key={site.siteId}
                                to={`/dashboard/${site.siteId}?tab=analytics`}
                                className="group relative overflow-hidden rounded-lg border bg-card p-6 shadow-sm transition-all hover:shadow-md hover:border-primary/50"
                            >
                                <div className="flex items-center justify-between mb-4">
                                    <div className="p-2 bg-primary/10 rounded-lg group-hover:bg-primary/20 transition-colors">
                                        <BarChart3 className="w-5 h-5 text-primary" />
                                    </div>
                                    <div className={cn("h-2 w-2 rounded-full", site.isActive ? "bg-green-500" : "bg-gray-300")} />
                                </div>

                                <div className="space-y-1 mb-4">
                                    <h3 className="font-semibold leading-none tracking-tight group-hover:text-primary transition-colors">{site.name}</h3>
                                    <p className="text-sm text-muted-foreground flex items-center gap-1">
                                        <Globe className="w-3 h-3" />
                                        {site.domain}
                                    </p>
                                </div>

                                <div className="flex items-center text-sm font-medium text-primary opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 transition-all">
                                    View Analytics <ArrowRight className="ml-1 w-4 h-4" />
                                </div>
                            </Link>
                        ))
                    )}
                </div>
            )}
        </div>
    )
}
