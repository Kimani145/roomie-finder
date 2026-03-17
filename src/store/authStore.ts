import { create } from 'zustand'
import type { UserProfile } from '@/types'

interface AuthState {
  currentUser: UserProfile | null
  isLoading: boolean
  isAuthenticated: boolean
  needsOnboarding: boolean
  pendingAction: (() => void) | null
  setCurrentUser: (user: UserProfile | null) => void
  setNeedsOnboarding: (value: boolean) => void
  setLoading: (loading: boolean) => void
  setPendingAction: (action: (() => void) | null) => void
  clearPendingAction: () => void
  clearAuth: () => void
}

export const useAuthStore = create<AuthState>((set) => ({
  currentUser: null,
  isLoading: true,
  isAuthenticated: false,
  needsOnboarding: false,
  pendingAction: null,

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

  setPendingAction: (action) => set({ pendingAction: action }),

  clearPendingAction: () => set({ pendingAction: null }),

  clearAuth: () =>
    set({
      currentUser: null,
      isAuthenticated: false,
      needsOnboarding: false,
      pendingAction: null,
      isLoading: false,
    }),
}))
