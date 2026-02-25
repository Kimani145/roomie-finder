import React from 'react'
import { Link } from 'react-router-dom'
import { Check } from 'lucide-react'
import type { MatchResult } from '@/types'
import { getCompatibilityPercentage } from '@/engine/compatibilityEngine'
import { formatBudget } from '@/utils/formatters'
import { useAuthStore } from '@/store/authStore'

interface DiscoveryCardProps {
  match: MatchResult
}

// ─── Derive top 2 compatibility tags from score breakdown ─────────────────────
function getCompatibilityTags(match: MatchResult): string[] {
  const { scoreBreakdown, profile } = match
  const tags: string[] = []

  if (scoreBreakdown.sleepMatch > 0) tags.push('Similar sleep schedule')
  if (scoreBreakdown.cleanlinessMatch > 0)
    tags.push('Aligned cleanliness standards')
  if (scoreBreakdown.zoneMatch > 0) tags.push('Same zone')
  if (scoreBreakdown.noiseMatch > 0)
    tags.push(`${profile.lifestyle.noiseTolerance} noise tolerance`)
  if (!profile.lifestyle.smoking) tags.push('Non-smoker')
  if (!profile.lifestyle.alcohol) tags.push('No alcohol')

  return tags.slice(0, 2) // Maximum 2
}

// ─── Lifestyle pills (subtle context chips) ───────────────────────────────────
function getLifestylePills(match: MatchResult): string[] {
  const { profile } = match
  const pills: string[] = []

  if (profile.lifestyle.sleepTime === 'Early') pills.push('Early Bird')
  if (profile.lifestyle.sleepTime === 'Late') pills.push('Night Owl')
  if (!profile.lifestyle.smoking) pills.push('Non-Smoker')
  if (profile.lifestyle.cleanlinessLevel === 'Strict') pills.push('Neat Freak')

  return pills.slice(0, 2)
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
  const { currentUser } = useAuthStore()
  const { profile, compatibilityScore, scoreBreakdown } = match

  const compatibilityPct = getCompatibilityPercentage(compatibilityScore)
  const tags = getCompatibilityTags(match)
  const pills = getLifestylePills(match)
  const activityOpacity = getActivityOpacity(profile.lastActive)

  // Trust signal: passed hard elimination = no deal-breaker conflicts
  const passedElimination = scoreBreakdown.totalScore >= 0

  return (
    <Link
      to={`/profile/${profile.uid}`}
      className="group block overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm transition-all duration-200 hover:shadow-md active:shadow-md outline-none focus-visible:ring-2 focus-visible:ring-blue-400 focus-visible:ring-offset-2"
    >
      {/* ── Photo area (4:3 aspect ratio maintained) ──────────────────────────── */}
      <div className="w-full aspect-[4/3] relative overflow-hidden bg-slate-200">
        {profile.photoURL ? (
          <img
            src={profile.photoURL}
            alt={profile.displayName}
            className="object-cover w-full h-full transition-transform duration-500 group-hover:scale-105"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-slate-200 to-slate-300">
            <span className="text-4xl font-bold text-slate-400 select-none">
              {getInitials(profile.displayName)}
            </span>
          </div>
        )}

        {/* Budget pill overlay (bottom-left) */}
        <div className="absolute bottom-3 left-3 rounded-full bg-slate-900/70 px-3 py-1 text-xs font-semibold text-white backdrop-blur-sm">
          {formatBudget(profile.minBudget, profile.maxBudget)}
        </div>

        {/* Compatibility badge (bottom-right) — REFACTORED */}
        <div className="absolute bottom-3 right-3 flex flex-col items-end gap-0.5">
          <div className="flex items-center gap-1.5 rounded-full bg-emerald-500 px-3 py-1.5 shadow-md shadow-emerald-900/30">
            <span className="text-xs font-semibold text-white">
              {compatibilityPct}% Compatible
            </span>
          </div>
          {/* Micro-authority label */}
          <span className="text-[10px] leading-tight text-white/90 drop-shadow-md">
            Lifestyle + budget
          </span>
        </div>
      </div>

      {/* ── Logistics Block (NEW) ──────────────────────────────────────────── */}
      <div className="flex items-center justify-between border-b border-slate-200 bg-slate-50 px-4 py-2">
        {/* Move-in (placeholder — can be dynamic if added to profile schema) */}
        <span className="text-xs font-medium text-slate-700">
          Move-in: Flexible
        </span>
        {/* Budget (right-aligned, bold) */}
        <span className="text-xs font-bold tabular-nums text-slate-900">
          {formatBudget(profile.minBudget, profile.maxBudget)}
        </span>
      </div>

      {/* ── Identity Block (SECONDARY to compatibility) ────────────────────── */}
      <div className="px-4 pt-3 pb-2 space-y-1">
        {/* Name + age + activity dot */}
        <div className="flex items-center gap-2">
          <h3 className="text-sm font-semibold text-slate-900">
            {profile.displayName}, {profile.age}
          </h3>
          <span
            className="inline-block h-2 w-2 rounded-full bg-emerald-500"
            style={{ opacity: activityOpacity }}
            aria-label="Active status"
          />
        </div>

        {/* School + year */}
        <p className="text-xs text-slate-600">
          {profile.school} • Year {profile.courseYear}
        </p>

        {/* Lifestyle pills (subtle context) */}
        {pills.length > 0 && (
          <div className="flex items-center gap-1.5 pt-1">
            {pills.map((pill) => (
              <span
                key={pill}
                className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-medium text-slate-600"
              >
                {pill}
              </span>
            ))}
          </div>
        )}
      </div>

      {/* ── System Authority & Risk Reduction (NEW) ────────────────────────── */}
      <div className="border-t border-slate-100 px-4 pt-2.5 pb-3 space-y-2">
        {/* Micro-label */}
        <p className="text-[10px] uppercase tracking-wider text-slate-400">
          Based on 6 lifestyle factors
        </p>

        {/* Top 2 compatibility summary tags */}
        {tags.length > 0 && (
          <div className="flex flex-col gap-1">
            {tags.map((tag) => (
              <span key={tag} className="text-xs text-slate-600">
                • {tag}
              </span>
            ))}
          </div>
        )}

        {/* Trust signal — only if passed elimination */}
        {passedElimination && (
          <div className="flex items-center gap-1 pt-0.5">
            <Check className="h-3 w-3 flex-shrink-0 text-emerald-600" />
            <span className="text-xs text-emerald-600">
              No deal-breaker conflicts
            </span>
          </div>
        )}
      </div>

      {/* ── Subtle action cue (NEW) ────────────────────────────────────────── */}
      <div className="border-t border-slate-100 px-4 py-2.5 text-right">
        <span className="text-xs font-medium text-blue-500 group-hover:text-blue-600">
          View compatibility details →
        </span>
      </div>
    </Link>
  )
}
