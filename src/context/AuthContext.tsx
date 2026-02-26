import React, { createContext, useCallback, useEffect, useMemo, useState } from 'react'
import type { User } from 'firebase/auth'
import {
  loginUser,
  logoutUser,
  onAuthStateChange,
  registerUser,
  type AuthServiceError,
} from '@/services/authService'

export type AuthContextValue = {
  user: User | null
  loading: boolean
  register: (email: string, password: string) => Promise<User>
  login: (email: string, password: string) => Promise<User>
  logout: () => Promise<void>
}

export const AuthContext = createContext<AuthContextValue | undefined>(undefined)

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    setLoading(true)
    const unsubscribe = onAuthStateChange((firebaseUser) => {
      setUser(firebaseUser)
      setLoading(false)
    })

    return () => unsubscribe()
  }, [])

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
    } catch (error) {
      throw error as AuthServiceError
    } finally {
      setLoading(false)
    }
  }, [])

  const value = useMemo(
    () => ({
      user,
      loading,
      register,
      login,
      logout,
    }),
    [user, loading, register, login, logout]
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}
