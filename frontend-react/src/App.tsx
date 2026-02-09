import { Routes, Route, Navigate } from 'react-router-dom'
import { useAuth } from '@/hooks/use-auth'
import { ApolloProvider } from '@apollo/client/react'
import { client } from '@/lib/apollo-client'
import { ThemeProvider } from '@/components/theme-provider'
import { Layout } from '@/components/layout/Layout'
import { ToastContainer } from 'react-toastify'
import 'react-toastify/dist/ReactToastify.css'

// Public Pages
import LandingPage from '@/pages/Landing'
import LoginPage from '@/pages/Login'
import RegisterPage from '@/pages/Register'
import PrivacyPolicyPage from '@/pages/PrivacyPolicy'
import TermsOfServicePage from '@/pages/TermsOfService'
import AboutPage from '@/pages/About'

// Dashboard Pages
import DashboardPage from '@/pages/Dashboard'
import SitesPage from '@/pages/Sites'
import SiteOverviewPage from '@/pages/SiteOverview'
import SiteSettingsPage from '@/pages/SiteSettings'
import CrawlingPage from '@/pages/Crawling'
import TrackingCodePage from '@/pages/TrackingCode'
import IntegrationsPage from '@/pages/Integrations'
import ReportsPage from '@/pages/Reports'
import SettingsPage from '@/pages/Settings'
import SiteDetailPage from '@/pages/SiteDetail'
import SiteAnalyticsListPage from '@/pages/dashboard/SiteAnalyticsList'
import IntentPromptsPage from '@/pages/IntentPromptsPage'
import IntentPromptsSelectionPage from '@/pages/IntentPromptsSelection'
import UsersPage from '@/pages/UsersPage'

//ProtectedRoute wrapper
function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated } = useAuth()

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />
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
          <Route path="/" element={<LandingPage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route path="/privacy" element={<PrivacyPolicyPage />} />
          <Route path="/terms" element={<TermsOfServicePage />} />
          <Route path="/about" element={<AboutPage />} />

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
            <Route path="sites/:siteId/prompts" element={<IntentPromptsPage />} />
            <Route path="intent-prompts" element={<IntentPromptsSelectionPage />} />
            <Route path="crawling" element={<CrawlingPage />} />
            <Route path="site-analytics" element={<SiteAnalyticsListPage />} />
            <Route path="tracking-code" element={<TrackingCodePage />} />
            <Route path="integrations" element={<IntegrationsPage />} />
            <Route path="reports" element={<ReportsPage />} />
            <Route path="settings" element={<SettingsPage />} />
            <Route path="users" element={<UsersPage />} />
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
