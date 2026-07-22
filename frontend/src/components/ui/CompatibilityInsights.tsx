import React from 'react'
import type { ScoreBreakdown, UserProfile } from '@/types'

type CompatibilityInsightsProps = {
  viewer: UserProfile
  candidate: UserProfile
  scoreBreakdown: ScoreBreakdown
}

const getAlignmentTraits = (scoreBreakdown: ScoreBreakdown): string[] => {
  const traits: string[] = []

  if (scoreBreakdown.sleepMatch > 0) traits.push('Sleep Schedule')
  if (scoreBreakdown.cleanlinessMatch > 0) traits.push('Cleanliness')
  if (scoreBreakdown.noiseMatch > 0) traits.push('Noise Tolerance')
  if (scoreBreakdown.guestMatch > 0) traits.push('Guest Frequency')
  if (scoreBreakdown.studyMatch > 0) traits.push('Study Style')

  return traits
}

const getFrictionSignals = (viewer: UserProfile, candidate: UserProfile): string[] => {
  const friction: string[] = []

  if (
    (viewer.dealBreakers.noSmokingRequired && candidate.lifestyle.smoking) ||
    (candidate.dealBreakers.noSmokingRequired && viewer.lifestyle.smoking)
  ) {
    friction.push('Smoking Preference')
  }

  if (
    (viewer.dealBreakers.noAlcoholRequired && candidate.lifestyle.alcohol) ||
    (candidate.dealBreakers.noAlcoholRequired && viewer.lifestyle.alcohol)
  ) {
    friction.push('Alcohol Preference')
  }

  if (
    (viewer.lifestyle.noiseTolerance === 'Low' && candidate.lifestyle.noiseTolerance === 'High') ||
    (viewer.lifestyle.noiseTolerance === 'High' && candidate.lifestyle.noiseTolerance === 'Low')
  ) {
    friction.push('Noise Tolerance')
  }

  if (
    (viewer.lifestyle.cleanlinessLevel === 'Strict' && candidate.lifestyle.cleanlinessLevel === 'Relaxed') ||
    (viewer.lifestyle.cleanlinessLevel === 'Relaxed' && candidate.lifestyle.cleanlinessLevel === 'Strict')
  ) {
    friction.push('Cleanliness Expectations')
  }

  return friction
}

export const CompatibilityInsights: React.FC<CompatibilityInsightsProps> = ({
  viewer,
  candidate,
  scoreBreakdown,
}) => {
  const alignmentTraits = getAlignmentTraits(scoreBreakdown)
  const frictionSignals = getFrictionSignals(viewer, candidate)
  const matchedFactors = scoreBreakdown.matchedFactors || []

  return (
    <section className="rounded-2xl border border-slate-200 bg-slate-50 p-5 dark:border-slate-700/50 dark:bg-slate-800 space-y-4">
      <h2 className="font-syne text-lg font-bold text-slate-900 dark:text-slate-50">
        Compatibility Explanations
      </h2>

      {/* Badges for matched factors */}
      <div className="flex flex-wrap gap-2">
        {scoreBreakdown.budgetOverlap && (
          <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-500/20 dark:text-emerald-300">
            ✓ Same Budget Overlap
          </span>
        )}
        {alignmentTraits.map((trait) => (
          <span
            key={trait}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-500/20 dark:text-emerald-300"
          >
            ✓ Matched {trait}
          </span>
        ))}
      </div>

      <div className="space-y-3">
        <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/10 px-4 py-3">
          <p className="text-sm font-semibold text-emerald-600 dark:text-emerald-400">
            {`You align on ${alignmentTraits.length} key lifestyle traits`}
          </p>
          <p className="mt-1 text-xs text-slate-600 dark:text-slate-300">
            {matchedFactors.length > 0 ? matchedFactors.join(' • ') : 'No strong overlaps yet'}
          </p>
        </div>

        {frictionSignals.map((signal) => (
          <div
            key={signal}
            className="rounded-xl border border-amber-500/20 bg-amber-500/10 px-4 py-3"
          >
            <p className="text-sm font-semibold text-amber-700 dark:text-amber-300">Potential friction: {signal}</p>
          </div>
        ))}
      </div>
    </section>
  )
}
