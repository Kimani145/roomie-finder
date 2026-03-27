import { useState, useEffect } from 'react';
import { collection, query, where, onSnapshot } from 'firebase/firestore';
import { db } from '@/firebase/config';
import { useAuthStore } from '@/store/authStore';
import { getUserProfile } from '@/firebase/profiles';
import { calculateCompatibilityScore } from '@/engine/compatibilityEngine';
import type { UserProfile, Match } from '@/types';

export interface HydratedMatch {
  matchId: string;
  otherUser: UserProfile;
  createdAt: Date;
  compatibilityScore: number;
}

export const useMatches = () => {
  const { currentUser } = useAuthStore();
  const [matches, setMatches] = useState<HydratedMatch[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    if (!currentUser) {
      setIsLoading(false);
      return;
    }

    const q = query(
      collection(db, 'matches'),
      where('participants', 'array-contains', currentUser.uid),
      where('status', '==', 'matched')
    );

    const unsubscribe = onSnapshot(
      q,
      async (snapshot) => {
        setIsLoading(true);
        try {
          const matchPromises = snapshot.docs.map(async (doc) => {
            if (!currentUser) return null;

            const match = doc.data() as Match;
            if (match.status !== 'matched') {
              return null;
            }

            const otherUserId = match.participants.find(
              (id) => id !== currentUser.uid
            );

            if (otherUserId) {
              const userProfile = await getUserProfile(otherUserId);
              if (userProfile) {
                const score = calculateCompatibilityScore(
                  currentUser,
                  userProfile
                );
                const firestoreMatch = doc.data() as any;
                return {
                  matchId: doc.id,
                  otherUser: userProfile,
                  createdAt: firestoreMatch.createdAt?.toDate?.() ?? new Date(),
                  compatibilityScore: score.totalScore,
                };
              }
            }
            return null;
          });

          const resolvedMatches = (await Promise.all(matchPromises)).filter(
            (match): match is HydratedMatch => match !== null
          );

          setMatches(resolvedMatches);
        } catch (e) {
          setError(e as Error);
        } finally {
          setIsLoading(false);
        }
      },
      (err) => {
        setError(err);
        setIsLoading(false);
      }
    );

    return () => unsubscribe();
  }, [currentUser]);

  return { matches, isLoading, error };
};
