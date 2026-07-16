import React from 'react'
import type { MatchResult } from '@/types'
import { getCompatibilityPercentage } from '@/engine/compatibilityEngine'
import { formatBudget } from '@/utils/formatters'

interface DiscoveryCardProps {
  match: MatchResult
  onPrimaryAction?: (uid: string, event?: React.MouseEvent) => void
}

function getInitials(name?: string): string {
  if (!name) return '?'
  return name
    .split(' ')
    .filter(Boolean)
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2)
}

export const DiscoveryCard: React.FC<DiscoveryCardProps> = ({ match, onPrimaryAction }) => {
  const { profile, compatibilityScore, scoreBreakdown } = match
  const compatibilityPct = getCompatibilityPercentage(compatibilityScore)
  
  const isPerfectFit = compatibilityPct >= 90
  const lifestyleTags = scoreBreakdown.matchedFactors
    .filter(
      (factor) =>
        factor.startsWith('Sleep') ||
        factor.startsWith('Cleanliness') ||
        factor.startsWith('Noise') ||
        factor.startsWith('Guest') ||
        factor.startsWith('Study')
    )
    .slice(0, 3)

  return (
    <article className="group block overflow-hidden rounded-2xl border border-[#E2E8F0] dark:border-[#334155] bg-[#FFFFFF] dark:bg-[#111827] text-[#0F172A] dark:text-[#F9FAFB] shadow-lg transition-all flex flex-col">
      {/* Photo Area */}
      <div className="relative shrink-0">
        <div className="h-56 sm:h-64 w-full bg-slate-200 dark:bg-slate-600 shrink-0 relative overflow-hidden">
          {profile.photoURL ? (
            <img
              src={profile.photoURL}
              alt={`${profile.displayName} listing`}
              className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
            />
          ) : (
            <div className="h-full w-full flex items-center justify-center text-4xl font-bold text-slate-400 dark:text-slate-500">
              {getInitials(profile.displayName)}
            </div>
          )}
        </div>

        {/* 1. Massive Match Badge */}
        <div className="absolute top-4 right-4 bg-accent-50 text-accent-700 dark:bg-accent-500/20 dark:text-accent-dark text-sm font-extrabold px-3 py-1.5 rounded-full shadow-md tracking-widest border border-accent-200 dark:border-accent-500/30 backdrop-blur-md">
          [ {compatibilityPct}% MATCH ]
        </div>
        
        {/* Budget overlay */}
        <div className="absolute bottom-4 left-4 rounded-full bg-white/95 dark:bg-surface-dark-elev/80 border border-slate-200 dark:border-white/20 px-4 py-1.5 text-xs font-bold text-slate-900 dark:text-white shadow-sm backdrop-blur-sm">
          {formatBudget(profile.minBudget, profile.maxBudget)}
        </div>
      </div>

      <div className="p-6 flex-1 flex flex-col gap-4">
        {/* 2. The Conclusion */}
        <div className="rounded-xl p-3 bg-[#F8FAFC] dark:bg-[#1F2937] border border-[#E2E8F0] dark:border-[#334155] text-[#1E3A8A] dark:text-[#3B82F6] font-bold text-sm tracking-wider uppercase">
          {isPerfectFit ? 'Perfect Fit For You' : 'Good Potential Match'}
        </div>

        {/* 3. The Identity */}
        <div>
          <h3 className="text-2xl font-bold text-slate-900 dark:text-slate-50 leading-none">
            {profile.displayName}, {profile.age}
          </h3>
          <p className="text-sm font-semibold text-slate-600 dark:text-slate-300 mt-1">
            {profile.school} • Year {profile.courseYear}
          </p>
        </div>

        {/* 4. The Traits */}
        <div className="flex-1 mt-2 bg-[#F8FAFC] dark:bg-[#1F2937] border border-[#E2E8F0] dark:border-[#334155] rounded-xl p-4">
          {lifestyleTags.length > 0 ? (
            <ul className="space-y-1.5">
              {lifestyleTags.map((trait) => (
                <li key={trait} className="text-sm font-medium text-[#475569] dark:text-[#94A3B8] flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-accent-500/50" />
                  <span className="text-[#0F172A] dark:text-[#F9FAFB]">{trait}</span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-[#475569] dark:text-[#94A3B8] italic">
              Still learning overlap preferences...
            </p>
          )}
        </div>
      </div>

      {/* 5. Action Bar */}
      <div className="mt-auto p-4 border-t border-[#E2E8F0] dark:border-[#334155] bg-[#FFFFFF] dark:bg-[#111827] flex gap-3">
        <button
          className="h-12 flex-1 rounded-xl font-extrabold tracking-widest active:scale-95 bg-transparent border-2 border-[#E2E8F0] dark:border-[#334155] text-[#475569] dark:text-[#94A3B8] hover:bg-[#F8FAFC] dark:hover:bg-[#1F2937] hover:text-[#0F172A] dark:hover:text-[#F9FAFB] transition-all"
        >
          PASS
        </button>
        <button
          className="h-12 flex-1 rounded-xl font-extrabold tracking-widest active:scale-95 bg-gradient-to-b from-[#3B82F6] to-[#2563EB] text-[#FFFFFF] shadow-md shadow-[#2563EB]/20 hover:from-[#2563EB] hover:to-[#1E3A8A] transition-all border-none"
          onClick={(e) => onPrimaryAction?.(profile.uid, e)}
        >
          LIKE
        </button>
      </div>
    </article>
  )
}
