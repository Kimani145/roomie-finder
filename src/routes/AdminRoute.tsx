import React, { useEffect, useState } from 'react'
import { Navigate, useLocation } from 'react-router-dom'
import { useAuth } from '@/hooks/useAuth'
import { doc, getDoc } from 'firebase/firestore'
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
      setChecking(false)
      return
    }

    const checkAdmin = async () => {
      try {
        const snap = await getDoc(doc(db, 'admins', user.uid))
        if (snap.exists()) {
          setAdminDoc(snap.data())
        } else {
          setAdminDoc(null)
        }
      } catch (err) {
        logger.error("Admin check failed:", err)
        setAdminDoc(null)
      } finally {
        setChecking(false)
      }
    }
    
    checkAdmin()
  }, [user, loading])

  if (loading || checking) return <FullScreenLoader />

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

  // 4. Must complete 2FA unless currently on the 2FA setup route
  if (!adminDoc.twoFactorEnabled && location.pathname !== '/admin/setup-2fa') {
    return <Navigate to="/admin/setup-2fa" replace />
  }

  return <>{children}</>
}
