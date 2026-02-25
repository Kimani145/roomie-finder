import React from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { useAuthListener } from '@/hooks/useAuthListener'
import { AppLayout } from '@/components/layout'
import {
  LandingPage,
  OnboardingPage,
  DiscoveryPage,
  ProfilePage,
  MatchesPage,
  ChatPage,
} from '@/pages'

// ─── DEV MODE: Auth guards temporarily disabled ────────────────────────────────
// This allows you to test the Discovery feed without Firebase authentication
// REMOVE THIS IN PRODUCTION and restore the PrivateRoute/PublicOnlyRoute guards
// ───────────────────────────────────────────────────────────────────────────────

const App: React.FC = () => {
  useAuthListener()

  return (
    <BrowserRouter>
      <Routes>
        {/* Landing */}
        <Route path="/" element={<LandingPage />} />

        {/* Onboarding (no layout) */}
        <Route path="/onboarding" element={<OnboardingPage />} />

        {/* Discovery - NO AUTH GUARD (for testing) */}
        <Route
          path="/discover"
          element={
            <AppLayout>
              <DiscoveryPage />
            </AppLayout>
          }
        />

        {/* Other routes */}
        <Route
          path="/profile"
          element={
            <AppLayout>
              <ProfilePage />
            </AppLayout>
          }
        />
        <Route
          path="/profile/:uid"
          element={
            <AppLayout>
              <ProfilePage />
            </AppLayout>
          }
        />
        <Route
          path="/matches"
          element={
            <AppLayout>
              <MatchesPage />
            </AppLayout>
          }
        />
        <Route
          path="/messages"
          element={
            <AppLayout>
              <MatchesPage />
            </AppLayout>
          }
        />
        <Route path="/chat/:matchId" element={<ChatPage />} />

        {/* Fallback */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  )
}

export default App
