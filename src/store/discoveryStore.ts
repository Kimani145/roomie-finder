import { create } from 'zustand'
import type { DiscoveryFilters, MatchResult, Zone, Gender, SleepTime, CleanlinessLevel, NoiseTolerance } from '@/types'

interface DiscoveryState {
  // Results
  candidates: MatchResult[]
  isLoading: boolean
  hasRelaxedFilters: boolean
  relaxedFilterKeys: string[]

  // Active filters
  filters: DiscoveryFilters

  // Actions
  setCandidates: (candidates: MatchResult[]) => void
  setLoading: (loading: boolean) => void
  setRelaxed: (relaxed: boolean, keys?: string[]) => void
  updateFilter: <K extends keyof DiscoveryFilters>(key: K, value: DiscoveryFilters[K]) => void
  resetFilters: () => void
}

const defaultFilters: DiscoveryFilters = {
  zone: null,
  gender: null,
  minBudget: null,
  maxBudget: null,
  sleepTime: null,
  cleanlinessLevel: null,
  noiseTolerance: null,
  guestFrequency: null,
  noSmokingRequired: false,
  noAlcoholRequired: false,
}

export const useDiscoveryStore = create<DiscoveryState>((set) => ({
  candidates: [],
  isLoading: false,
  hasRelaxedFilters: false,
  relaxedFilterKeys: [],
  filters: defaultFilters,

  setCandidates: (candidates) => set({ candidates }),
  setLoading: (isLoading) => set({ isLoading }),
  setRelaxed: (hasRelaxedFilters, keys = []) =>
    set({ hasRelaxedFilters, relaxedFilterKeys: keys }),

  updateFilter: (key, value) =>
    set((state) => ({
      filters: { ...state.filters, [key]: value },
    })),

  resetFilters: () =>
    set({ filters: defaultFilters, hasRelaxedFilters: false, relaxedFilterKeys: [] }),
}))
