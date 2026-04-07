import { useState, useEffect } from 'react'
import { collection, query, where, onSnapshot } from 'firebase/firestore'
import { db } from '@/firebase/config'
import { useAuthStore } from '@/store/authStore'
import { getUserProfile } from '@/firebase/profiles'
import { fetchListingsByHostIds } from '@/firebase/listings'
import { calculateCompatibilityScore } from '@/engine/compatibilityEngine'
import type { UserProfile, Match, Listing } from '@/types'

export interface HydratedMatch {
  matchId: string
  otherUser: UserProfile
  listing?: Listing
  createdAt: Date
  compatibilityScore: number
}

export const useMatches = () => {
  const { currentUser } = useAuthStore()
  const [matches, setMatches] = useState<HydratedMatch[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)

  useEffect(() => {
    if (!currentUser) {
      setIsLoading(false)
      return
    }

    const q = query(
      collection(db, 'matches'),
      where('participants', 'array-contains', currentUser.uid),
      where('status', '==', 'matched')
    )

    const unsubscribe = onSnapshot(
      q,
      async (snapshot) => {
        setIsLoading(true)
        try {
          const matchPromises = snapshot.docs.map(async (docSnap) => {
            if (!currentUser) return null

            const match = docSnap.data() as Match
            if (match.status !== 'matched') {
              return null
            }

            const otherUserId = match.participants.find(
              (id) => id !== currentUser.uid
            )

            if (!otherUserId) {
              return null
            }

            const userProfile = await getUserProfile(otherUserId)
            if (!userProfile) {
              return null
            }

            const firestoreMatch = docSnap.data() as Match & {
              createdAt?: { toDate?: () => Date } | null
            }

            return {
              matchId: docSnap.id,
              otherUser: userProfile,
              createdAt: firestoreMatch.createdAt?.toDate?.() ?? new Date(),
            }
          })

          const resolvedMatches = (await Promise.all(matchPromises)).filter(
            (
              match
            ): match is Omit<HydratedMatch, 'listing' | 'compatibilityScore'> =>
              match !== null
          )

          const hostIds = Array.from(
            new Set(
              resolvedMatches
                .filter((match) => match.otherUser.role === 'HOST')
                .map((match) => match.otherUser.uid)
            )
          )

          const listingsByHostId =
            hostIds.length > 0 ? await fetchListingsByHostIds(hostIds) : {}

          const hydratedMatches = resolvedMatches.map((match) => {
            const listing =
              match.otherUser.role === 'HOST'
                ? listingsByHostId[match.otherUser.uid]
                : undefined

            return {
              ...match,
              listing,
              compatibilityScore: calculateCompatibilityScore(
                currentUser,
                match.otherUser,
                listing
              ).totalScore,
            }
          })

          setMatches(hydratedMatches)
        } catch (e) {
          setError(e as Error)
        } finally {
          setIsLoading(false)
        }
      },
      (err) => {
        setError(err)
        setIsLoading(false)
      }
    )

    return () => unsubscribe()
  }, [currentUser])

  return { matches, isLoading, error }
}
