import { useState, useCallback } from 'react'
import { fetchCandidatesByZone } from '@/firebase/profiles'
import {
  runDiscoveryEngine,
  runRelaxedDiscovery,
} from '@/engine/compatibilityEngine'
import { useAuthStore } from '@/store/authStore'
import { useDiscoveryStore } from '@/store/discoveryStore'
import type { Zone } from '@/types'

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

  const runDiscovery = useCallback(
    async (zone?: Zone) => {
      if (!currentUser) return

      setLoading(true)
      setError(null)

      try {
        const targetZone = zone ?? currentUser.zone
        const rawCandidates = await fetchCandidatesByZone(targetZone)

        let results = runDiscoveryEngine(currentUser, rawCandidates)

        if (results.length === 0) {
          // Relax filters and retry
          const { results: relaxedResults, relaxedFilters } =
            runRelaxedDiscovery(currentUser, rawCandidates, filters)

          setCandidates(relaxedResults)
          setRelaxed(true, Object.keys(relaxedFilters))
        } else {
          setCandidates(results)
          setRelaxed(false)
        }
      } catch (err) {
        console.error('Discovery failed:', err)
        setError('Failed to load matches. Please try again.')
      } finally {
        setLoading(false)
      }
    },
    [currentUser, filters, setCandidates, setLoading, setRelaxed]
  )

  return { runDiscovery, error }
}
