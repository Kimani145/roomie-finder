import React from 'react'
import { Link } from 'react-router-dom'
import { ShieldCheck } from 'lucide-react'
import type { MatchResult } from '@/types'
import { formatBudget, getMatchTierMeta } from '@/utils/formatters'
import { getCompatibilityPercentage } from '@/engine/compatibilityEngine'
import { useAuthStore } from '@/store/authStore'

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
  const { currentUser } = useAuthStore()
  const isGuest = !currentUser

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

  // Completeness calculation helper for trust display
  const profileCompleteness = profile.lifestyle ? 85 : 55

  return (
    <article className="group block overflow-hidden rounded-2xl border border-slate-200 dark:border-white/10 bg-white/80 dark:bg-slate-800/90 text-slate-900 dark:text-slate-50 shadow-lg transition-all flex flex-col hover:-translate-y-1 hover:shadow-2xl relative">
      
      {/* Locked Overlay for Guest Users */}
      {isGuest && (
        <div className="absolute inset-x-0 top-0 bottom-[80px] bg-slate-950/60 backdrop-blur-[2.5px] flex flex-col items-center justify-center text-center p-4 z-20 rounded-t-2xl">
          <ShieldCheck className="w-8 h-8 text-brand-400 mb-2 drop-shadow-md" />
          <span className="text-[#F9FAFB] text-sm font-extrabold mb-1">Seeker Profile Locked</span>
          <span className="text-slate-300 text-xs px-3 py-1.5 border border-white/20 bg-slate-900/80 rounded-xl max-w-[220px]">
            Sign up to unlock compatibility & lifestyle traits
          </span>
        </div>
      )}

      <div className="relative p-6 flex flex-col gap-5 flex-1">
        <div className="absolute top-0 right-0 h-32 w-32 bg-brand-100/30 blur-2xl rounded-full pointer-events-none dark:hidden" />
        
        {/* Header Row */}
        <div className="flex items-center justify-between gap-3 relative z-10">
          <div className="flex items-center gap-3 min-w-0">
            {isGuest ? (
              <div className="h-14 w-14 rounded-full bg-slate-200 dark:bg-slate-700 text-slate-400 dark:text-slate-500 text-lg font-semibold flex items-center justify-center border border-slate-200 dark:border-slate-700/50 select-none">
                ?
              </div>
            ) : profile.photoURL ? (
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
                {isGuest ? (
                  <span>
                    Student Seeker, <span className="blur-[4px] select-none">21</span>
                  </span>
                ) : (
                  <>
                    {profile.displayName}
                    {profile.age !== undefined ? `, ${profile.age}` : ''}
                  </>
                )}
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                {isGuest ? 'Technical University of Kenya' : profile.school || 'Technical University of Kenya'}
                {profile.courseYear !== undefined && !isGuest ? ` • Year ${profile.courseYear}` : ''}
              </p>
            </div>
          </div>

          {/* Compatibility Match Badge / Trust Badges */}
          {isGuest ? (
            <div className="flex flex-col gap-1 items-end shrink-0 z-10">
              <span className="bg-brand-600/90 text-white text-[9px] font-bold px-2 py-0.5 rounded-md uppercase tracking-wider flex items-center gap-0.5">
                <ShieldCheck className="w-3 h-3" />
                Verified
              </span>
              <span className="text-[8px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest">
                TUK Student
              </span>
            </div>
          ) : (
            showMatchBadge && (
              <span
                className={`shrink-0 rounded-2xl px-3.5 py-1.5 text-[11px] font-black uppercase tracking-widest shadow-sm ${tier.classes} border border-current/20 backdrop-blur-md z-10`}
              >
                {compatibilityPct}% {tier.label}
              </span>
            )
          )}
        </div>

        {/* Profile Completeness Display */}
        <div className="relative z-10 space-y-1">
          <div className="flex justify-between items-center text-xs font-semibold text-slate-600 dark:text-slate-400">
            <span>Profile Completeness</span>
            <span className="text-brand-600 dark:text-brand-400">{profileCompleteness}%</span>
          </div>
          <div className="w-full bg-slate-100 dark:bg-slate-700/50 rounded-full h-1.5 overflow-hidden">
            <div className="bg-emerald-500 h-full rounded-full transition-all duration-300" style={{ width: `${profileCompleteness}%` }} />
          </div>
        </div>

        {/* Action / Match Callout - Clear for User, hidden/blurred for Guest */}
        {!isGuest && (
          <div className="relative z-10 rounded-2xl p-4 text-sm tracking-wider uppercase bg-[#F8FAFC] dark:bg-slate-700/50 border border-[#E2E8F0] dark:border-slate-700/50 text-[#1E3A8A] dark:text-brand-400 font-bold shadow-sm">
            {actionCallout}
          </div>
        )}

        {/* Budget / Zones - Blurred for Guest, clear for User */}
        <div className="relative z-10 text-[15px] font-bold text-slate-800 dark:text-slate-200">
          {isGuest ? (
            <div className="space-y-1">
              <p>
                Budget: <span className="blur-[4.5px] select-none font-medium">KES 4,000 - 8,000</span>
              </p>
              <p className="text-xs text-slate-500 font-medium">
                Zone: <span className="blur-[4.5px] select-none font-normal">Ngara / Pangani</span>
              </p>
            </div>
          ) : (
            <>
              {profile.minBudget !== undefined && profile.maxBudget !== undefined
                ? `${formatBudget(profile.minBudget, profile.maxBudget)} • `
                : ''}
              {primaryZone}
            </>
          )}
        </div>

        {/* Lifestyle Questionnaire Summary - Mock blur for Guest */}
        <div className="relative z-10 space-y-2 rounded-2xl p-4 bg-[#F8FAFC] dark:bg-slate-700/30 border border-[#E2E8F0] dark:border-slate-700/50 text-[#475569] dark:text-[#94A3B8]">
          {isGuest ? (
            <div className="space-y-2 select-none filter blur-[3.5px]">
              <div className="flex items-center gap-2">
                <div className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                <p className="text-sm font-medium">Sleeps Late (Matches you)</p>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                <p className="text-sm font-medium">Strict Cleanliness (Matches you)</p>
              </div>
            </div>
          ) : traitSignals.length > 0 ? (
            traitSignals.map((trait) => (
              <div key={trait} className="flex items-center gap-2">
                <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(34,197,94,0.8)]" />
                <p className="text-sm font-medium text-[#0F172A] dark:text-[#F9FAFB]">
                  {trait}
                </p>
              </div>
            ))
          ) : (
            <div className="flex items-center gap-2">
              <div className="w-1.5 h-1.5 rounded-full bg-slate-300 dark:bg-slate-600" />
              <p className="text-sm font-medium italic">
                Compatibility signals are still building
              </p>
            </div>
          )}
        </div>

        {profile.moveInMonth && !isGuest && (
          <p className="relative z-10 text-[13px] font-semibold tracking-wide text-slate-500 dark:text-slate-400 mt-1">
            Move-in: <span className="font-bold text-slate-700 dark:text-slate-300">{formatMoveIn(profile.moveInMonth)}</span>
          </p>
        )}
      </div>

      {/* Action Buttons at the Bottom */}
      <div className="mt-auto p-4 border-t border-slate-200 dark:border-slate-700/50 bg-[#FFFFFF] dark:bg-slate-800/50 flex gap-3 z-10">
        {isGuest ? (
          <button
            type="button"
            onClick={(e) => onPrimaryAction?.(profile.uid, e)}
            className="h-12 w-full rounded-xl font-extrabold tracking-widest active:scale-95 flex items-center justify-center bg-gradient-to-b from-[#3B82F6] to-[#2563EB] text-[#FFFFFF] shadow-md shadow-[#2563EB]/20 hover:from-[#2563EB] hover:to-[#1E3A8A] transition-all border-none text-xs"
          >
            SIGN UP TO MATCH
          </button>
        ) : (
          <>
            <button
              type="button"
              onClick={() => setIsDismissed(true)}
              className="h-14 flex-1 rounded-xl font-extrabold tracking-widest active:scale-95 bg-transparent border-2 border-[#E2E8F0] dark:border-[#334155] text-[#475569] dark:text-[#94A3B8] hover:bg-[#F8FAFC] dark:hover:bg-[#1F2937] hover:text-[#0F172A] dark:hover:text-[#F9FAFB] transition-all"
            >
              PASS
            </button>
            <Link
              to={`/profile/${profile.uid}`}
              onClick={(event) => onPrimaryAction?.(profile.uid, event)}
              className="h-14 flex-1 rounded-xl font-extrabold tracking-widest active:scale-95 flex items-center justify-center bg-gradient-to-b from-[#3B82F6] to-[#2563EB] text-[#FFFFFF] shadow-md shadow-[#2563EB]/20 hover:from-[#2563EB] hover:to-[#1E3A8A] transition-all border-none"
            >
              LIKE
            </Link>
          </>
        )}
      </div>
    </article>
  )
}
