import React from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AppLayout } from '@/components/layout'
import { AuthProvider } from '@/context/AuthContext'
import { ProtectedRoute } from '@/routes/ProtectedRoute'
import {
  LandingPage,
  SignUpPage,
  LoginPage,
  VerifyEmailPage,
  OnboardingPage,
  DiscoveryPage,
  ProfilePage,
  ProfileDetailPage,
  MatchesPage,
  ChatPage,
} from '@/pages'

const App: React.FC = () => {
  console.info('[App.tsx] Routing initialized');
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          {/* Public routes */}
          <Route path="/" element={<LandingPage />} />
          <Route path="/signup" element={<SignUpPage />} />
          <Route path="/login" element={<LoginPage />} />
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
              <ProtectedRoute>
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
                  <MatchesPage />
                </AppLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/chat/:matchId"
            element={
              <ProtectedRoute>
                <ChatPage />
              </ProtectedRoute>
            }
          />

          {/* Fallback */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  )
}

export default App
