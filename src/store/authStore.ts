import { create } from 'zustand'
import type { UserProfile } from '@/types'

interface AuthState {
  currentUser: UserProfile | null
  isLoading: boolean
  isAuthenticated: boolean
  needsOnboarding: boolean
  setCurrentUser: (user: UserProfile | null) => void
  setNeedsOnboarding: (value: boolean) => void
  setLoading: (loading: boolean) => void
  clearAuth: () => void
}

export const useAuthStore = create<AuthState>((set) => ({
  currentUser: null,
  isLoading: true,
  isAuthenticated: false,
  needsOnboarding: false,

  setCurrentUser: (user) =>
    set({
      currentUser: user,
      isAuthenticated: !!user,
      needsOnboarding: false,
      isLoading: false,
    }),

  setNeedsOnboarding: (value) =>
    set({ needsOnboarding: value, isLoading: false }),

  setLoading: (loading) => set({ isLoading: loading }),

  clearAuth: () =>
    set({
      currentUser: null,
      isAuthenticated: false,
      needsOnboarding: false,
      isLoading: false,
    }),
}))
