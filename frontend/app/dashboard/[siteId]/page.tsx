'use client'

import { useState } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import LiveVisitorMap from '@/components/LiveVisitorMap'
import BehaviorAnalytics from '@/components/BehaviorAnalytics'
import AccountIntelligence from '@/components/AccountIntelligence'
import AlertsDashboard from '@/components/AlertsDashboard'
import IntentStream from '@/components/IntentStream'

export default function DashboardPage() {
  const params = useParams()
  const siteId = params.siteId as string
  const [activeTab, setActiveTab] = useState<'map' | 'analytics' | 'accounts' | 'alerts' | 'intent'>('map')

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center space-x-8">
              <Link href="/" className="text-xl font-bold text-gray-900">
                Visitor Intelligence
              </Link>
              <div className="flex space-x-4">
                <button
                  onClick={() => setActiveTab('map')}
                  className={`px-4 py-2 rounded-lg ${activeTab === 'map'
                      ? 'bg-primary-600 text-white'
                      : 'text-gray-700 hover:bg-gray-100'
                    }`}
                >
                  Live Map
                </button>
                <button
                  onClick={() => setActiveTab('intent')}
                  className={`px-4 py-2 rounded-lg ${activeTab === 'intent'
                      ? 'bg-emerald-600 text-white shadow-md shadow-emerald-200'
                      : 'text-gray-700 hover:bg-gray-100'
                    }`}
                >
                  Intent Stream AI
                </button>
                <button
                  onClick={() => setActiveTab('analytics')}
                  className={`px-4 py-2 rounded-lg ${activeTab === 'analytics'
                      ? 'bg-primary-600 text-white'
                      : 'text-gray-700 hover:bg-gray-100'
                    }`}
                >
                  Analytics
                </button>
                <button
                  onClick={() => setActiveTab('accounts')}
                  className={`px-4 py-2 rounded-lg ${activeTab === 'accounts'
                      ? 'bg-primary-600 text-white'
                      : 'text-gray-700 hover:bg-gray-100'
                    }`}
                >
                  Accounts
                </button>
                <button
                  onClick={() => setActiveTab('alerts')}
                  className={`px-4 py-2 rounded-lg ${activeTab === 'alerts'
                      ? 'bg-primary-600 text-white'
                      : 'text-gray-700 hover:bg-gray-100'
                    }`}
                >
                  Alerts
                </button>
              </div>
            </div>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {activeTab === 'map' && <LiveVisitorMap siteId={siteId} />}
        {activeTab === 'intent' && <IntentStream siteId={siteId} />}
        {activeTab === 'analytics' && <BehaviorAnalytics siteId={siteId} />}
        {activeTab === 'accounts' && <AccountIntelligence siteId={siteId} />}
        {activeTab === 'alerts' && <AlertsDashboard siteId={siteId} />}
      </main>
    </div>
  )
}
