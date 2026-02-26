import React, { useEffect, useState } from 'react'
import { useDiscovery } from '@/hooks/useDiscovery'
import { useDiscoveryStore } from '@/store/discoveryStore'
import { useAuthStore } from '@/store/authStore'
import { DiscoveryCard } from '@/components/discovery/DiscoveryCard'
import { FilterBar } from '@/components/discovery/FilterBar'
import { FeedSkeleton } from '@/components/ui/Skeleton'
import { ZeroState } from '@/components/discovery/ZeroState'
import type { UserProfile, MatchResult } from '@/types'

// ─── MOCK DATA FOR TESTING ─────────────────────────────────────────────────────
// Remove this section once Firebase authentication is set up
// ───────────────────────────────────────────────────────────────────────────────

const MOCK_CANDIDATES: MatchResult[] = [
  {
    profile: {
      uid: 'mock-user-1',
      displayName: 'Joseph Kimani',
      photoURL: null,
      gender: 'Male',
      age: 21,
      school: 'TUK',
      courseYear: 3,
      minBudget: 5000,
      maxBudget: 8000,
      zone: 'Ruiru',
      preferredRoomType: 'Bedsitter',
      lifestyle: {
        sleepTime: 'Early',
        noiseTolerance: 'Low',
        guestFrequency: 'Rare',
        cleanlinessLevel: 'Moderate',
        studyStyle: 'Silent',
        smoking: false,
        alcohol: false,
      },
      dealBreakers: {
        noSmokingRequired: true,
        noAlcoholRequired: false,
        mustHaveWiFi: true,
        femaleOnly: false,
        maleOnly: false,
      },
      status: 'active',
      lastActive: new Date(),
      createdAt: new Date(),
      bio: 'Looking for a quiet roommate near campus',
    },
    compatibilityScore: 65,
    scoreBreakdown: {
      budgetOverlap: true,
      zoneMatch: 20,
      sleepMatch: 15,
      cleanlinessMatch: 20,
      noiseMatch: 10,
      smokingConflict: false,
      alcoholConflict: false,
      totalScore: 65,
    },
    isExactMatch: true,
  },
  {
    profile: {
      uid: 'mock-user-2',
      displayName: 'Sarah Mwangi',
      photoURL: null,
      gender: 'Female',
      age: 20,
      school: 'TUK',
      courseYear: 3,
      minBudget: 6000,
      maxBudget: 10000,
      zone: 'Ruiru',
      preferredRoomType: '1 Bedroom',
      lifestyle: {
        sleepTime: 'Late',
        noiseTolerance: 'Medium',
        guestFrequency: 'Sometimes',
        cleanlinessLevel: 'Strict',
        studyStyle: 'Background noise ok',
        smoking: false,
        alcohol: false,
      },
      dealBreakers: {
        noSmokingRequired: true,
        noAlcoholRequired: true,
        mustHaveWiFi: true,
        femaleOnly: false,
        maleOnly: false,
      },
      status: 'active',
      lastActive: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000), // 2 days ago
      createdAt: new Date(),
      bio: 'Final year student, clean and organized',
    },
    compatibilityScore: 50,
    scoreBreakdown: {
      budgetOverlap: true,
      zoneMatch: 20,
      sleepMatch: 0,
      cleanlinessMatch: 0,
      noiseMatch: 0,
      smokingConflict: false,
      alcoholConflict: false,
      totalScore: 50,
    },
    isExactMatch: false,
  },
  {
    profile: {
      uid: 'mock-user-3',
      displayName: 'David Omondi',
      photoURL: null,
      gender: 'Male',
      age: 22,
      school: 'JKUAT',
      courseYear: 4,
      minBudget: 4000,
      maxBudget: 7000,
      zone: 'Juja',
      preferredRoomType: 'Shared Hostel',
      lifestyle: {
        sleepTime: 'Early',
        noiseTolerance: 'Low',
        guestFrequency: 'Rare',
        cleanlinessLevel: 'Moderate',
        studyStyle: 'Silent',
        smoking: false,
        alcohol: false,
      },
      dealBreakers: {
        noSmokingRequired: true,
        noAlcoholRequired: false,
        mustHaveWiFi: true,
        femaleOnly: false,
        maleOnly: false,
      },
      status: 'active',
      lastActive: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000), // 5 days ago
      createdAt: new Date(),
      bio: 'Engineering student, focused and quiet',
    },
    compatibilityScore: 45,
    scoreBreakdown: {
      budgetOverlap: true,
      zoneMatch: 0,
      sleepMatch: 15,
      cleanlinessMatch: 20,
      noiseMatch: 10,
      smokingConflict: false,
      alcoholConflict: false,
      totalScore: 45,
    },
    isExactMatch: false,
  },
]

