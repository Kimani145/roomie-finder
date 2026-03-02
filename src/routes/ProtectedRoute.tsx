import React from 'react'
import { Navigate } from 'react-router-dom'
import { useAuth } from '@/hooks/useAuth'

interface ProtectedRouteProps {
  children: React.ReactElement
  /** If true, skip the profile check (used for the onboarding route itself). */
  allowWithoutProfile?: boolean
}

/**
 * Three-tier route guard:
 *   Tier 1: !user                         → Redirect to /login
 *   Tier 2: user AND !user.emailVerified  → Redirect to /verify-email
 *   Tier 3: user AND verified AND !profile → Redirect to /onboarding
 *   Pass:   user AND verified AND profile  → Allow access
 */
export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({
  children,
  allowWithoutProfile = false,
}) => {
  const { user, loading, emailVerified, hasProfile } = useAuth()

  if (loading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <span className="text-sm text-slate-500">Loading...</span>
      </div>
    )
  }

  // Tier 1: No user at all
  if (!user) {
    return <Navigate to="/login" replace />
  }

  // Tier 2: Signed in but email not verified
  if (!emailVerified) {
    return <Navigate to="/verify-email" replace />
  }

  // Tier 3: Verified but no Firestore profile yet
  if (!allowWithoutProfile && !hasProfile) {
    return <Navigate to="/onboarding" replace />
  }

  // All tiers passed
  return children
}
