import React, { createContext, useCallback, useEffect, useMemo, useState } from 'react'
import type { User } from 'firebase/auth'
import {
  loginUser,
  logoutUser,
  onAuthStateChange,
  registerUser,
  resendVerificationEmail,
  type AuthServiceError,
} from '@/services/authService'
import { getUserProfile } from '@/firebase/profiles'
import { useAuthStore } from '@/store/authStore'

export type AuthContextValue = {
  user: User | null
  loading: boolean
  emailVerified: boolean
  hasProfile: boolean
  register: (email: string, password: string) => Promise<User>
  login: (email: string, password: string) => Promise<User>
  logout: () => Promise<void>
  resendVerification: () => Promise<void>
  reloadUser: (source?: string) => Promise<boolean>
}

export const AuthContext = createContext<AuthContextValue | undefined>(undefined)

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const [hasProfile, setHasProfile] = useState(false)
  const { currentUser, setCurrentUser, setNeedsOnboarding, clearAuth } = useAuthStore()

  useEffect(() => {
    setLoading(true)
    const unsubscribe = onAuthStateChange(async (firebaseUser) => {
      setLoading(true)
      setUser(firebaseUser)

      if (firebaseUser && firebaseUser.emailVerified) {
        try {
          const profile = await getUserProfile(firebaseUser.uid)
          if (profile) {
            setHasProfile(true)
            setCurrentUser(profile)
          } else {
            setHasProfile(false)
            setNeedsOnboarding(true)
          }
        } catch (err: any) {
          if (err.code === 'permission-denied') {
            // User is logged in but lacks Firestore read access (likely unverified email).
            // DO NOT call logout(). Allow the VerifyEmailPage to render.
            setHasProfile(false)
            setNeedsOnboarding(true)
          } else {
            console.error('Failed to load user profile:', err)
            setHasProfile(false)
            setNeedsOnboarding(true)
          }
        }
      } else {
        setHasProfile(false)
        if (!firebaseUser) clearAuth()
      }

      setLoading(false)
    })

    return () => unsubscribe()
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  const register = useCallback(async (email: string, password: string) => {
    try {
      const createdUser = await registerUser(email, password)
      setUser(createdUser)
      return createdUser
    } catch (error) {
      throw error as AuthServiceError
    }
  }, [])

  const login = useCallback(async (email: string, password: string) => {
    try {
      const loggedInUser = await loginUser(email, password)
      setUser(loggedInUser)
      return loggedInUser
    } catch (error) {
      throw error as AuthServiceError
    }
  }, [])

  const logout = useCallback(async () => {
    try {
      await logoutUser()
      setUser(null)
      setHasProfile(false)
      clearAuth()
    } catch (error) {
      throw error as AuthServiceError
    }
  }, [clearAuth])

  const resendVerification = useCallback(async () => {
    if (!user) throw { code: 'auth/no-user', message: 'No user signed in.' }
    await resendVerificationEmail(user)
  }, [user])

  /**
   * Force-fetch latest token claims + reload the Firebase user.
   * Returns token-claim email verification status.
   */
  const reloadUser = useCallback(async (source = 'AUTH'): Promise<boolean> => {
    if (!user) return false

    const tokenResult = await user.getIdTokenResult(true)
    await user.reload()

    console.warn(`=== SECURITY GATE CHECK (${source}) ===`)
    console.log('1. Raw Email:', user.email)
    console.log('2. Is Verified (User Object):', user.emailVerified)
    console.log('3. Is Verified (Token Claim):', tokenResult.claims.email_verified)
    console.warn('=================================')

    setUser(user)
    return Boolean(tokenResult.claims.email_verified)
  }, [user])

  const value = useMemo(
    () => ({
      user,
      loading,
      emailVerified: user?.emailVerified ?? false,
      hasProfile: hasProfile || !!currentUser,
      register,
      login,
      logout,
      resendVerification,
      reloadUser,
    }),
    [
      user,
      loading,
      hasProfile,
      currentUser,
      register,
      login,
      logout,
      resendVerification,
      reloadUser,
    ]
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}
