import React, { useEffect, Suspense } from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { Toaster } from 'react-hot-toast'
import { AppLayout, AdminLayout } from '@/components/layout'
import { MatchOverlay } from '@/components/ui/MatchOverlay'
import GlobalListeners from '@/components/GlobalListeners'
import SplashScreen from '@/components/ui/SplashScreen'
import { AuthProvider } from '@/context/AuthContext'
import { ThemeProvider } from '@/context/ThemeContext'
import { useAuth } from '@/hooks/useAuth'
import { ProtectedRoute } from '@/routes/ProtectedRoute'
import { AdminRoute } from '@/routes/AdminRoute'
import { useAuthStore } from '@/store/authStore'
import ErrorBoundary from '@/components/ErrorBoundary'

// Eagerly loaded auth/landing routes to keep first-paint latency low
import SignUpPage from '@/pages/SignUpPage'
import LoginPage from '@/pages/LoginPage'
import ForgotPasswordPage from '@/pages/ForgotPasswordPage'
import VerifyEmailPage from '@/pages/VerifyEmailPage'
import OnboardingPage from '@/pages/OnboardingPage'
import DiscoveryPage from '@/pages/DiscoveryPage'
import { logger } from '@/utils/logger'

// Lazily loaded heavier/dashboard pages, directly imported to bypass index.ts barrel footgun
const AdminDashboardPage = React.lazy(() => import('@/pages/AdminDashboardPage'))
const UserManagementPage = React.lazy(() => import('@/pages/admin/UserManagementPage'))
const ModerationPage = React.lazy(() => import('@/pages/admin/ModerationPage'))
const MessagesPage = React.lazy(() => import('@/pages/MessagesPage'))
const ListingWizardPage = React.lazy(() => import('@/pages/ListingWizardPage'))
const ProfilePage = React.lazy(() => import('@/pages/ProfilePage'))
const EditProfilePage = React.lazy(() => import('@/pages/EditProfilePage'))
const ProfileDetailPage = React.lazy(() => import('@/pages/ProfileDetailPage'))
const MatchesPage = React.lazy(() => import('@/pages/MatchesPage'))
const NotificationsPage = React.lazy(() => import('@/pages/NotificationsPage'))
const MyListingsPage = React.lazy(() => import('@/pages/MyListingsPage'))
const ListingDetailPage = React.lazy(() => import('@/pages/ListingDetailPage'))
const SecurityPage = React.lazy(() => import('@/pages/SecurityPage'))
const Verify2faPage = React.lazy(() => import('@/pages/Verify2faPage'))

const AppRoutes: React.FC = () => {
  const { loading } = useAuth()
  const { currentUser, pendingAction, clearPendingAction } = useAuthStore()

  useEffect(() => {
    if (!currentUser || !pendingAction) return

    pendingAction()
    clearPendingAction()
  }, [currentUser, pendingAction, clearPendingAction])

  if (loading) {
    return <SplashScreen />
  }

  logger.info('[App.tsx] Routing initialized')
  return (
    <div className="app-shell-surface min-h-screen dark:text-slate-50">
      <BrowserRouter>
        <Toaster
          position="top-right"
          toastOptions={{
            className:
              'font-syne text-sm rounded-xl shadow-lg dark:bg-slate-800 dark:text-white border border-slate-100 dark:border-slate-700',
          }}
        />
        <GlobalListeners />
        <Suspense fallback={<SplashScreen />}>
          <Routes>
          {/* Public routes */}
          <Route path="/" element={<Navigate to="/discover" replace />} />
          <Route path="/signup" element={<SignUpPage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/forgot-password" element={<ForgotPasswordPage />} />
          <Route path="/verify-email" element={<VerifyEmailPage />} />

          {/* Onboarding (verified but no profile yet — no app layout) */}
          <Route
            path="/onboarding"
            element={
              <ProtectedRoute allowWithoutProfile>
                <OnboardingPage />
              </ProtectedRoute>
            }
          />

          {/* Discovery */}
          <Route
            path="/discover"
            element={
              <ProtectedRoute allowGuest>
                <AppLayout>
                  <DiscoveryPage />
                </AppLayout>
              </ProtectedRoute>
            }
          />

          {/* Other routes */}
          <Route
            path="/profile"
            element={
              <ProtectedRoute>
                <AppLayout>
                  <ProfilePage />
                </AppLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/edit-profile"
            element={
              <ProtectedRoute>
                <AppLayout>
                  <EditProfilePage />
                </AppLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/profile/:uid"
            element={
              <ProtectedRoute>
                <ProfileDetailPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/matches"
            element={
              <ProtectedRoute>
                <AppLayout>
                  <MatchesPage />
                </AppLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/messages/:matchId?"
            element={
              <ProtectedRoute>
                <AppLayout>
                  <MessagesPage />
                </AppLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/notifications"
            element={
              <ProtectedRoute>
                <AppLayout>
                  <NotificationsPage />
                </AppLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/listing/:listingId"
            element={
              <ProtectedRoute>
                <AppLayout>
                  <ListingDetailPage />
                </AppLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/create-listing"
            element={
              <ProtectedRoute>
                <AppLayout>
                  <ListingWizardPage />
                </AppLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/my-listings"
            element={
              <ProtectedRoute>
                <AppLayout>
                  <MyListingsPage />
                </AppLayout>
              </ProtectedRoute>
            }
          />

          {/* Admin Routes */}
          <Route
            path="/admin"
            element={
              <AdminRoute>
                <AdminLayout>
                  <AdminDashboardPage />
                </AdminLayout>
              </AdminRoute>
            }
          />
          <Route
            path="/admin/user-management"
            element={
              <AdminRoute>
                <AdminLayout>
                  <UserManagementPage />
                </AdminLayout>
              </AdminRoute>
            }
          />
          <Route
            path="/admin/moderation"
            element={
              <AdminRoute>
                <AdminLayout>
                  <ModerationPage />
                </AdminLayout>
              </AdminRoute>
            }
          />
          <Route
            path="/admin/users"
            element={
              <AdminRoute>
                <AdminLayout>
                  <UserManagementPage />
                </AdminLayout>
              </AdminRoute>
            }
          />
          <Route
            path="/admin/moderation"
            element={
              <AdminRoute>
                <AdminLayout>
                  <ModerationPage />
                </AdminLayout>
              </AdminRoute>
            }
          />

          {/* Security & 2FA Routes */}
          <Route
            path="/security"
            element={
              <ProtectedRoute>
                <AppLayout>
                  <SecurityPage />
                </AppLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/verify-2fa"
            element={
              <ProtectedRoute is2faPage>
                <Verify2faPage />
              </ProtectedRoute>
            }
          />

          {/* Fallback */}
          <Route path="*" element={<Navigate to="/discover" replace />} />
          </Routes>
        </Suspense>
        <MatchOverlay />
      </BrowserRouter>
    </div>
  )
}

const App: React.FC = () => {
  return (
    <ErrorBoundary>
      <AuthProvider>
        <ThemeProvider>
          <AppRoutes />
        </ThemeProvider>
      </AuthProvider>
    </ErrorBoundary>
  )
}

export default App
