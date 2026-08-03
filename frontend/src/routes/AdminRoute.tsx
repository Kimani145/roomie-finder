import React, { useEffect, useState } from 'react'
import { Navigate, useLocation } from 'react-router-dom'
import { useAuth } from '@/hooks/useAuth'
import { doc, onSnapshot } from 'firebase/firestore'
import { db } from '@/firebase/config'
import FullScreenLoader from '@/components/ui/FullScreenLoader'
import { logger } from '@/utils/logger'
import { UserRole } from '@/types'

interface AdminRouteProps {
  children: React.ReactNode
  requireRole?: UserRole
}

export const AdminRoute: React.FC<AdminRouteProps> = ({ children, requireRole }) => {
  const { user, loading } = useAuth()
  const location = useLocation()
  
  const [adminDoc, setAdminDoc] = useState<any>(null)
  const [checking, setChecking] = useState(true)

  useEffect(() => {
    if (loading) return
    if (!user) {
      setAdminDoc(null)
      setChecking(false)
      return
    }

    const unsubscribe = onSnapshot(
      doc(db, 'admins', user.uid),
      (snap) => {
        if (snap.exists()) {
          setAdminDoc(snap.data())
        } else {
          setAdminDoc(null)
        }
        setChecking(false)
      },
      (err) => {
        logger.error('Admin snapshot listener failed:', err)
        setAdminDoc(null)
        setChecking(false)
      }
    )

    return () => unsubscribe()
  }, [user, loading])

  if (loading || checking) return <FullScreenLoader message="Loading dashboard..." />

  // 1. Must be logged in and have an admin document
  if (!user || !adminDoc) {
    return <Navigate to="/admin/login" replace />
  }

  // 2. Must not be disabled
  if (adminDoc.status === 'disabled') {
    return <Navigate to="/admin/login" replace />
  }

  // 3. Must satisfy role requirements
  if (requireRole && requireRole === UserRole.SUPER_ADMIN && adminDoc.systemRole !== UserRole.SUPER_ADMIN) {
    return <Navigate to="/admin/access-denied" replace />
  }

  // 4. Must complete 2FA setup if not enabled
  if (!adminDoc.twoFactorEnabled && location.pathname !== '/admin/setup-2fa') {
    return <Navigate to="/admin/setup-2fa" replace />
  }

  // 5. Mandatory session-based 2FA verification for EVERY admin login
  const isSessionVerified =
    sessionStorage.getItem(`rf_admin_2fa_verified_${user.uid}`) === 'true' ||
    sessionStorage.getItem(`rf_2fa_verified_${user.uid}`) === 'true'

  if (
    !isSessionVerified &&
    location.pathname !== '/admin/setup-2fa' &&
    location.pathname !== '/verify-2fa'
  ) {
    return <Navigate to="/verify-2fa" replace />
  }

  return <>{children}</>
}
