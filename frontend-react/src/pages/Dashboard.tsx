import { useEffect, useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { Plus, Globe, Activity, TrendingUp, Users, Zap, ArrowRight, Loader2 } from 'lucide-react'
import { AddSiteModal } from '@/components/sites/AddSiteModal'
import { useSites } from '@/hooks/use-sites'
import { useAuth } from '@/hooks/use-auth'
import { cn } from '@/lib/utils'

export default function DashboardPage() {
  const navigate = useNavigate()
  const { isAuthenticated, user } = useAuth()

  const [showAddModal, setShowAddModal] = useState(false)

  const { sites, loading, error, refetch } = useSites()

  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/')
    }
  }, [isAuthenticated, navigate])

  if (!isAuthenticated) {
    return null
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight">
          Welcome back, {user?.name || 'User'}! 👋
        </h1>
        <p className="text-muted-foreground text-lg">
          Here's what's happening with your visitor intelligence
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {[
          {
            label: 'Total Sites',
            value: sites.length,
            icon: Globe,
            gradient: 'from-purple-500 to-purple-600',
            change: '+2 this month', // Mock data
            changeColor: 'text-green-500'
          },
          {
            label: 'Active Visitors',
            value: '1,234',
            icon: Activity,
            gradient: 'from-blue-500 to-blue-600',
            change: '+12% from yesterday',
            changeColor: 'text-green-500'
          },
          {
            label: 'Total Pageviews',
            value: '45.2K',
            icon: TrendingUp,
            gradient: 'from-green-500 to-green-600',
            change: '+23% this week',
            changeColor: 'text-green-500'
          },
          {
            label: 'Identified Accounts',
            value: '892',
            icon: Users,
            gradient: 'from-pink-500 to-pink-600',
            change: '+156 this month',
            changeColor: 'text-green-500'
          },
        ].map((stat, idx) => (
          <div
            key={idx}
            className="group relative overflow-hidden rounded-xl border bg-card p-6 shadow-sm transition-all hover:shadow-md"
          >
            <div className="flex items-center justify-between mb-4">
              <div className={cn("p-2 rounded-lg bg-gradient-to-br text-white shadow-sm", stat.gradient)}>
                <stat.icon className="w-5 h-5" />
              </div>
            </div>
            <div>
              <p className="text-muted-foreground text-sm font-medium mb-1">{stat.label}</p>
              <h3 className="text-2xl font-bold mb-1">{stat.value}</h3>
              <p className={cn("text-xs font-medium", stat.changeColor)}>{stat.change}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Add New Site Card */}
        <button
          onClick={() => setShowAddModal(true)}
          className="group relative flex flex-col items-start overflow-hidden rounded-xl border bg-card p-8 text-left shadow-sm transition-all hover:border-primary/50 hover:shadow-md"
        >
          <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
            <Plus className="w-24 h-24 text-primary" />
          </div>

          <div className="mb-4 rounded-full bg-primary/10 p-3 text-primary group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
            <Plus className="w-6 h-6" />
          </div>

          <h3 className="text-xl font-semibold mb-2">Add New Website</h3>
          <p className="text-muted-foreground mb-4 max-w-sm">
            Register a new site to start tracking visitor intelligence and behavior
          </p>

          <div className="mt-auto flex items-center text-sm font-medium text-primary group-hover:translate-x-1 transition-transform">
            Get Started <ArrowRight className="w-4 h-4 ml-1" />
          </div>
        </button>

        {/* Start Crawling Card */}
        <Link
          to="/dashboard/crawling"
          className="group relative flex flex-col items-start overflow-hidden rounded-xl border bg-card p-8 text-left shadow-sm transition-all hover:border-blue-500/50 hover:shadow-md"
        >
          <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
            <Zap className="w-24 h-24 text-blue-500" />
          </div>

          <div className="mb-4 rounded-full bg-blue-500/10 p-3 text-blue-600 group-hover:bg-blue-600 group-hover:text-white transition-colors">
            <Zap className="w-6 h-6" />
          </div>

          <h3 className="text-xl font-semibold mb-2">Website Crawling</h3>
          <p className="text-muted-foreground mb-4 max-w-sm">
            Crawl and index your website content for AI-powered insights
          </p>

          <div className="mt-auto flex items-center text-sm font-medium text-blue-600 group-hover:translate-x-1 transition-transform">
            View Crawler <ArrowRight className="w-4 h-4 ml-1" />
          </div>
        </Link>
      </div>

      {/* Recent Sites */}
      <div className="rounded-xl border bg-card shadow-sm">
        <div className="flex items-center justify-between p-6 border-b">
          <h2 className="text-lg font-semibold">Your Websites</h2>
          <Link
            to="/dashboard/sites"
            className="text-sm font-medium text-primary hover:text-primary/80 flex items-center transition-colors"
          >
            View All <ArrowRight className="w-4 h-4 ml-1" />
          </Link>
        </div>

        <div className="p-6">
          {loading && (
            <div className="flex justify-center p-8">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          )}

          {error && (
            <div className="rounded-md bg-destructive/10 p-4 text-sm text-destructive">
              Error loading sites: {error.message}
            </div>
          )}

          {!loading && !error && sites.length === 0 && (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <div className="rounded-full bg-muted p-4 mb-4">
                <Globe className="w-8 h-8 text-muted-foreground" />
              </div>
              <h3 className="font-semibold text-lg mb-1">No websites yet</h3>
              <p className="text-muted-foreground mb-4">Get started by adding your first website</p>
              <button
                onClick={() => setShowAddModal(true)}
                className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
              >
                Add Your First Site
              </button>
            </div>
          )}

          {!loading && sites.length > 0 && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {sites.slice(0, 6).map((site: any) => (
                <Link
                  key={site.id}
                  to={`/dashboard/${site.siteId}`}
                  className="group block rounded-lg border p-4 hover:bg-accent transition-colors"
                >
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <div className="p-2 rounded bg-primary/10 text-primary">
                        <Globe className="w-4 h-4" />
                      </div>
                      <span className="font-medium truncate">{site.name}</span>
                    </div>
                    <span className={cn("inline-block h-2 w-2 rounded-full", site.isActive ? "bg-green-500" : "bg-gray-300")} />
                  </div>
                  <div className="text-sm text-muted-foreground truncate pl-10">
                    {site.domain || 'No domain'}
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Add Site Modal */}
      <AddSiteModal
        isOpen={showAddModal}
        onClose={() => setShowAddModal(false)}
        onSuccess={() => {
          refetch()
          setShowAddModal(false)
        }}
      />
    </div>
  )
}
