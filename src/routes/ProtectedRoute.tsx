import React, { useEffect, useState } from 'react'
import { Navigate, useLocation } from 'react-router-dom'
import { useAuth } from '@/hooks/useAuth'
import { useAuthStore } from '@/store/authStore'
import { AlertTriangle } from 'lucide-react'
import { auth } from '@/firebase/config'

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
  const location = useLocation()
  const { user, loading, emailVerified, hasProfile, reloadUser } = useAuth()
  const currentUser = useAuthStore(state => state.currentUser)
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
    return (
      <Navigate
        to="/login"
        replace
        state={{ from: location.pathname + location.search }}
      />
    )
  }

  // Tier 2: Signed in but email not verified
  if (!resolvedEmailVerified) {
    return <Navigate to="/verify-email" replace />
  }

  // Anti-Banned User Interceptor (Must run regardless of allowWithoutProfile)
  if (currentUser?.status === ('banned' as any)) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-6 text-center">
        <div className="w-16 h-16 bg-red-500/20 text-red-500 rounded-full flex items-center justify-center mb-6">
          <AlertTriangle className="w-8 h-8" />
        </div>
        <h1 className="text-2xl font-syne font-bold text-white mb-2">Account Suspended</h1>
        <p className="text-slate-400 max-w-md mb-8">
          Your access to Roomie Finder has been revoked due to a violation of our community guidelines.
        </p>
        <button onClick={() => auth.signOut()} className="px-6 py-3 bg-slate-800 hover:bg-slate-700 text-white font-bold rounded-xl transition-colors">
          Sign Out
        </button>
      </div>
    );
  }

  // Prevent users with an existing profile from re-entering onboarding.
    if (allowWithoutProfile && hasProfile && location.pathname === '/onboarding') {
    return <Navigate to="/discover" replace />
  }

  // Tier 3: Verified but no Firestore profile yet
  if (!allowWithoutProfile && !hasProfile) {
    return <Navigate to="/onboarding" replace />
  }

  // All tiers passed
  return children
}
