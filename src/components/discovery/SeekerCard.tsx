import React from 'react'
import { Link } from 'react-router-dom'
import type { MatchResult } from '@/types'
import { formatBudget, getMatchBadgeClasses } from '@/utils/formatters'
import { getCompatibilityPercentage } from '@/engine/compatibilityEngine'

interface SeekerCardProps {
  match: MatchResult
  showMatchBadge?: boolean
  onPrimaryAction?: (
    targetId: string,
    event: React.MouseEvent<HTMLAnchorElement>
  ) => void
}

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

const formatMoveIn = (moveInMonth?: string | null) => {
  if (!moveInMonth) return 'Flexible'
  const date = new Date(`${moveInMonth}-01`)
  if (Number.isNaN(date.getTime())) return moveInMonth
  return new Intl.DateTimeFormat('en-US', { month: 'short', year: 'numeric' }).format(
    date
  )
}

export const SeekerCard: React.FC<SeekerCardProps> = ({
  match,
  showMatchBadge = true,
  onPrimaryAction,
}) => {
  const { profile, compatibilityScore, scoreBreakdown } = match
  if (!profile) return null;
  
  const compatibilityPct = getCompatibilityPercentage(compatibilityScore)

  const overlapPills = [
    scoreBreakdown?.sleepMatch > 0 ? `Sleep: ${profile.lifestyle?.sleepTime}` : null,
    scoreBreakdown?.cleanlinessMatch > 0
      ? `Cleanliness: ${profile.lifestyle?.cleanlinessLevel}`
      : null,
    scoreBreakdown?.noiseMatch > 0 ? `Noise: ${profile.lifestyle?.noiseTolerance}` : null,
    scoreBreakdown?.guestMatch > 0 ? `Guests: ${profile.lifestyle?.guestFrequency}` : null,
    scoreBreakdown?.studyMatch > 0 ? `Study: ${profile.lifestyle?.studyStyle}` : null,
    profile.dealBreakers?.noSmokingRequired ? 'No Smoking' : null,
    profile.dealBreakers?.noAlcoholRequired ? 'No Alcohol' : null,
  ]
    .filter((pill): pill is string => Boolean(pill))
    .slice(0, 6)

  return (
    <Link
      to={`/profile/${profile.uid}`}
      onClick={(event) => onPrimaryAction?.(profile.uid, event)}
      className="group block bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-2xl shadow-sm overflow-hidden transition-shadow hover:shadow-md outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 focus-visible:ring-offset-white dark:focus-visible:ring-offset-slate-900"
    >
      <div className="p-5 flex flex-col gap-4">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-center gap-4 min-w-0">
            {profile.photoURL ? (
              <img
                src={profile.photoURL}
                alt={profile.displayName}
                className="w-16 h-16 rounded-full object-cover"
              />
            ) : (
              <div className="w-16 h-16 rounded-full bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-200 text-xl font-semibold flex items-center justify-center">
                {getInitials(profile.displayName)}
              </div>
            )}
            <div className="min-w-0">
              <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-50 truncate">
                {profile.displayName}
              </h3>
              <p className="text-sm text-slate-500 dark:text-slate-400">
                Year {profile.courseYear} • {profile.school}
              </p>
            </div>
          </div>
          {showMatchBadge && (
            <span
              className={`shrink-0 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider rounded-full ${getMatchBadgeClasses(
                compatibilityScore
              )}`}
            >
              {compatibilityPct}% Match
            </span>
          )}
        </div>

        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Budget Range
            </p>
            <p className="font-semibold text-slate-900 dark:text-slate-50">
              {formatBudget(profile.minBudget, profile.maxBudget)}
            </p>
          </div>
          <div>
            <p className="text-xs text-slate-500 dark:text-slate-400">Move-in</p>
            <p className="font-semibold text-slate-900 dark:text-slate-50">
              {formatMoveIn(profile.moveInMonth)}
            </p>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-2">
          {overlapPills.length > 0 ? (
            overlapPills.map((pill) => (
              <span
                key={pill}
                className="px-2 py-1 rounded-full bg-slate-100 text-slate-600 dark:bg-slate-700/60 dark:text-slate-200 text-[11px] font-medium text-center"
              >
                {pill}
              </span>
            ))
          ) : (
            <span className="text-xs text-slate-500 dark:text-slate-400">
              No overlap signals yet.
            </span>
          )}
        </div>
      </div>
    </Link>
  )
}