// ─────────────────────────────────────────────────────────────────────────────
// DiscoveryPage (with mock data fallback)
// ─────────────────────────────────────────────────────────────────────────────

const DiscoveryPage: React.FC = () => {
  const { currentUser } = useAuthStore()
  const { runDiscovery, error } = useDiscovery()
  const { candidates, isLoading, hasRelaxedFilters, relaxedFilterKeys } =
    useDiscoveryStore()

  // Use mock data if no real candidates (for development)
  const [useMockData, setUseMockData] = useState(false)
  const [selectedZone, setSelectedZone] = useState<string | null>(null)
  const [selectedBudgetRange, setSelectedBudgetRange] = useState<{
    min: number
    max: number
  } | null>(null)

  useEffect(() => {
    if (currentUser) {
      runDiscovery()
    } else {
      // No user logged in — use mock data after a delay to simulate loading
      setTimeout(() => setUseMockData(true), 500)
    }
  }, [currentUser]) // eslint-disable-line react-hooks/exhaustive-deps

  const handleRetry = () => {
    if (currentUser) runDiscovery()
  }

  // Determine which data to display
  const displayCandidates = candidates.length > 0 ? candidates : (useMockData ? MOCK_CANDIDATES : [])
  const displayLoading = isLoading || (!currentUser && !useMockData)

  return (
    <div className="min-h-screen bg-slate-50">
      <main className="mx-auto max-w-7xl px-4 md:px-8 py-6">
        {/* Mock data notice */}
        {useMockData && (
          <div className="mb-4 rounded-xl border border-blue-500/30 bg-blue-50 px-4 py-3 text-sm text-blue-700">
            <span className="font-semibold">⚠️ Demo Mode:</span> Showing mock data for testing. Set up Firebase authentication to use real profiles.
          </div>
        )}

        {/* Relaxed filter notice */}
        {hasRelaxedFilters && displayCandidates.length > 0 && (
          <div className="mb-5 rounded-xl border border-amber-500/30 bg-amber-50 px-4 py-3 text-sm text-amber-700">
            <span className="font-semibold">No perfect matches found.</span>{' '}
            Showing closest compatible roommates.
          </div>
        )}

        {/* Ranking reinforcement label */}
        {!displayLoading && displayCandidates.length > 0 && (
          <div className="mb-3 flex items-center justify-between">
            <p className="text-xs font-medium text-slate-500">
              Showing highest compatibility first
            </p>
            <span className="text-xs text-slate-400">
              {displayCandidates.length} {displayCandidates.length === 1 ? 'person' : 'people'} found
            </span>
          </div>
        )}

        {/* Error state */}
        {error && !displayLoading && (
          <div
            role="alert"
            className="mb-5 rounded-xl border border-red-500/30 bg-red-50 px-4 py-4 text-sm text-red-600"
          >
            {error}
            <button
              onClick={handleRetry}
              className="mt-2 block font-semibold text-red-700 underline"
            >
              Try again
            </button>
          </div>
        )}

        {/* Loading skeletons */}
        {displayLoading && <FeedSkeleton count={3} />}

        {/* Zero state */}
        {!displayLoading && !error && displayCandidates.length === 0 && (
          <ZeroState
            isRelaxed={hasRelaxedFilters}
            relaxedFilterKeys={relaxedFilterKeys}
            onRetry={handleRetry}
          />
        )}

        {/* Ranked feed */}
        {!displayLoading && displayCandidates.length > 0 && (
          <>
            <FilterBar
              selectedZone={selectedZone}
              selectedBudgetRange={selectedBudgetRange}
              onZoneChange={setSelectedZone}
              onBudgetChange={(min, max) =>
                setSelectedBudgetRange({ min, max })
              }
            />
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {displayCandidates.map((match) => (
                <DiscoveryCard key={match.profile.uid} match={match} />
              ))}
            </div>
          </>
        )}

        {/* Bottom padding for mobile nav */}
        <div className="h-20" aria-hidden="true" />
      </main>
    </div>
  )
}

export default DiscoveryPage
