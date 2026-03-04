import React from 'react'
import { Link } from 'react-router-dom'
import type { MatchResult } from '@/types'
import { getCompatibilityPercentage } from '@/engine/compatibilityEngine'
import { formatBudget } from '@/utils/formatters'

interface DiscoveryCardProps {
  match: MatchResult
}

// ─── Recency indicator (active dot opacity) ────────────────────────────────────
function getActivityOpacity(lastActive: Date): number {
  const now = new Date()
  const diffMs = now.getTime() - new Date(lastActive).getTime()
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24))

  if (diffDays === 0) return 1 // solid emerald
  if (diffDays < 7) return 0.6 // active this week
  return 0.4 // older
}

function getInitials(name: string): string {
  return name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2)
}

// ─── DiscoveryCard (Refactored) ────────────────────────────────────────────────
export const DiscoveryCard: React.FC<DiscoveryCardProps> = ({ match }) => {
  const { profile, compatibilityScore, scoreBreakdown } = match

  const compatibilityPct = getCompatibilityPercentage(compatibilityScore)
  const activityOpacity = getActivityOpacity(profile.lastActive)
  const routeUid = profile.uid.replace(/^seed-/, '')
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
    <Link
      to={`/profile/${routeUid}`}
      className="group block overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm transition-all duration-200 hover:shadow-md active:shadow-md outline-none focus-visible:ring-2 focus-visible:ring-blue-400 focus-visible:ring-offset-2"
    >
      {/* ── Photo area (4:3 aspect ratio maintained) ──────────────────────────── */}
      <div className="w-full aspect-[16/9] relative flex items-center justify-center bg-slate-100 border-b border-slate-100">
        {profile.photoURL ? (
          <img
            src={profile.photoURL}
            alt={profile.displayName}
            className="absolute inset-0 object-cover w-full h-full transition-transform duration-500 group-hover:scale-105"
          />
        ) : (
          <span className="text-6xl font-syne font-bold text-slate-300">
            {getInitials(profile.displayName)}
          </span>
        )}

        {/* Budget pill overlay (bottom-left) */}
        <div className="absolute bottom-3 left-3 rounded-full bg-white/90 px-3 py-1 text-xs font-semibold text-slate-700 backdrop-blur-sm border border-slate-200">
          {formatBudget(profile.minBudget, profile.maxBudget)}
        </div>

        {/* Compatibility badge (top-right) — REFACTORED */}
        <div className="absolute top-3 right-3 bg-emerald-500 text-white text-xs font-extrabold px-3 py-1.5 rounded-full shadow-md tracking-wide ring-2 ring-white">
          {compatibilityPct}% Compatible
        </div>
      </div>

      {/* ── Content hierarchy block ─────────────────────────────────────────── */}
      <div className="p-5 flex flex-col gap-3.5">
        {/* Name + age + activity dot */}
        <div className="flex items-center gap-2">
          <h3 className="text-xl font-bold text-slate-900 font-syne leading-none flex items-center gap-2">
            {profile.displayName}, {profile.age}
          </h3>
          <span
            className="w-2 h-2 rounded-full bg-slate-400"
            style={{ opacity: activityOpacity }}
            aria-label="Active status"
          />
        </div>

        <p className="text-xs font-semibold text-slate-700">
          Compatibility score: {compatibilityPct}%
        </p>

        {/* Budget alignment */}
        <div className="flex justify-between items-center bg-slate-50 rounded-lg px-3 py-2 border border-slate-100">
          <span className="text-xs text-slate-600 font-medium">
            Move-in: Flexible
          </span>
          <span className="text-xs text-slate-900 font-bold tabular-nums tracking-tight">
            {formatBudget(profile.minBudget, profile.maxBudget)}
          </span>
        </div>

        {/* Zone overlap indicator */}
        {scoreBreakdown.zoneOverlapZones.length > 0 && (
          <p className="text-xs font-medium text-slate-600">
            Zone overlap: {scoreBreakdown.zoneOverlapZones.join(', ')}
          </p>
        )}

        {/* Lifestyle similarities */}
        {lifestyleTags.length > 0 && (
          <div className="flex flex-wrap items-center gap-1.5">
            {lifestyleTags.map((pill) => (
              <span
                key={pill}
                className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-medium text-slate-600 leading-tight"
              >
                {pill}
              </span>
            ))}
          </div>
        )}

        {/* School + year */}
        <p className="text-xs text-slate-500 font-medium truncate">
          {profile.school} • Year {profile.courseYear}
        </p>
      </div>

      {/* ── Subtle action cue (NEW) ────────────────────────────────────────── */}
      <div className="px-5 pb-4">
        <span className="text-xs text-blue-600 font-medium text-center w-full block py-2 hover:text-blue-700 transition-colors">
          View compatibility details →
        </span>
      </div>
    </Link>
  )
}
