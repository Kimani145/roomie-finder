import React from 'react'
import { Link } from 'react-router-dom'
import type { MatchResult } from '@/types'
import { formatBudget, getMatchTierMeta } from '@/utils/formatters'
import { getCompatibilityPercentage } from '@/engine/compatibilityEngine'

interface SeekerCardProps {
  match: MatchResult
  showMatchBadge?: boolean
  onPrimaryAction?: (
    targetId: string,
    event?: React.MouseEvent<HTMLElement>
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
  const [isDismissed, setIsDismissed] = React.useState(false)
  const { profile, compatibilityScore, scoreBreakdown } = match
  if (!profile) return null
  if (isDismissed) return null

  const compatibilityPct = getCompatibilityPercentage(compatibilityScore)
  const tier = getMatchTierMeta(compatibilityScore)
  const primaryZone = profile.zones?.[0] ?? 'Anywhere'

  const traitSignals = scoreBreakdown.matchedFactors
    .filter(
      (factor) =>
        factor.startsWith('Sleep schedule overlap:') ||
        factor.startsWith('Cleanliness alignment:') ||
        factor.startsWith('Noise tolerance match:') ||
        factor.startsWith('Guest frequency match:') ||
        factor.startsWith('Study style match:')
    )
    .slice(0, 2)
    .map((factor) => {
      if (factor.startsWith('Sleep schedule overlap:')) {
        const sleep = factor.split(': ')[1]?.split('/')[1] ?? profile.lifestyle.sleepTime
        return `Sleeps ${sleep} (Matches you)`
      }
      if (factor.startsWith('Cleanliness alignment:')) {
        const cleanliness = factor.split(': ')[1] ?? profile.lifestyle.cleanlinessLevel
        return `${cleanliness} Cleanliness (Matches you)`
      }
      if (factor.startsWith('Noise tolerance match:')) {
        const noise = factor.split(': ')[1] ?? profile.lifestyle.noiseTolerance
        return `${noise} Noise Tolerance (Matches you)`
      }
      if (factor.startsWith('Guest frequency match:')) {
        const guests = factor.split(': ')[1] ?? profile.lifestyle.guestFrequency
        return `${guests} Guest Frequency (Matches you)`
      }
      const study = factor.split(': ')[1] ?? profile.lifestyle.studyStyle
      return `${study} Study Style (Matches you)`
    })

  const actionCallout =
    compatibilityPct >= 90
      ? 'PERFECT FIT FOR YOU'
      : compatibilityPct >= 75
        ? 'HIGH MATCH - CHECK DETAILS'
        : 'FAIR MATCH - REVIEW PROFILE'

  return (
    <article className="card-surface card-surface-wine group flex h-full flex-col overflow-hidden rounded-nest transition-all hover:-translate-y-1 hover:shadow-2xl">
      <div className="relative p-6 flex flex-col gap-5">
        <div className="absolute top-0 right-0 h-32 w-32 bg-brand-100/30 blur-2xl rounded-full pointer-events-none dark:hidden" />
        <div className="flex items-center justify-between gap-3 relative z-10">
          <div className="flex items-center gap-3 min-w-0">
            {profile.photoURL ? (
              <img
                src={profile.photoURL}
                alt={profile.displayName}
                className="h-14 w-14 rounded-full object-cover border border-slate-200 dark:border-slate-700/50"
              />
            ) : (
              <div className="h-14 w-14 rounded-full bg-slate-200 dark:bg-slate-700/50 text-slate-600 dark:text-slate-200 text-lg font-semibold flex items-center justify-center border border-slate-200 dark:border-slate-700/50">
                {getInitials(profile.displayName)}
              </div>
            )}
            <div className="min-w-0">
              <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100 truncate">
                {profile.displayName}, {profile.age} • {profile.school} Year {profile.courseYear}
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                {tier.label}
              </p>
            </div>
          </div>
          {showMatchBadge && (
            <span
              className={`shrink-0 rounded-2xl px-3.5 py-1.5 text-[11px] font-black uppercase tracking-widest shadow-sm ${tier.classes} border border-current/20 backdrop-blur-md`}
            >
              {compatibilityPct}% {tier.label}
            </span>
          )}
        </div>

        <div className="relative z-10 rounded-2xl border border-slate-200/50 bg-gradient-to-r from-amber-50 to-amber-100/50 p-4 text-sm font-black uppercase tracking-widest text-amber-700 shadow-[inset_0_2px_4px_rgba(255,255,255,1)] dark:border-amber-500/20 dark:from-amber-500/10 dark:to-amber-500/5 dark:text-amber-300 dark:shadow-none transition-transform hover:scale-[1.01]">
          {actionCallout}
        </div>

        <p className="relative z-10 text-[15px] font-bold text-slate-800 dark:text-slate-200">
          {formatBudget(profile.minBudget, profile.maxBudget)} • {primaryZone}
        </p>

        <div className="card-surface-soft card-surface-thatch relative z-10 space-y-2 rounded-2xl p-4">
          {traitSignals.length > 0 ? (
            traitSignals.map((trait) => (
              <div key={trait} className="flex items-center gap-2">
                <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.8)]" />
                <p className="text-sm font-medium text-slate-800 dark:text-slate-200">
                  {trait}
                </p>
              </div>
            ))
          ) : (
            <div className="flex items-center gap-2">
              <div className="w-1.5 h-1.5 rounded-full bg-slate-300 dark:bg-slate-600" />
              <p className="text-sm font-medium text-slate-500 dark:text-slate-400">
                Compatibility signals are still building
              </p>
            </div>
          )}
        </div>

        <p className="relative z-10 text-[13px] font-semibold tracking-wide text-slate-500 dark:text-slate-400 mt-1">
          Move-in: <span className="font-bold text-slate-700 dark:text-slate-300">{formatMoveIn(profile.moveInMonth)}</span>
        </p>
      </div>

      <div className="card-surface-soft card-surface-cello mt-auto grid grid-cols-2 gap-4 border-x-0 border-b-0 border-t p-5">
        <button
          type="button"
          onClick={() => setIsDismissed(true)}
          className="h-14 rounded-2xl border-2 border-slate-200 bg-white text-slate-700 shadow-sm font-black tracking-widest hover:border-slate-300 hover:bg-slate-50 hover:shadow-md active:scale-95 transition-all duration-200 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800"
        >
          PASS
        </button>
        <Link
          to={`/profile/${profile.uid}`}
          onClick={(event) => onPrimaryAction?.(profile.uid, event)}
          className="h-14 rounded-nest bg-gradient-to-r from-weaver-purple to-weaver-orange text-white shadow-[0_8px_20px_rgba(102,56,182,0.3)] font-black tracking-widest hover:opacity-90 hover:shadow-[0_12px_24px_rgba(102,56,182,0.4)] active:scale-95 transition-all duration-200 flex items-center justify-center border border-weaver-purple/50"
        >
          LIKE
        </Link>
      </div>
    </article>
  )
}
