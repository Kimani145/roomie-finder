import React from 'react'
import type { MatchResult } from '@/types'
import { getCompatibilityPercentage } from '@/engine/compatibilityEngine'
import { formatBudget } from '@/utils/formatters'
import { Button } from '@/components/ui/Button'

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
    <article className="card-surface card-surface-dingley group flex h-full flex-col overflow-hidden rounded-nest transition-all hover:-translate-y-1 hover:shadow-2xl">
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
        <div className="absolute top-4 right-4 bg-emerald-100 text-emerald-800 dark:bg-emerald-500/20 dark:text-emerald-400 text-sm font-extrabold px-3 py-1.5 rounded-full shadow-md tracking-widest border border-emerald-200 dark:border-emerald-500/30 backdrop-blur-md">
          [ {compatibilityPct}% MATCH ]
        </div>
        
        {/* Budget overlay */}
        <div className="absolute bottom-4 left-4 rounded-full bg-white/95 dark:bg-card-thatch/35 border border-slate-200 dark:border-white/20 px-4 py-1.5 text-xs font-bold text-slate-900 dark:text-white shadow-sm backdrop-blur-sm">
          {formatBudget(profile.minBudget, profile.maxBudget)}
        </div>
      </div>

      <div className="p-6 flex-1 flex flex-col gap-4">
        {/* 2. The Conclusion */}
        {isPerfectFit ? (
          <h4 className="text-sm tracking-wider uppercase font-extrabold text-weaver-purple dark:text-weaver-orange">
            Perfect Fit For You
          </h4>
        ) : (
          <h4 className="text-sm tracking-wider uppercase font-extrabold text-slate-500 dark:text-slate-400">
            Good Potential Match
          </h4>
        )}

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
        <div className="flex-1 mt-2">
          {lifestyleTags.length > 0 ? (
            <ul className="space-y-1.5">
              {lifestyleTags.map((trait) => (
                <li key={trait} className="text-sm font-medium text-slate-500 dark:text-slate-400 flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500/50" />
                  {trait}
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-slate-500 dark:text-slate-400 italic">
              Still learning overlap preferences...
            </p>
          )}
        </div>
      </div>

      {/* 5. Action Bar */}
      <div className="card-surface-soft card-surface-cello mt-auto grid grid-cols-2 gap-4 border-x-0 border-b-0 border-t p-5">
        <button
          className="h-12 w-full rounded-xl border-2 border-slate-300 dark:border-slate-700 bg-transparent text-slate-700 dark:text-slate-300 font-extrabold tracking-widest hover:bg-slate-50 dark:hover:bg-slate-800 active:scale-95 transition-all shadow-sm"
        >
          PASS
        </button>
        <Button
          variant="primary"
          className="h-12 w-full rounded-xl font-extrabold tracking-widest rounded-nest"
          onClick={(e) => onPrimaryAction?.(profile.uid, e)}
        >
          LIKE
        </Button>
      </div>
    </article>
  )
}
