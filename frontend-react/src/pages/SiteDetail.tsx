import { useState } from 'react'
import { useParams, useSearchParams } from 'react-router-dom'
import LiveVisitorMap from '@/components/LiveVisitorMap'
import BehaviorAnalytics from '@/components/BehaviorAnalytics'
import AccountIntelligence from '@/components/AccountIntelligence'
import AlertsDashboard from '@/components/AlertsDashboard'
import IntentStream from '@/components/IntentStream'
import { Activity, TrendingUp, Users, Bell, Sparkles } from 'lucide-react'
import { cn } from '@/lib/utils'

export default function SiteDetailPage() {
  const { siteId } = useParams<{ siteId: string }>()
  const [searchParams, setSearchParams] = useSearchParams()
  const tabParam = searchParams.get('tab') as 'map' | 'analytics' | 'accounts' | 'alerts' | 'intent' | null

  const [activeTab, setActiveTab] = useState<'map' | 'analytics' | 'accounts' | 'alerts' | 'intent'>(
    tabParam && ['map', 'intent', 'analytics', 'accounts', 'alerts'].includes(tabParam)
      ? tabParam
      : 'map'
  )

  const handleTabChange = (tabId: typeof activeTab) => {
    setActiveTab(tabId)
    setSearchParams({ tab: tabId })
  }

  const tabs = [
    {
      id: 'map' as const,
      label: 'Live Map',
      icon: Activity,
      description: 'Real-time visitor tracking'
    },
    {
      id: 'intent' as const,
      label: 'Intent Stream',
      icon: Sparkles,
      description: 'AI-powered insights'
    },
    {
      id: 'analytics' as const,
      label: 'Analytics',
      icon: TrendingUp,
      description: 'Behavior analytics'
    },
    {
      id: 'accounts' as const,
      label: 'Accounts',
      icon: Users,
      description: 'Visitor intelligence'
    },
    {
      id: 'alerts' as const,
      label: 'Alerts',
      icon: Bell,
      description: 'Notifications'
    }]

  return (
    <div className="space-y-6">
      {/* Tab Navigation */}
      <div className="rounded-lg border bg-card text-card-foreground shadow-sm p-1.5 flex flex-wrap gap-1">
        {tabs.map((tab) => {
          const Icon = tab.icon
          const isActive = activeTab === tab.id
          return (
            <button
              key={tab.id}
              onClick={() => handleTabChange(tab.id)}
              className={cn(
                "flex items-center space-x-2 px-4 py-2 rounded-md transition-all text-sm font-medium",
                isActive
                  ? "bg-primary text-primary-foreground shadow-sm"
                  : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
              )}
            >
              <Icon className="w-4 h-4" />
              <div className="text-left">
                <div>{tab.label}</div>
              </div>
            </button>
          )
        })}
      </div>

      {/* Tab Content */}
      <div className="animate-in fade-in slide-in-from-bottom-2 duration-300">
        {activeTab === 'map' && <LiveVisitorMap siteId={siteId || ''} />}
        {activeTab === 'intent' && <IntentStream siteId={siteId || ''} />}
        {activeTab === 'analytics' && <BehaviorAnalytics siteId={siteId || ''} />}
        {activeTab === 'accounts' && <AccountIntelligence siteId={siteId || ''} />}
        {activeTab === 'alerts' && <AlertsDashboard siteId={siteId || ''} />}
      </div>
    </div>
  )
}
