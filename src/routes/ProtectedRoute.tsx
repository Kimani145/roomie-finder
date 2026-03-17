import React, { useEffect, useState } from 'react'
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
  const { user, loading, emailVerified, hasProfile, reloadUser } = useAuth()
  const [checkingClaims, setCheckingClaims] = useState(false)
  const [tokenEmailVerified, setTokenEmailVerified] = useState<boolean | null>(null)

  useEffect(() => {
    const forceCheck = async () => {
      const currentUser = user

      if (!currentUser) {
        setTokenEmailVerified(null)
        return
      }

      setCheckingClaims(true)

      try {
        const verified = await reloadUser('ROUTE')
        setTokenEmailVerified(verified)
      } catch (error) {
        console.error('ProtectedRoute token refresh failed:', error)
        setTokenEmailVerified(currentUser.emailVerified)
      } finally {
        setCheckingClaims(false)
      }
    }

    forceCheck()
  }, [user, reloadUser])

  const resolvedEmailVerified = tokenEmailVerified ?? emailVerified

  if (loading || checkingClaims) {
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
  if (!resolvedEmailVerified) {
    return <Navigate to="/verify-email" replace />
  }

  // Prevent users with an existing profile from re-entering onboarding.
  if (allowWithoutProfile && hasProfile) {
    return <Navigate to="/discover" replace />
  }

  // Tier 3: Verified but no Firestore profile yet
  if (!allowWithoutProfile && !hasProfile) {
    return <Navigate to="/onboarding" replace />
  }

  // All tiers passed
  return children
}
