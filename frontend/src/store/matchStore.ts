import { create } from 'zustand';

export interface MatchUser { 
  uid: string; 
  displayName: string; 
  photoURL: string; 
  role: string; 
}

interface MatchStore {
  matchData: { matchedUser: MatchUser; matchId: string } | null;
  triggerMatch: (user: MatchUser, matchId: string) => void;
  closeMatch: () => void;
}

export const useMatchStore = create<MatchStore>((set) => ({
  matchData: null,
  triggerMatch: (user, matchId) => set({ matchData: { matchedUser: user, matchId } }),
  closeMatch: () => set({ matchData: null })
}));
