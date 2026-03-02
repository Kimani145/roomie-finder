import React, { createContext, useCallback, useEffect, useMemo, useState } from 'react'
import type { User } from 'firebase/auth'
import {
  loginUser,
  logoutUser,
  onAuthStateChange,
  registerUser,
  resendVerificationEmail,
  reloadAndRefreshUser,
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
  reloadUser: () => Promise<boolean>
}

export const AuthContext = createContext<AuthContextValue | undefined>(undefined)

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const [hasProfile, setHasProfile] = useState(false)
  const { setCurrentUser, setNeedsOnboarding, clearAuth } = useAuthStore()

  useEffect(() => {
    setLoading(true)
    const unsubscribe = onAuthStateChange(async (firebaseUser) => {
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
        } catch (err) {
          console.error('Failed to load user profile:', err)
          setHasProfile(false)
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
    setLoading(true)
    try {
      const createdUser = await registerUser(email, password)
      setUser(createdUser)
      return createdUser
    } catch (error) {
      throw error as AuthServiceError
    } finally {
      setLoading(false)
    }
  }, [])

  const login = useCallback(async (email: string, password: string) => {
    setLoading(true)
    try {
      const loggedInUser = await loginUser(email, password)
      setUser(loggedInUser)
      return loggedInUser
    } catch (error) {
      throw error as AuthServiceError
    } finally {
      setLoading(false)
    }
  }, [])

  const logout = useCallback(async () => {
    setLoading(true)
    try {
      await logoutUser()
      setUser(null)
      setHasProfile(false)
      clearAuth()
    } catch (error) {
      throw error as AuthServiceError
    } finally {
      setLoading(false)
    }
  }, [clearAuth])

  const resendVerification = useCallback(async () => {
    if (!user) throw { code: 'auth/no-user', message: 'No user signed in.' }
    await resendVerificationEmail(user)
  }, [user])

  /**
   * Reload the Firebase user and force a token refresh.
   * Returns true if email is now verified, false otherwise.
   */
  const reloadUser = useCallback(async (): Promise<boolean> => {
    if (!user) return false
    const refreshedUser = await reloadAndRefreshUser(user)
    setUser(refreshedUser)
    return refreshedUser.emailVerified
  }, [user])

  const value = useMemo(
    () => ({
      user,
      loading,
      emailVerified: user?.emailVerified ?? false,
      hasProfile,
      register,
      login,
      logout,
      resendVerification,
      reloadUser,
    }),
    [user, loading, hasProfile, register, login, logout, resendVerification, reloadUser]
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}
