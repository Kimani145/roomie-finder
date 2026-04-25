import React, { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { SearchX, ChevronDown } from 'lucide-react'
import { useDiscovery } from '@/hooks/useDiscovery'
import { useDiscoveryStore } from '@/store/discoveryStore'
import { useAuthStore } from '@/store/authStore'
import { useMatches } from '@/hooks/useMatches'
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
    updateFilter,
  } = useDiscoveryStore()
  
  const { matches } = useMatches()
  const [viewMode, setViewMode] = useState<'rooms' | 'roommates'>('rooms')
  const [filterZone, setFilterZone] = useState<string>(filters.zones?.[0] ?? 'All')
  const [filterMaxBudget, setFilterMaxBudget] = useState<number>(
    filters.maxBudget ?? 50000
  )
  const [isAuthModalOpen, setAuthModalOpen] = useState(false)

  useEffect(() => {
    runDiscovery()
  }, [currentUser, filters, runDiscovery])

  useEffect(() => {
    if (filters.maxBudget === null) {
      updateFilter('maxBudget', filterMaxBudget)
    }
  }, [filterMaxBudget, filters.maxBudget, updateFilter])

  useEffect(() => {
    const THRESHOLD = 70
    const handleScroll = () => {
      const current = window.scrollY

      const pill = document.getElementById('filterPill')
      const bar = document.getElementById('filterBar')

      if (!pill || !bar) return

      if (current > THRESHOLD) {
        bar.style.opacity = '0'
        bar.style.maxHeight = '0px'
        pill.style.opacity = '1'
        pill.style.pointerEvents = 'auto'
        pill.style.transform = 'translate(-50%, 12px)'
      } else {
        bar.style.opacity = '1'
        bar.style.maxHeight = '200px'
        pill.style.opacity = '0'
        pill.style.pointerEvents = 'none'
        pill.style.transform = 'translate(-50%, 100%)'
      }
    }

    handleScroll()

    window.addEventListener('scroll', handleScroll, { passive: true })
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

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

  const handleZoneChange = (value: string) => {
    setFilterZone(value)
    updateFilter('zones', value === 'All' ? null : [value as TukZone])
  }

  const handleBudgetChange = (value: number) => {
    setFilterMaxBudget(value)
    updateFilter('maxBudget', value)
  }

  const handleFilterPillClick = () => {
    const bar = document.getElementById('filterBar')
    const pill = document.getElementById('filterPill')

    if (bar && pill) {
      bar.style.opacity = '1'
      bar.style.maxHeight = '200px'
      pill.style.opacity = '0'
      pill.style.pointerEvents = 'none'
      pill.style.transform = 'translate(-50%, 100%)'
    }

    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  return (
    <div className="min-h-full bg-transparent">
      <div className="sticky top-0 z-40 border-b border-slate-200/80 bg-white/60 px-4 py-4 shadow-sm backdrop-blur-xl dark:border-white/10 dark:bg-[#0f1325]/72 sm:px-6">
        <div className="max-w-6xl mx-auto flex flex-col gap-4 relative">
          {/* 1. The Toggle */}
          <div className="flex justify-center shrink-0">
            {canToggleView && (
              <div className="card-surface-soft card-surface-thatch flex rounded-nest p-1">
                <button
                  type="button"
                  onClick={() => setViewMode('rooms')}
                  className={`px-6 py-2 rounded-lg text-sm font-semibold transition-colors ${
                    viewMode === 'rooms'
                      ? 'bg-white/75 text-slate-900 shadow-sm dark:bg-[#182033]/85 dark:text-slate-50'
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
                      ? 'bg-white/75 text-slate-900 shadow-sm dark:bg-[#182033]/85 dark:text-slate-50'
                      : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'
                  }`}
                >
                  View Matches
                </button>
              </div>
            )}
          </div>

          {/* 2. The Full Filter Bar */}
          <div
            id="filterBar"
            className="transition-all duration-300 origin-top overflow-hidden"
          >
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <label className="card-surface-soft card-surface-cello flex items-center gap-2 rounded-xl px-3 py-2 text-sm text-slate-700 dark:text-slate-200">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                  Zone
                </span>
                <select
                  value={filterZone}
                  onChange={(e) => handleZoneChange(e.target.value)}
                  className="ml-auto w-full max-w-[170px] rounded-md border border-slate-200/80 bg-white/70 px-2 py-1 text-sm outline-none focus:border-weaver-purple dark:border-white/10 dark:bg-slate-950/40"
                >
                  <option value="All">All</option>
                  {TUK_ZONES.map((zone) => (
                    <option key={zone} value={zone}>
                      {zone}
                    </option>
                  ))}
                </select>
              </label>

              <label className="card-surface-soft card-surface-wine rounded-xl px-3 py-2 text-sm text-slate-700 dark:text-slate-200">
                <div className="mb-1 flex items-center justify-between">
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                    Max Budget
                  </span>
                  <span className="text-xs font-semibold text-weaver-purple dark:text-nest-accent">
                    KES {filterMaxBudget.toLocaleString()}
                  </span>
                </div>
                <input
                  type="range"
                  min={3000}
                  max={50000}
                  step={500}
                  value={filterMaxBudget}
                  onChange={(e) => handleBudgetChange(Number(e.target.value))}
                  className="w-full accent-weaver-purple"
                />
              </label>
            </div>

            <div className="mt-3 flex items-center justify-between">
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
                    ? 'match'
                    : 'matches'}{' '}
                found
              </span>
            </div>
          </div>

          {/* 3. The Hovering Pill (Only visible on scroll) */}
          <div id="filterPill" className="absolute bottom-0 left-1/2 -translate-x-1/2 translate-y-full opacity-0 pointer-events-none transition-all duration-300 z-50">
            <button
              type="button"
              onClick={handleFilterPillClick}
              className="card-surface-soft card-surface-cello flex items-center gap-2 rounded-full px-4 py-2 text-sm font-semibold text-slate-700 shadow-lg dark:text-slate-200"
            >
              <span>
                {filters.zones?.[0] || 'All Zones'} • KES{' '}
                {(filters.maxBudget ?? filterMaxBudget) / 1000}k ▾
              </span>
              <ChevronDown className="w-4 h-4 text-slate-400" />
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 pt-4 pb-4">
        {/* Relaxed filter notice */}
        {hasRelaxedFilters && displayedResults.length > 0 && (
          <div className="mb-5 rounded-xl border border-amber-500/30 dark:border-amber-400/40 bg-amber-50 dark:bg-amber-950/30 px-4 py-3 text-sm text-amber-700 dark:text-amber-200">
            <span className="font-semibold">No perfect matches found.</span>{' '}
            Showing closest compatible {activeViewMode === 'rooms' ? 'listings' : 'matches'}.
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
              Your colony is quiet right now.
            </h3>
            <p className="text-slate-500 dark:text-slate-400 max-w-md mx-auto mb-8">
              Adjust your filters or check back later as more people join the nest.
            </p>

            <div className="flex flex-col sm:flex-row gap-4">
              {filterZone !== 'All' && (
                <button
                  onClick={() => handleZoneChange('All')}
                  className="px-6 py-3 bg-gradient-to-r from-weaver-purple to-weaver-orange text-white font-bold rounded-nest transition-all hover:opacity-90 shadow-lg shadow-weaver-purple/20 active:scale-95"
                >
                  Search All Zones
                </button>
              )}
              <button
                onClick={() =>
                  handleBudgetChange(Math.min(filterMaxBudget + 3000, 50000))
                }
                className="px-6 py-3 border-2 border-slate-200 dark:border-weaver-purple/30 text-slate-700 dark:text-nest-light font-bold rounded-nest hover:bg-weaver-purple/10 dark:hover:bg-weaver-dark transition-all active:scale-95"
              >
                Expand Budget (+KES 3,000)
              </button>
            </div>
          </div>
        )}

        {/* Ranked feed - Split Pane Desktop Layout */}
        {!isLoading && displayedResults.length > 0 && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 max-w-7xl mx-auto">
            {/* Left Column: Active Grid / Swipes */}
            <div className="col-span-1 lg:col-span-2 grid grid-cols-1 sm:grid-cols-2 gap-6">
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

            {/* Right Column: Context Intelligence Panel (Desktop Only) */}
            <div className="hidden lg:block space-y-4">
              <div className="card-surface card-surface-thatch sticky top-36 rounded-nest p-6">
                <h3 className="text-lg font-bold text-slate-900 dark:text-slate-50 mb-4 drop-shadow-sm">System Intelligence</h3>

                {!(candidates?.length > 0 || matches?.length > 0) ? (
                  <div className="flex flex-col items-center justify-center py-6 text-center">
                    <div className="w-10 h-10 rounded-full bg-white/50 dark:bg-slate-800 flex items-center justify-center mb-3 shadow-inner">
                      <span className="text-xl animate-pulse">📡</span>
                    </div>
                    <p className="text-sm font-bold text-slate-700 dark:text-slate-300">Calibrating Engine...</p>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-2 font-medium">
                      Start swiping to generate your personalized ecosystem report.
                    </p>
                  </div>
                ) : (
                  <ul className="space-y-4 text-sm font-medium">
                    {candidates?.length > 0 && (
                      <li className="flex items-start gap-3 text-slate-700 dark:text-slate-300">
                        <span className="text-weaver-orange mt-0.5">✦</span> 
                        <div>
                          Analyzed <span className="font-bold text-weaver-purple dark:text-white">{candidates.length}</span> profiles based on your lifestyle parameters.
                        </div>
                      </li>
                    )}
                    {matches?.length > 0 && (
                      <li className="flex items-start gap-3 text-slate-700 dark:text-slate-300">
                        <span className="text-weaver-verte mt-0.5">✦</span> 
                        <div>
                          You have <span className="font-bold text-weaver-verte">{matches.length}</span> active connections in the colony.
                        </div>
                      </li>
                    )}
                  </ul>
                )}
              </div>
            </div>
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
