import { useState, useCallback } from 'react'
import { fetchDiscoveryCandidates } from '@/firebase/profiles'
import { fetchListingsByHostIds } from '@/firebase/listings'
import {
  runDiscoveryEngine,
  runRelaxedDiscovery,
} from '@/engine/compatibilityEngine'
import { useAuthStore } from '@/store/authStore'
import { useDiscoveryStore } from '@/store/discoveryStore'
import type { MatchResult, ScoreBreakdown } from '@/types'

/**
 * Drives the discovery feed.
 *
 * Flow:
 * 1. Fetch candidates from Firestore (hard filters: zone, status)
 * 2. Run compatibility engine client-side (soft filters + scoring)
 * 3. If 0 results → run relaxed discovery
 * 4. Populate discovery store
 */
export function useDiscovery() {
  const { currentUser } = useAuthStore()
  const { setCandidates, setLoading, setRelaxed, filters } = useDiscoveryStore()
  const [error, setError] = useState<string | null>(null)

  const buildPublicResults = useCallback(
    (
      rawCandidates: MatchResult['profile'][],
      listingsByHostId: Record<string, MatchResult['listing']>
    ): MatchResult[] => {
      const emptyBreakdown: ScoreBreakdown = {
        budgetOverlap: false,
        zoneMatch: 0,
        zoneOverlapZones: [],
        sleepMatch: 0,
        cleanlinessMatch: 0,
        noiseMatch: 0,
        guestMatch: 0,
        studyMatch: 0,
        smokingConflict: false,
        alcoholConflict: false,
        totalScore: 0,
        matchedFactors: [],
      }

      return rawCandidates.map((candidate) => ({
        profile: candidate,
        listing: candidate.role === 'HOST' ? listingsByHostId[candidate.uid] : undefined,
        compatibilityScore: 0,
        scoreBreakdown: emptyBreakdown,
        isExactMatch: false,
      }))
    },
    []
  )

  const runDiscovery = useCallback(
    async () => {
      setLoading(true)
      setError(null)

      try {
        const rawCandidates = await fetchDiscoveryCandidates({
          viewerUid: currentUser?.uid ?? '',
          viewerZones: currentUser?.zones ?? [],
          filters,
        })

        const hostIds = rawCandidates
          .filter((candidate) => candidate.role === 'HOST')
          .map((candidate) => candidate.uid)

        const listingsByHostId = await fetchListingsByHostIds(hostIds)

        if (!currentUser) {
          setCandidates(buildPublicResults(rawCandidates, listingsByHostId))
          setRelaxed(false)
          // Removing early return here so it safely reaches finally block
        } else {
          const results = runDiscoveryEngine(
            currentUser,
            rawCandidates,
            filters,
            listingsByHostId
          )

          if (results.length === 0) {
            // Relax filters and retry
            const { results: relaxedResults, relaxedFilters } =
              runRelaxedDiscovery(
                currentUser,
                rawCandidates,
                filters,
                listingsByHostId
              )

            setCandidates(relaxedResults)
            setRelaxed(true, Object.keys(relaxedFilters))
          } else {
            setCandidates(results)
            setRelaxed(false)
          }
        }
      } catch (err) {
        console.error('Discovery failed:', err)
        setError('Failed to load matches. Please try again.')
      } finally {
        setLoading(false)
      }
    },
    [buildPublicResults, currentUser, filters, setCandidates, setLoading, setRelaxed]
  )

  return { runDiscovery, error }
}
