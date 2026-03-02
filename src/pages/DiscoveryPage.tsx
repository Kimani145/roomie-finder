import React, { useEffect, useState } from 'react'
import { useDiscovery } from '@/hooks/useDiscovery'
import { useDiscoveryStore } from '@/store/discoveryStore'
import { useAuthStore } from '@/store/authStore'
import { DiscoveryCard } from '@/components/discovery/DiscoveryCard'
import { FilterBar } from '@/components/discovery/FilterBar'
import { FeedSkeleton } from '@/components/ui/Skeleton'
import { ZeroState } from '@/components/discovery/ZeroState'
import type { Zone } from '@/types'

// ─────────────────────────────────────────────────────────────────────────────
// DiscoveryPage
// ─────────────────────────────────────────────────────────────────────────────

const DiscoveryPage: React.FC = () => {
  const { currentUser } = useAuthStore()
  const { runDiscovery, error } = useDiscovery()
  const { candidates, isLoading, hasRelaxedFilters, relaxedFilterKeys } =
    useDiscoveryStore()

  const [selectedZone, setSelectedZone] = useState<Zone | null>(null)
  const [selectedBudgetRange, setSelectedBudgetRange] = useState<{
    min: number
    max: number
  } | null>(null)

  useEffect(() => {
    if (currentUser) {
      runDiscovery()
    }
  }, [currentUser]) // eslint-disable-line react-hooks/exhaustive-deps

  const handleRetry = () => {
    if (currentUser) runDiscovery(selectedZone || undefined)
  }

  const handleZoneChange = (zone: Zone | null) => {
    setSelectedZone(zone)
    if (zone) {
      runDiscovery(zone)
    } else {
      runDiscovery() // revert to default zone (currentUser.zone)
    }
  }

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Filter Bar - Always visible */}
      <div className="sticky top-14 z-20 bg-slate-50">
        <FilterBar
          selectedZone={selectedZone}
          selectedBudgetRange={selectedBudgetRange}
          onZoneChange={handleZoneChange}
          onBudgetChange={(min, max) => setSelectedBudgetRange({ min, max })}
        />
      </div>

      <div className="mx-auto max-w-7xl px-4 md:px-8 py-6">
        {/* Relaxed filter notice */}
        {hasRelaxedFilters && candidates.length > 0 && (
          <div className="mb-5 rounded-xl border border-amber-500/30 bg-amber-50 px-4 py-3 text-sm text-amber-700">
            <span className="font-semibold">No perfect matches found.</span>{' '}
            Showing closest compatible roommates.
          </div>
        )}

        {/* Ranking reinforcement label */}
        {!isLoading && candidates.length > 0 && (
          <div className="mb-3 flex items-center justify-between">
            <p className="text-xs font-medium text-slate-500">
              Showing highest compatibility first
            </p>
            <span className="text-xs text-slate-400">
              {candidates.length} {candidates.length === 1 ? 'person' : 'people'} found
            </span>
          </div>
        )}

        {/* Error state */}
        {error && !isLoading && (
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
        {isLoading && <FeedSkeleton count={3} />}

        {/* Zero state */}
        {!isLoading && !error && candidates.length === 0 && (
          <ZeroState
            isRelaxed={hasRelaxedFilters}
            relaxedFilterKeys={relaxedFilterKeys}
            onRetry={handleRetry}
          />
        )}

        {/* Ranked feed */}
        {!isLoading && candidates.length > 0 && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {candidates.map((match) => (
              <DiscoveryCard key={match.profile.uid} match={match} />
            ))}
          </div>
        )}

        {/* Bottom padding for mobile nav */}
        <div className="h-20" aria-hidden="true" />
      </div>
    </div>
  )
}

export default DiscoveryPage
