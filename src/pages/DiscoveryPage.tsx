import React, { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { SearchX } from 'lucide-react'
import { useDiscovery } from '@/hooks/useDiscovery'
import { useDiscoveryStore } from '@/store/discoveryStore'
import { useAuthStore } from '@/store/authStore'
import { ListingCard } from '@/components/discovery/ListingCard'
import { SeekerCard } from '@/components/discovery/SeekerCard'
import { FeedSkeleton } from '@/components/ui/Skeleton'
import { AuthModal } from '@/components/ui/AuthModal'
import { TUK_ZONES } from '@/constants/zones'
import type { TukZone } from '@/types'

// ─────────────────────────────────────────────────────────────────────────────
// DiscoveryPage - Desktop Containerization and Layering
// ─────────────────────────────────────────────────────────────────────────────

const DiscoveryPage: React.FC = () => {
  const navigate = useNavigate()
  const { currentUser, setPendingAction } = useAuthStore()
  const { runDiscovery, error } = useDiscovery()
  const {
    candidates,
    isLoading,
    hasRelaxedFilters,
    filters,
  } = useDiscoveryStore()
  const [viewMode, setViewMode] = useState<'rooms' | 'roommates'>('rooms')
  const [filterZone, setFilterZone] = useState<string>('All')
  const [filterMaxBudget, setFilterMaxBudget] = useState<number>(50000)
  const [isAuthModalOpen, setAuthModalOpen] = useState(false)

  useEffect(() => {
    runDiscovery()
  }, [currentUser, filters, runDiscovery])

  const handleRetry = () => {
    runDiscovery()
  }

  const handlePrimaryAction = (
    targetId: string,
    event?: React.MouseEvent<HTMLElement>
  ) => {
    if (!targetId) return

    if (!currentUser) {
      event?.preventDefault()
      event?.stopPropagation()
      setPendingAction(() => () => navigate(`/profile/${targetId}`))
      setAuthModalOpen(true)
      return
    }
  }

  const role = currentUser?.role
  const canToggleView = !currentUser || role === 'FLEX'
  const activeViewMode: 'rooms' | 'roommates' = canToggleView
    ? viewMode
    : role === 'HOST'
      ? 'roommates'
      : 'rooms'

  const listingMatches = candidates.filter(
    (match) => match.profile && match.profile.role === 'HOST' && match.listing
  )
  const roommateMatches = candidates.filter(
    (match) => match.profile && match.profile.role !== 'HOST'
  )
  const rawResults = activeViewMode === 'rooms' ? listingMatches : roommateMatches

  const displayedResults = rawResults.filter((item) => {
    // If it's a Listing (Seeker looking at Hosts)
    if (item.listing?.rentTotal) {
      const matchZone = filterZone === 'All' || item.listing?.zone === filterZone
      const matchBudget = (item.listing?.roommateShare || 0) <= filterMaxBudget
      return matchZone && matchBudget
    }

    // If it's a Profile (Host looking at Seekers)
    const matchZone =
      filterZone === 'All' || (item.profile?.zones || []).includes(filterZone as TukZone)
    const matchBudget = (item.profile?.maxBudget || 0) <= filterMaxBudget
    return matchZone && matchBudget
  })

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 pt-2 pb-4">
        <div className="sticky top-0 md:top-0 z-40 bg-slate-50/95 dark:bg-slate-950/95 backdrop-blur-md border-b border-slate-200 dark:border-slate-800 pt-4 pb-3 mb-6 -mx-4 px-4 sm:mx-0 sm:px-0 transition-all flex flex-col gap-4">
          {canToggleView && (
            <div className="flex justify-center">
              <div className="flex bg-slate-200 dark:bg-slate-800 p-1 rounded-xl">
                <button
                  type="button"
                  onClick={() => setViewMode('rooms')}
                  className={`px-6 py-2 rounded-lg text-sm font-semibold transition-colors ${
                    viewMode === 'rooms'
                      ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-50 shadow-sm'
                      : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'
                  }`}
                >
                  View Rooms
                </button>
                <button
                  type="button"
                  onClick={() => setViewMode('roommates')}
                  className={`px-6 py-2 rounded-lg text-sm font-semibold transition-colors ${
                    viewMode === 'roommates'
                      ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-50 shadow-sm'
                      : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'
                  }`}
                >
                  View Roommates
                </button>
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <label className="flex items-center gap-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-sm text-slate-700 dark:text-slate-200">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                Zone
              </span>
              <select
                value={filterZone}
                onChange={(e) => setFilterZone(e.target.value)}
                className="ml-auto w-full max-w-[170px] rounded-md border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-2 py-1 text-sm outline-none focus:border-brand-500"
              >
                <option value="All">All</option>
                {TUK_ZONES.map((zone) => (
                  <option key={zone} value={zone}>
                    {zone}
                  </option>
                ))}
              </select>
            </label>

            <label className="rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-sm text-slate-700 dark:text-slate-200">
              <div className="mb-1 flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                  Max Budget
                </span>
                <span className="text-xs font-semibold text-brand-600 dark:text-brand-400">
                  KES {filterMaxBudget.toLocaleString()}
                </span>
              </div>
              <input
                type="range"
                min={3000}
                max={50000}
                step={500}
                value={filterMaxBudget}
                onChange={(e) => setFilterMaxBudget(Number(e.target.value))}
                className="w-full accent-brand-500"
              />
            </label>
          </div>

          <div className="flex items-center justify-between">
            <p className="text-xs font-medium text-slate-500 dark:text-slate-400">
              Showing highest compatibility first
            </p>
            <span className="text-xs text-slate-400 dark:text-slate-500">
              {!isLoading ? displayedResults.length : 0}{' '}
              {activeViewMode === 'rooms'
                ? displayedResults.length === 1
                  ? 'listing'
                  : 'listings'
                : displayedResults.length === 1
                  ? 'roommate'
                  : 'roommates'}{' '}
              found
            </span>
          </div>
        </div>

        {/* Relaxed filter notice */}
        {hasRelaxedFilters && displayedResults.length > 0 && (
          <div className="mb-5 rounded-xl border border-amber-500/30 dark:border-amber-400/40 bg-amber-50 dark:bg-amber-950/30 px-4 py-3 text-sm text-amber-700 dark:text-amber-200">
            <span className="font-semibold">No perfect matches found.</span>{' '}
            Showing closest compatible {activeViewMode === 'rooms' ? 'listings' : 'roommates'}.
          </div>
        )}

        {/* Error state */}
        {error && !isLoading && (
          <div
            role="alert"
            className="mb-5 rounded-xl border border-red-500/30 dark:border-red-400/40 bg-red-50 dark:bg-red-950/30 px-4 py-4 text-sm text-red-600 dark:text-red-200"
          >
            {error}
            <button
              onClick={handleRetry}
              className="mt-2 block font-semibold text-red-700 dark:text-red-200 underline"
            >
              Try again
            </button>
          </div>
        )}

        {/* Loading skeletons */}
        {isLoading && (
          <FeedSkeleton
            count={3}
            variant={activeViewMode === 'rooms' ? 'listing' : 'seeker'}
          />
        )}

        {/* Zero state */}
        {!isLoading && !error && displayedResults.length === 0 && (
          <div className="flex flex-col items-center justify-center text-center py-20 px-4">
            <div className="w-20 h-20 bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center mb-6">
              <SearchX className="w-10 h-10 text-slate-400" />
            </div>
            <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2">
              No exact matches found
            </h3>
            <p className="text-slate-500 dark:text-slate-400 max-w-md mx-auto mb-8">
              We couldn&apos;t find anyone matching your exact strict criteria in{' '}
              {filterZone === 'All' ? 'any zone' : filterZone}.
            </p>

            <div className="flex flex-col sm:flex-row gap-4">
              {filterZone !== 'All' && (
                <button
                  onClick={() => setFilterZone('All')}
                  className="px-6 py-3 bg-blue-500 hover:bg-blue-600 text-white font-bold rounded-xl transition-colors"
                >
                  Search All Zones
                </button>
              )}
              <button
                onClick={() => setFilterMaxBudget((prev) => Math.min(prev + 3000, 50000))}
                className="px-6 py-3 border-2 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 font-bold rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
              >
                Expand Budget (+KES 3,000)
              </button>
            </div>
          </div>
        )}

        {/* Ranked feed - Strict responsive grid */}
        {!isLoading && displayedResults.length > 0 && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {activeViewMode === 'rooms'
              ? displayedResults.map((match) => (
                  <ListingCard
                    key={`${match.profile?.uid}-${match.listing?.id ?? 'listing'}`}
                    match={match}
                    onPrimaryAction={handlePrimaryAction}
                    showMatchBadge={Boolean(currentUser)}
                  />
                ))
              : displayedResults.map((match) => (
                  <SeekerCard
                    key={match.profile?.uid}
                    match={match}
                    onPrimaryAction={handlePrimaryAction}
                    showMatchBadge={Boolean(currentUser)}
                  />
                ))}
          </div>
        )}

        {/* Bottom padding for mobile nav */}
        <div className="h-20" aria-hidden="true" />
      </div>
      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setAuthModalOpen(false)}
      />
    </div>
  )
}

export default DiscoveryPage
