import React from 'react'
import { Link } from 'react-router-dom'
import { Flame } from 'lucide-react'
import type { MatchResult } from '@/types'
import { getCompatibilityPercentage } from '@/engine/compatibilityEngine'
import { getMatchBadgeClasses } from '@/utils/formatters'
import { timeAgo } from '@/utils/dateUtils'

interface ListingCardProps {
  match: MatchResult
  showMatchBadge?: boolean
  onPrimaryAction?: (
    targetId: string,
    event: React.MouseEvent<HTMLAnchorElement>
  ) => void
}

const formatCurrency = (value?: number) =>
  typeof value === 'number' ? `KES ${value.toLocaleString()}` : 'KES —'

const getInitials = (name?: string) => {
  if (!name) return '?'
  return name
    .split(' ')
    .filter(Boolean)
    .map((word) => word[0])
    .join('')
    .toUpperCase()
    .slice(0, 2)
}

export const ListingCard: React.FC<ListingCardProps> = ({
  match,
  showMatchBadge = true,
  onPrimaryAction,
}) => {
  const { profile, listing, compatibilityScore } = match
  if (!profile) return null

  const interestCount = listing?.interestCount ?? 0

  const compatibilityPct = getCompatibilityPercentage(compatibilityScore)
  const heroPhoto = listing?.photos?.[0]
  const zone = listing?.zone ?? profile.zones?.[0] ?? '—'
  const housingType = listing?.housingType ?? profile.preferredRoomType ?? '—'

  return (
    <Link
      to={`/profile/${profile.uid}`}
      onClick={(event) => onPrimaryAction?.(profile.uid, event)}
      className="group bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl shadow-sm overflow-hidden flex flex-col h-full transition-shadow hover:shadow-md outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 focus-visible:ring-offset-white dark:focus-visible:ring-offset-slate-900"
    >
      <div className="relative shrink-0">
        {heroPhoto ? (
          <img
            src={heroPhoto}
            alt={`${profile.displayName} listing`}
            className="h-48 sm:h-56 w-full object-cover shrink-0 transition-transform duration-500 group-hover:scale-105"
          />
        ) : (
          <div className="h-48 sm:h-56 w-full bg-slate-200 dark:bg-slate-600 shrink-0" />
        )}

        {listing?.createdAt && (
          <div className="absolute top-3 left-3 bg-slate-900/80 backdrop-blur-md text-white text-xs font-medium px-2.5 py-1 rounded-lg">
            {timeAgo(listing.createdAt)}
          </div>
        )}

        <div className="absolute bottom-3 left-3 rounded-full bg-white/95 dark:bg-slate-800/95 border border-slate-200 dark:border-slate-600 px-3 py-1 text-xs font-semibold text-slate-900 dark:text-slate-50 shadow-sm">
          {formatCurrency(listing?.roommateShare)} / roommate
        </div>
      </div>

      <div className="p-4 flex-1 flex flex-col justify-between gap-3">
        <div className="space-y-1">
          <div className="text-sm font-bold text-slate-900 dark:text-slate-50 break-words line-clamp-2">
            {formatCurrency(listing?.rentTotal)} total
          </div>
          <div className="text-xs text-slate-500 dark:text-slate-400 break-words line-clamp-2">
            {zone} • {housingType}
          </div>
          {listing && (
            <div className="flex items-center gap-1.5 mt-3 text-amber-600 dark:text-amber-500 text-xs font-bold bg-amber-50 dark:bg-amber-500/10 px-2 py-1.5 rounded-md w-fit">
              <Flame className="w-3.5 h-3.5" />
              <span>
                {interestCount} {interestCount === 1 ? 'person' : 'people'} interested
              </span>
            </div>
          )}
        </div>

        <div className="flex items-center justify-between pt-2 border-t border-slate-200 dark:border-slate-600">
          <div className="flex items-center gap-2 min-w-0">
            {profile.photoURL ? (
              <img
                src={profile.photoURL}
                alt={profile.displayName}
                className="h-7 w-7 rounded-full object-cover"
              />
            ) : (
              <div className="h-7 w-7 rounded-full bg-slate-200 dark:bg-slate-600 text-slate-600 dark:text-slate-200 text-xs font-semibold flex items-center justify-center">
                {getInitials(profile.displayName)}
              </div>
            )}
            <span className="text-xs font-medium text-slate-700 dark:text-slate-200 break-words line-clamp-1">
              {profile.displayName}
            </span>
          </div>
          {showMatchBadge && (
            <span
              className={`ml-2 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider rounded-full ${getMatchBadgeClasses(
                compatibilityScore
              )}`}
            >
              {compatibilityPct}% Match
            </span>
          )}
        </div>
      </div>
    </Link>
  )
}
