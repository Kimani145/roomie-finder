import ModerationPage from '@/pages/admin/ModerationPage'
import UserManagementPage from '@/pages/admin/UserManagementPage'
import React, { useEffect } from 'react'
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
import AdminDashboardPage from '@/pages/AdminDashboardPage'
import {
  SignUpPage,
  LoginPage,
  VerifyEmailPage,
  OnboardingPage,
  DiscoveryPage,
  ProfilePage,
  EditProfilePage,
  ProfileDetailPage,
  MatchesPage,
  MessagesPage,
  ChatPage,
  NotificationsPage,
  ListingWizardPage,
  MyListingsPage,
  ListingDetailPage,
  ForgotPasswordPage,
} from '@/pages'

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

  console.info('[App.tsx] Routing initialized')
  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 dark:text-slate-50">
      <BrowserRouter>
        <Toaster
          position="top-right"
          toastOptions={{
            className:
              'font-syne text-sm rounded-xl shadow-lg dark:bg-slate-800 dark:text-white border border-slate-100 dark:border-slate-700',
          }}
        />
        <GlobalListeners />
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
            path="/messages"
            element={
              <ProtectedRoute>
                <AppLayout>
                  <MessagesPage />
                </AppLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/chat/:matchId"
            element={
              <ProtectedRoute>
                <AppLayout>
                  <ChatPage />
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

          {/* Fallback */}
          <Route path="*" element={<Navigate to="/discover" replace />} />
        </Routes>
        <MatchOverlay />
      </BrowserRouter>
    </div>
  )
}

const App: React.FC = () => {
  return (
    <AuthProvider>
      <ThemeProvider>
        <AppRoutes />
      </ThemeProvider>
    </AuthProvider>
  )
}

export default App
