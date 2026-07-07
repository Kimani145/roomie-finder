import React from 'react'
import { Link } from 'react-router-dom'
import { Flame, ShieldCheck } from 'lucide-react'
import type { MatchResult } from '@/types'
import { getCompatibilityPercentage } from '@/engine/compatibilityEngine'
import { getMatchBadgeClasses } from '@/utils/formatters'
import { timeAgo } from '@/utils/dateUtils'
import { useAuthStore } from '@/store/authStore'

interface ListingCardProps {
  match: MatchResult
  showMatchBadge?: boolean
  onPrimaryAction?: (
    targetId: string,
    event?: React.MouseEvent<HTMLElement>
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

const getOccupancyDetails = (housingType: string) => {
  if (
    housingType.toLowerCase().includes('double') ||
    housingType.toLowerCase().includes('2 bedroom') ||
    housingType.toLowerCase().includes('shared')
  ) {
    return '1 of 2 spots filled'
  }
  return 'Immediate Vacancy'
}

export const ListingCard: React.FC<ListingCardProps> = ({
  match,
  showMatchBadge = true,
  onPrimaryAction,
}) => {
  const { currentUser } = useAuthStore()
  const isGuest = !currentUser

  const { profile, listing, compatibilityScore } = match
  if (!profile) return null

  const interestCount = listing?.interestCount ?? 0
  const compatibilityPct = getCompatibilityPercentage(compatibilityScore)
  const heroPhoto = listing?.photos?.[0]
  const zone = listing?.zone ?? profile.zones?.[0] ?? '—'
  const housingType = listing?.housingType ?? profile.preferredRoomType ?? '—'
  const occupancyText = getOccupancyDetails(housingType)

  return (
    <Link
      to={`/profile/${profile.uid}`}
      onClick={(event) => onPrimaryAction?.(profile.uid, event)}
      className="group block overflow-hidden rounded-nest border border-slate-200 dark:border-white/10 bg-white/80 dark:bg-slate-800/90 backdrop-blur-xl shadow-lg transition-all hover:-translate-y-1 hover:shadow-2xl focus-visible:ring-2 focus-visible:ring-brand-600 focus-visible:ring-offset-2 focus-visible:ring-offset-transparent"
    >
      <div className="relative shrink-0 overflow-hidden">
        {/* Photo with blur for Guest, normal for User */}
        {heroPhoto ? (
          <img
            src={heroPhoto}
            alt="Room listing"
            className={[
              'h-48 sm:h-56 w-full object-cover shrink-0 transition-transform duration-500 group-hover:scale-105',
              isGuest ? 'filter blur-md brightness-75 scale-105' : '',
            ].join(' ')}
          />
        ) : (
          <div className="h-48 sm:h-56 w-full bg-slate-200 dark:bg-slate-700 shrink-0" />
        )}

        {/* Guest View Photo Overlay */}
        {isGuest && (
          <div className="absolute inset-0 bg-slate-950/50 backdrop-blur-[2px] flex items-center justify-center text-center p-3 z-10">
            <span className="text-white text-xs font-bold px-3 py-2 border border-white/20 bg-slate-900/60 rounded-xl backdrop-blur-md">
              Sign up to view photos & contact host
            </span>
          </div>
        )}

        {/* TUK Student Verification Badges (Emphasized for Trust) */}
        <div className="absolute top-3 right-3 flex flex-col gap-1 items-end z-10">
          <span className="bg-brand-600/95 backdrop-blur-md text-[#F9FAFB] text-[10px] font-bold px-2.5 py-1 rounded-lg uppercase tracking-wider shadow-sm flex items-center gap-1">
            <ShieldCheck className="w-3.5 h-3.5" />
            Verified Student
          </span>
          <span className="bg-slate-900/85 backdrop-blur-md text-[#CBD5E1] text-[9px] font-bold px-1.5 py-0.5 rounded-md shadow-sm">
            Technical University of Kenya
          </span>
        </div>

        {listing?.createdAt && (
          <div className="absolute top-3 left-3 bg-slate-900/80 backdrop-blur-md text-white text-xs font-medium px-2.5 py-1 rounded-lg z-10">
            {timeAgo(listing.createdAt)}
          </div>
        )}

        {/* Rent pricing badge - Blurred for Guest, clear for User */}
        <div className="absolute bottom-3 left-3 rounded-full bg-white/95 dark:bg-slate-900/90 border border-slate-200 dark:border-white/20 px-3 py-1 text-xs font-bold text-slate-900 dark:text-white shadow-sm z-10">
          {isGuest ? (
            <span>
              KES <span className="blur-[4px] select-none font-black">X,XXX</span> / match
            </span>
          ) : (
            <span>{formatCurrency(listing?.roommateShare)} / match</span>
          )}
        </div>
      </div>

      <div className="p-4 flex-1 flex flex-col justify-between gap-3">
        <div className="space-y-1">
          {/* Total pricing - Blurred for Guest, clear for User */}
          <div className="text-sm font-bold text-slate-900 dark:text-slate-50 break-words line-clamp-1">
            {isGuest ? (
              <span>
                KES <span className="blur-[4px] select-none">XX,XXX</span> total
              </span>
            ) : (
              <span>{formatCurrency(listing?.rentTotal)} total</span>
            )}
          </div>

          <div className="text-xs text-slate-500 dark:text-slate-400 break-words line-clamp-1 font-medium">
            {zone} • {housingType}
          </div>

          {/* Occupancy and Vacancy Status */}
          <div className="flex flex-wrap gap-1.5 mt-2">
            <span className="inline-flex items-center text-emerald-600 dark:text-emerald-400 text-[10px] font-bold bg-emerald-50 dark:bg-emerald-500/10 px-2 py-1 rounded-md border border-emerald-100 dark:border-emerald-500/20">
              {occupancyText}
            </span>
            {listing && !isGuest && (
              <div className="flex items-center gap-1 text-amber-600 dark:text-amber-500 text-[10px] font-bold bg-amber-50 dark:bg-amber-500/10 px-2 py-1 rounded-md border border-amber-100 dark:border-amber-500/20">
                <Flame className="w-3 h-3" />
                <span>
                  {interestCount} {interestCount === 1 ? 'person' : 'people'} interested
                </span>
              </div>
            )}
          </div>

          {/* Blurred Description Preview for Guest */}
          {isGuest && (
            <p className="text-[11px] text-slate-400 dark:text-slate-500 filter blur-[3.5px] select-none mt-2 leading-relaxed">
              Quiet clean compound with instant hot shower and security guard near TUK.
            </p>
          )}
        </div>

        {/* Host Profile Info Row */}
        <div className="flex items-center justify-between pt-3 border-t border-slate-200 dark:border-slate-700/50">
          <div className="flex items-center gap-2 min-w-0">
            {isGuest ? (
              <>
                <div className="h-7 w-7 rounded-full bg-slate-200 dark:bg-slate-700 text-slate-400 dark:text-slate-500 text-xs font-semibold flex items-center justify-center">
                  ?
                </div>
                <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">
                  Host (Student)
                </span>
              </>
            ) : (
              <>
                {profile.photoURL ? (
                  <img
                    src={profile.photoURL}
                    alt={profile.displayName}
                    className="h-7 w-7 rounded-full object-cover"
                  />
                ) : (
                  <div className="h-7 w-7 rounded-full bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-200 text-xs font-semibold flex items-center justify-center">
                    {getInitials(profile.displayName)}
                  </div>
                )}
                <span className="text-xs font-medium text-slate-700 dark:text-slate-200 break-words line-clamp-1">
                  {profile.displayName}
                </span>
              </>
            )}
          </div>

          {/* Compatibility Match Badge - Hidden for Guest, shown for User */}
          {!isGuest && showMatchBadge && (
            <span
              className={`ml-2 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider rounded-full ${getMatchBadgeClasses(
                compatibilityScore
              )}`}
            >
              {compatibilityPct}% Match
            </span>
          )}
        </div>

        {/* Direct communication CTA placeholder for Guest */}
        {isGuest && (
          <button
            type="button"
            disabled
            className="w-full mt-1.5 py-2 bg-slate-100 dark:bg-slate-800 text-slate-400 dark:text-slate-500 text-xs font-semibold rounded-xl border border-slate-200 dark:border-slate-700/50 cursor-not-allowed text-center transition-all"
          >
            Sign up to contact host
          </button>
        )}
      </div>
    </Link>
  )
}
