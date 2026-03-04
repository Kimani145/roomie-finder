import React, { useEffect, useState } from 'react'
import { useDiscovery } from '@/hooks/useDiscovery'
import { useDiscoveryStore } from '@/store/discoveryStore'
import { useAuthStore } from '@/store/authStore'
import { DiscoveryCard } from '@/components/discovery/DiscoveryCard'
import { FilterBar } from '@/components/discovery/FilterBar'
import { FeedSkeleton } from '@/components/ui/Skeleton'
import { ZeroState } from '@/components/discovery/ZeroState'
import { fetchAvailableZones } from '@/firebase/zones'
import { TUK_ZONES } from '@/constants/zones'
import type { DiscoveryFilters, TukZone } from '@/types'

// ─────────────────────────────────────────────────────────────────────────────
// DiscoveryPage - Desktop Containerization and Layering
// ─────────────────────────────────────────────────────────────────────────────

const DiscoveryPage: React.FC = () => {
  const { currentUser } = useAuthStore()
  const { runDiscovery, error } = useDiscovery()
  const {
    candidates,
    isLoading,
    hasRelaxedFilters,
    relaxedFilterKeys,
    filters,
    updateFilter,
  } = useDiscoveryStore()
  const [availableZones, setAvailableZones] = useState<TukZone[]>(TUK_ZONES)

  useEffect(() => {
    fetchAvailableZones().then(setAvailableZones)
  }, [])

  useEffect(() => {
    if (currentUser) runDiscovery()
  }, [currentUser, filters, runDiscovery])

  const handleRetry = () => {
    if (currentUser) runDiscovery()
  }

  const handleApplyFilters = (nextFilters: Partial<DiscoveryFilters>) => {
    Object.entries(nextFilters).forEach(([key, value]) => {
      updateFilter(key as keyof DiscoveryFilters, value as never)
    })
  }

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Sticky control band */}
      <div className="bg-slate-50 border-b border-slate-200 sticky top-0 z-10 px-4 py-4 sm:px-6 lg:px-8 shadow-sm">
        {/* FilterBar */}
        <FilterBar
          filters={filters}
          availableZones={availableZones}
          onApplyFilters={handleApplyFilters}
        />

        {/* Ranking reinforcement label - inside Hero Band */}
        {!isLoading && candidates.length > 0 && (
          <div className="mt-3 flex items-center justify-between">
            <p className="text-xs font-medium text-slate-500">
              Showing highest compatibility first
            </p>
            <span className="text-xs text-slate-400">
              {candidates.length} {candidates.length === 1 ? 'person' : 'people'} found
            </span>
          </div>
        )}
      </div>

      {/* Content Container & Grid */}
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Relaxed filter notice */}
        {hasRelaxedFilters && candidates.length > 0 && (
          <div className="mb-5 rounded-xl border border-amber-500/30 bg-amber-50 px-4 py-3 text-sm text-amber-700">
            <span className="font-semibold">No perfect matches found.</span>{' '}
            Showing closest compatible roommates.
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

        {/* Ranked feed - Strict responsive grid */}
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
