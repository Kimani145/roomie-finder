import React, { useEffect, useState } from 'react'
import { Navigate, useLocation } from 'react-router-dom'
import { useAuth } from '@/hooks/useAuth'
import { useAuthStore } from '@/store/authStore'
import { AlertTriangle } from 'lucide-react'
import { auth, db } from '@/firebase/config'
import { doc, getDoc } from 'firebase/firestore'
import { logger } from '@/utils/logger'
import { shouldRedirectToSuspension, isTerminalStatus } from '@/services/accountLifecycle'

interface ProtectedRouteProps {
  children: React.ReactElement
  /** If true, skip the profile check (used for the onboarding route itself). */
  allowWithoutProfile?: boolean
  /** If true, unauthenticated users can pass this route. */
  allowGuest?: boolean
  /** If true, this is the 2FA verification route. */
  is2faPage?: boolean
}

/**
 * Four-tier route guard:
 *   Tier 1: !user                         → Redirect to /login
 *   Tier 2: user AND 2FA pending          → Redirect to /verify-2fa
 *   Tier 3: user AND !user.emailVerified  → Redirect to /verify-email
 *   Tier 4: user AND verified AND !profile → Redirect to /onboarding
 *   Pass:   user AND verified AND profile  → Allow access
 */
export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({
  children,
  allowWithoutProfile = false,
  allowGuest = false,
  is2faPage = false,
}) => {
  const location = useLocation()
  const { user, loading, emailVerified, hasProfile, reloadUser } = useAuth()
  const currentUser = useAuthStore(state => state.currentUser)
  const is2faPending = useAuthStore(state => state.is2faPending)
  const [checkingClaims, setCheckingClaims] = useState(false)
  const [tokenEmailVerified, setTokenEmailVerified] = useState<boolean | null>(null)
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null)

  useEffect(() => {
    const forceCheck = async () => {
      const currentUser = user

      if (!currentUser) {
        setTokenEmailVerified(null)
        setIsAdmin(false)
        return
      }

      setCheckingClaims(true)

      try {
        const verified = await reloadUser('ROUTE')
        setTokenEmailVerified(verified)

        const adminSnap = await getDoc(doc(db, 'admins', currentUser.uid))
        setIsAdmin(adminSnap.exists())
      } catch (error) {
        logger.error('ProtectedRoute token/admin refresh failed.')
        setTokenEmailVerified(currentUser.emailVerified)
        setIsAdmin(false)
      } finally {
        setCheckingClaims(false)
      }
    }

    forceCheck()
  }, [user, reloadUser])

  const resolvedEmailVerified = tokenEmailVerified ?? emailVerified

  if (loading || checkingClaims || isAdmin === null) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="h-10 w-10 rounded-full border-2 border-brand-600/25 border-t-accent-dark animate-spin" />
          <span className="text-sm font-medium text-brand-600">Weaving your matches...</span>
        </div>
      </div>
    )
  }

  // Tier 1: No user at all
  if (!user && !loading) {
    if (allowGuest) return <>{children}</>
    return <Navigate to="/login" replace />
  }

  // Two-Factor Authentication Check
  if (user && !loading) {
    if (is2faPending) {
      if (!is2faPage) {
        return <Navigate to="/verify-2fa" replace />
      }
    } else {
      if (is2faPage) {
        return <Navigate to="/discover" replace />
      }
    }
  }

  // Tier 2: Signed in but email not verified
  if (!resolvedEmailVerified) {
    return <Navigate to="/verify-email" replace />
  }

  // Tier 2.5: Administrators are not allowed on student routes
  if (isAdmin) {
    return <Navigate to="/admin" replace />
  }

  // Anti-Suspended/Banned User Interceptor
  if (currentUser?.status && shouldRedirectToSuspension(currentUser.status)) {
    // If they are banned, show the terminal state
    if (isTerminalStatus(currentUser.status)) {
      return (
        <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-6 text-center">
          <div className="w-16 h-16 bg-red-500/20 text-red-500 rounded-full flex items-center justify-center mb-6">
            <AlertTriangle className="w-8 h-8" />
          </div>
          <h1 className="text-2xl font-syne font-bold text-white mb-2">Account Banned</h1>
          <p className="text-slate-400 max-w-md mb-8">
            Your access to Roomie Finder has been permanently revoked due to a severe violation of our community guidelines.
          </p>
          <button onClick={() => auth.signOut()} className="px-6 py-3 bg-slate-800 hover:bg-slate-700 text-white font-bold rounded-xl transition-colors">
            Sign Out
          </button>
        </div>
      )
    }

    // Otherwise they are suspended/under_appeal, redirect to the suspension page
    if (location.pathname !== '/suspension' && location.pathname !== '/appeal') {
      return <Navigate to="/suspension" replace />
    }
  }

  // Prevent users with an existing profile from re-entering onboarding.
  if (allowWithoutProfile && hasProfile && location.pathname === '/onboarding') {
    return <Navigate to="/discover" replace />
  }

  // 3. Handle Missing Profiles (The Limbo Fix)
  // If they are logged in, but have no profile, force them to onboarding 
  // UNLESS the current route explicitly allows users without profiles (e.g., the /onboarding route itself).
  if (user && !hasProfile && !loading) {
    if (allowWithoutProfile) return <>{children}</>;
    return <Navigate to="/onboarding" replace />;
  }

  // All tiers passed
  return children
}
