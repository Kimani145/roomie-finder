import { create } from 'zustand'
import type { DiscoveryFilters, MatchResult } from '@/types'

interface DiscoveryState {
  // Results
  candidates: MatchResult[]
  isLoading: boolean
  hasRelaxedFilters: boolean
  relaxedFilterKeys: string[]
  hasIntelligence: boolean
  intelligence: { hints: string[] }

  // Active filters
  filters: DiscoveryFilters

  // Actions
  setCandidates: (candidates: MatchResult[]) => void
  setLoading: (loading: boolean) => void
  setRelaxed: (relaxed: boolean, keys?: string[]) => void
  setIntelligence: (hints: string[]) => void
  updateFilter: <K extends keyof DiscoveryFilters>(key: K, value: DiscoveryFilters[K]) => void
  resetFilters: () => void
}

const defaultFilters: DiscoveryFilters = {
  zones: null,
  gender: null,
  minBudget: null,
  maxBudget: null,
  courseYear: null,
  moveInMonth: null,
  sleepTime: null,
  cleanlinessLevel: null,
  noiseTolerance: null,
  guestFrequency: null,
  hideDealBreakerConflicts: true,
  noSmokingRequired: false,
  noAlcoholRequired: false,
}

export const useDiscoveryStore = create<DiscoveryState>((set) => ({
  candidates: [],
  isLoading: false,
  hasRelaxedFilters: false,
  relaxedFilterKeys: [],
  filters: defaultFilters,
  hasIntelligence: true,
  intelligence: {
    hints: [
      'High match density in Kasarani today.',
      'You are in the top 20% of active seekers.',
      "You've passed 12 profiles this session.",
    ],
  },

  setCandidates: (candidates) => set({ candidates }),
  setLoading: (isLoading) => set({ isLoading }),
  setRelaxed: (hasRelaxedFilters, keys = []) =>
    set({ hasRelaxedFilters, relaxedFilterKeys: keys }),
  setIntelligence: (hints) => set({ hasIntelligence: hints.length > 0, intelligence: { hints } }),

  updateFilter: (key, value) =>
    set((state) => ({
      filters: { ...state.filters, [key]: value },
    })),

  resetFilters: () =>
    set({ filters: defaultFilters, hasRelaxedFilters: false, relaxedFilterKeys: [] }),
}))
