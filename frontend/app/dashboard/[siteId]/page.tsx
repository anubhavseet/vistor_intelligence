'use client'

import { useState } from 'react'
import { useParams } from 'next/navigation'
import DashboardLayout from '@/components/DashboardLayout'
import LiveVisitorMap from '@/components/LiveVisitorMap'
import BehaviorAnalytics from '@/components/BehaviorAnalytics'
import AccountIntelligence from '@/components/AccountIntelligence'
import AlertsDashboard from '@/components/AlertsDashboard'
import IntentStream from '@/components/IntentStream'
import { Activity, TrendingUp, Users, Bell, Sparkles } from 'lucide-react'

export default function SiteDetailPage() {
  const params = useParams()
  const siteId = params.siteId as string
  const [activeTab, setActiveTab] = useState<'map' | 'analytics' | 'accounts' | 'alerts' | 'intent'>('map')

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
    },
  ]

  return (
    <DashboardLayout currentSiteId={siteId}>
      <div className="p-8">
        {/* Tab Navigation */}
        <div className="mb-8 bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-2 flex flex-wrap gap-2">
          {tabs.map((tab) => {
            const Icon = tab.icon
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center space-x-3 px-6 py-3 rounded-xl transition-all ${activeTab === tab.id
                    ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white shadow-lg shadow-purple-500/30'
                    : 'text-gray-400 hover:text-white hover:bg-white/5'
                  }`}
              >
                <Icon className="w-5 h-5" />
                <div className="text-left">
                  <div className="font-medium text-sm">{tab.label}</div>
                  {activeTab === tab.id && (
                    <div className="text-xs opacity-80">{tab.description}</div>
                  )}
                </div>
              </button>
            )
          })}
        </div>

        {/* Tab Content */}
        <div className="animate-fade-in">
          {activeTab === 'map' && <LiveVisitorMap siteId={siteId} />}
          {activeTab === 'intent' && <IntentStream siteId={siteId} />}
          {activeTab === 'analytics' && <BehaviorAnalytics siteId={siteId} />}
          {activeTab === 'accounts' && <AccountIntelligence siteId={siteId} />}
          {activeTab === 'alerts' && <AlertsDashboard siteId={siteId} />}
        </div>
      </div>

      <style jsx>{`
        @keyframes fade-in {
          from {
            opacity: 0;
            transform: translateY(10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        .animate-fade-in {
          animation: fade-in 0.3s ease-out;
        }
      `}</style>
    </DashboardLayout>
  )
}
