import { useState } from 'react'

interface AlertsDashboardProps {
  siteId: string
}

export default function AlertsDashboard({ siteId }: AlertsDashboardProps) {
  const [alerts] = useState([
    {
      id: 1,
      type: 'high_intent',
      message: 'New high-intent account detected: Acme Corp',
      timestamp: new Date(),
      severity: 'high',
    },
    {
      id: 2,
      type: 'traffic_spike',
      message: 'Traffic spike detected: 150% increase in last hour',
      timestamp: new Date(Date.now() - 3600000),
      severity: 'medium',
    }])

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-6">Alerts & Notifications</h2>

        <div className="space-y-4">
          {alerts.length === 0 ? (
            <p className="text-gray-500">No alerts at this time.</p>
          ) : (
            alerts.map((alert) => (
              <div
                key={alert.id}
                className={`p-4 rounded-lg border-l-4 ${
                  alert.severity === 'high'
                    ? 'bg-red-50 border-red-500'
                    : alert.severity === 'medium'
                    ? 'bg-yellow-50 border-yellow-500'
                    : 'bg-blue-50 border-blue-500'
                }`}
              >
                <div className="flex justify-between items-start">
                  <div>
                    <p className="font-semibold text-gray-900">{alert.message}</p>
                    <p className="text-sm text-gray-500 mt-1">
                      {alert.timestamp.toLocaleString()}
                    </p>
                  </div>
                  <button className="text-gray-400 hover:text-gray-600">×</button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Alert Settings</h3>
        <p className="text-gray-600 mb-4">
          Configure webhooks and email notifications for high-intent accounts and traffic spikes.
        </p>
        <div className="space-y-3">
          <label className="flex items-center">
            <input type="checkbox" className="mr-2" />
            <span>Email notifications for high-intent accounts</span>
          </label>
          <label className="flex items-center">
            <input type="checkbox" className="mr-2" />
            <span>Slack webhook for traffic spikes</span>
          </label>
          <label className="flex items-center">
            <input type="checkbox" className="mr-2" />
            <span>Real-time browser notifications</span>
          </label>
        </div>
      </div>
    </div>
  )
}
