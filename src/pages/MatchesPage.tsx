import React, { useEffect } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { Users, MessageSquare } from 'lucide-react'
import { useMatches, HydratedMatch } from '@/hooks/useMatches'
import { Skeleton } from '@/components/ui/Skeleton'
import { getCompatibilityPercentage } from '@/engine/compatibilityEngine'
import {
  formatBudget,
  formatCourseYear,
  formatTimeAgo,
  getMatchBadgeClasses,
} from '@/utils/formatters'
import { useNotificationStore } from '@/store/notificationStore'

const MatchListItemSkeleton: React.FC = () => (
  <div className="flex items-center justify-between p-4 bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-2xl shadow-sm overflow-hidden mb-4">
    <div className="flex items-center space-x-4">
      <Skeleton className="w-16 h-16 rounded-full bg-slate-200 dark:bg-slate-700" />
      <div className="space-y-2">
        <Skeleton className="h-4 w-40 bg-slate-200 dark:bg-slate-700" />
        <Skeleton className="h-3 w-24 bg-slate-200 dark:bg-slate-700" />
      </div>
    </div>
    <Skeleton className="h-10 w-24 rounded-xl bg-slate-200 dark:bg-slate-700" />
  </div>
)

const formatMoveIn = (moveInMonth?: string | null) => {
  if (!moveInMonth) return 'Flexible move-in'

  const date = new Date(`${moveInMonth}-01`)
  if (Number.isNaN(date.getTime())) return moveInMonth

  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    year: 'numeric',
  }).format(date)
}

const MatchListItem: React.FC<{ match: HydratedMatch }> = ({ match }) => {
  const navigate = useNavigate()
  const location = useLocation()
  const { otherUser, listing } = match
  const compatibilityPct = getCompatibilityPercentage(match.compatibilityScore)
  const primaryZone = listing?.zone ?? otherUser.zones?.[0] ?? '—'

  const summaryLabel =
    otherUser.role === 'HOST'
      ? [
          listing?.housingType ?? 'Host',
          primaryZone,
          listing ? `KES ${listing.roommateShare.toLocaleString()}/roommate` : null,
        ]
          .filter(Boolean)
          .join(' • ')
      : otherUser.role === 'SEEKER'
        ? `${formatBudget(otherUser.minBudget, otherUser.maxBudget)} • ${formatMoveIn(
            otherUser.moveInMonth
          )}`
        : `Flexible • ${primaryZone}`

  const metaLabel = [formatCourseYear(otherUser.courseYear), `Matched ${formatTimeAgo(match.createdAt)}`]
    .filter(Boolean)
    .join(' • ')

  const handleMessageClick = () => {
    navigate(`/chat/${match.matchId}`, {
      state: { from: location.pathname },
    })
  }

  return (
    <div className="flex items-center justify-between p-4 bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-2xl shadow-sm hover:shadow-md transition-shadow mb-4 overflow-hidden">
      <div className="flex items-center space-x-4">
        <Link
          to={`/profile/${otherUser.uid}`}
          onClick={(e) => e.stopPropagation()}
          className="shrink-0"
        >
          {otherUser.photoURL ? (
            <img
              src={otherUser.photoURL}
              alt={otherUser.displayName}
              className="w-12 h-12 rounded-full object-cover hover:opacity-80 transition-opacity"
            />
          ) : (
            <div className="w-12 h-12 rounded-full bg-brand-50 dark:bg-brand-900/30 border border-brand-100 dark:border-brand-700/40 flex items-center justify-center text-brand-700 dark:text-brand-200 font-syne font-bold text-lg shrink-0 hover:opacity-80 transition-opacity">
              {(otherUser?.displayName || 'User').charAt(0).toUpperCase()}
            </div>
          )}
        </Link>
        <div className="space-y-1">
          <div className="flex items-center flex-wrap gap-2">
            <h3 className="font-bold font-syne text-lg text-slate-900 dark:text-slate-50 flex items-center">
              {otherUser.displayName}
            </h3>
            <span
              className={`ml-2 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider rounded-full ${getMatchBadgeClasses(
                match.compatibilityScore
              )}`}
            >
              {compatibilityPct}% Match
            </span>
          </div>
          <span className="text-xs text-brand-600 dark:text-brand-400 font-medium">
            {summaryLabel}
          </span>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            {metaLabel}
          </p>
        </div>
      </div>
      <button
        onClick={handleMessageClick}
        className="bg-blue-500 text-white font-semibold py-2 px-4 rounded-xl hover:bg-blue-600 transition-colors flex items-center space-x-2"
      >
        <MessageSquare className="w-4 h-4" />
        <span>Message</span>
      </button>
    </div>
  )
}

const MatchesPage: React.FC = () => {
  const navigate = useNavigate()
  const { matches, isLoading, error } = useMatches()
  const clearUnreadMatches = useNotificationStore((state) => state.clearUnreadMatches)

  useEffect(() => {
    clearUnreadMatches()
  }, [clearUnreadMatches])

  const renderContent = () => {
    if (isLoading) {
      return (
        <div>
          <MatchListItemSkeleton />
          <MatchListItemSkeleton />
          <MatchListItemSkeleton />
        </div>
      )
    }

    if (error) {
      return (
        <div className="text-center py-20 text-red-500 dark:text-red-400">
          <p>Sorry, we couldn't load your matches. Please try again later.</p>
        </div>
      )
    }

    if (!isLoading && matches.length === 0) {
      return (
        <div className="flex flex-col items-center justify-center py-20">
          <Users className="w-16 h-16 text-slate-300 dark:text-slate-600 mb-4" />
          <h2 className="text-xl font-semibold text-slate-800 dark:text-slate-100 mb-2">
            Your colony is quiet right now.
          </h2>
          <p className="text-slate-600 dark:text-slate-400 text-center max-w-md mb-6">
            Adjust your filters or check back later as more people join the nest.
          </p>
          <button
            type="button"
            onClick={() => navigate('/discover')}
            className="mt-2 inline-flex items-center justify-center rounded-xl bg-blue-500 px-5 py-3 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-blue-600"
          >
            Find Your Match
          </button>
        </div>
      )
    }

    return (
      <div>
        {matches
          .sort(
            (a, b) =>
              new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
          )
          .map((match) => (
            <MatchListItem key={match.matchId} match={match} />
          ))}
      </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-syne font-bold text-slate-900 dark:text-slate-50">
          Your Matches
        </h1>
        <p className="text-slate-500 dark:text-slate-400">
          {matches.length} Connections
        </p>
      </div>
      {renderContent()}
    </div>
  )
}

export default MatchesPage
