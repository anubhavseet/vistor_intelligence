import { useState } from "react"
import { gql } from "@apollo/client"
import { Plus, ExternalLink, Globe, Loader2 } from "lucide-react"
import { Link } from "react-router-dom"
import { AddSiteModal } from "../components/sites/AddSiteModal"
import { cn } from "../lib/utils"
import { useQuery } from "@apollo/client/react"

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

export default function SitesPage() {
    const [isModalOpen, setIsModalOpen] = useState(false)
    const { data, loading, error, refetch } = useQuery(GET_SITES, {
        fetchPolicy: "network-only"
    })

    // Mock data if backend is not reachable/empty for demo purposes
    if (error) {
        return (
            <div className="flex h-[50vh] flex-col items-center justify-center text-center">
                <h3 className="text-lg font-semibold text-destructive">Error loading sites</h3>
                <p className="text-muted-foreground">{error.message}</p>
                <button
                    onClick={() => refetch()}
                    className="mt-4 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
                >
                    Try Again
                </button>
            </div>
        )
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Websites</h1>
                    <p className="text-muted-foreground">Manage your tracked websites and configurations.</p>
                </div>
                <button
                    onClick={() => setIsModalOpen(true)}
                    className="flex items-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground shadow hover:bg-primary/90"
                >
                    <Plus className="mr-2 h-4 w-4" />
                    Add Website
                </button>
            </div>

            {loading ? (
                <div className="flex h-64 items-center justify-center">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                </div>
            ) : (
                <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                    {data?.getSites.length === 0 ? (
                        <div className="col-span-full flex h-64 flex-col items-center justify-center rounded-lg border border-dashed bg-card/50 p-8 text-center text-muted-foreground">
                            <Globe className="h-12 w-12 opacity-50 mb-4" />
                            <p>No websites found. Add your first website to get started.</p>
                        </div>
                    ) : (
                        data?.getSites.map((site: any) => (
                            <div key={site.siteId} className="group relative overflow-hidden rounded-lg border bg-card p-6 shadow-sm transition-all hover:shadow-md">
                                <div className="flex items-center justify-between">
                                    <div className="space-y-1">
                                        <h3 className="font-semibold leading-none tracking-tight">{site.name}</h3>
                                        <p className="text-sm text-muted-foreground">{site.domain}</p>
                                    </div>
                                    <div className={cn("h-2 w-2 rounded-full", site.isActive ? "bg-green-500" : "bg-gray-300")} />
                                </div>

                                <div className="mt-4 flex items-center justify-between">
                                    <span className="text-xs text-muted-foreground">ID: {site.siteId.substring(0, 8)}...</span>
                                    <span className="text-xs text-muted-foreground">Added: {new Date(site.createdAt).toLocaleDateString()}</span>
                                </div>

                                <div className="mt-6 flex gap-2">
                                    <Link
                                        to={`/dashboard/sites/${site.siteId}`}
                                        className="flex-1 rounded-md bg-secondary px-3 py-2 text-center text-sm font-medium text-secondary-foreground hover:bg-secondary/80"
                                    >
                                        Dashboard
                                    </Link>
                                    <Link
                                        to={`/dashboard/sites/${site.siteId}/settings`}
                                        className="flex-1 rounded-md border border-input px-3 py-2 text-center text-sm font-medium hover:bg-accent hover:text-accent-foreground"
                                    >
                                        Settings
                                    </Link>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            )}

            <AddSiteModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                onSuccess={() => refetch()}
            />
        </div>
    )
}
