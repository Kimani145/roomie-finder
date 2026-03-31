import { create } from 'zustand'

export interface MatchRevealUser {
  uid: string
  name: string
  avatar: string | null
}

export interface MatchRevealData {
  matchId: string
  userA: MatchRevealUser
  userB: MatchRevealUser
}

interface MatchStoreState {
  isOpen: boolean
  matchData: MatchRevealData | null
  openMatch: (data: MatchRevealData) => void
  closeMatch: () => void
}

export const useMatchStore = create<MatchStoreState>((set) => ({
  isOpen: false,
  matchData: null,
  openMatch: (data) => set({ isOpen: true, matchData: data }),
  closeMatch: () => set({ isOpen: false, matchData: null }),
}))
