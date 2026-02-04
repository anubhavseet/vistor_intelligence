import { Routes, Route, Navigate } from 'react-router-dom'
import { useAuth } from '@/hooks/use-auth'
import { ApolloProvider } from '@apollo/client/react'
import { client } from '@/lib/apollo-client'
import { ThemeProvider } from '@/components/theme-provider'
import { Layout } from '@/components/layout/Layout'
import { ToastContainer } from 'react-toastify'
import 'react-toastify/dist/ReactToastify.css'

// Pages
import HomePage from '@/pages/Home'
import DashboardPage from '@/pages/Dashboard'
import SitesPage from '@/pages/Sites'
import SiteOverviewPage from '@/pages/SiteOverview'
import SiteSettingsPage from '@/pages/SiteSettings'
import CrawlingPage from '@/pages/Crawling'
import TrackingCodePage from '@/pages/TrackingCode'
import IntegrationsPage from '@/pages/Integrations'
import ReportsPage from '@/pages/Reports'
import SettingsPage from '@/pages/Settings'
// SiteDetailPage seems redundant with SiteOverviewPage or distinct? keeping for now.
import SiteDetailPage from '@/pages/SiteDetail'
import SiteAnalyticsListPage from '@/pages/dashboard/SiteAnalyticsList'

//ProtectedRoute wrapper
function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated } = useAuth()

  if (!isAuthenticated) {
    return <Navigate to="/" replace />
  }

  return <>{children}</>
}

function App() {
  return (
    <ApolloProvider client={client}>
      <ThemeProvider defaultTheme="dark" storageKey="vite-ui-theme">
        <ToastContainer theme="dark" position="bottom-right" />
        <Routes>
          {/* Public Routes */}
          <Route path="/" element={<HomePage />} />

          {/* Protected Dashboard Routes */}
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute>
                <Layout />
              </ProtectedRoute>
            }
          >
            <Route index element={<DashboardPage />} />
            <Route path="sites" element={<SitesPage />} />
            <Route path="sites/:siteId" element={<SiteOverviewPage />} />
            <Route path="sites/:siteId/settings" element={<SiteSettingsPage />} />
            <Route path="crawling" element={<CrawlingPage />} />
            <Route path="site-analytics" element={<SiteAnalyticsListPage />} />
            <Route path="tracking-code" element={<TrackingCodePage />} />
            <Route path="integrations" element={<IntegrationsPage />} />
            <Route path="reports" element={<ReportsPage />} />
            <Route path="settings" element={<SettingsPage />} />
            <Route path=":siteId" element={<SiteDetailPage />} />
          </Route>

          {/* Catch-all route */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </ThemeProvider>
    </ApolloProvider>
  )
}

export default App
