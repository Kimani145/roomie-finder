import React from 'react'
import { getCompatibilityPercentage } from '@/engine/compatibilityEngine'

interface CompatibilityBadgeProps {
  score: number
  size?: 'sm' | 'lg'
}

function getBadgeMeta(pct: number): { label: string; ringClass: string; glowColor: string; textClass: string } {
  if (pct >= 80)
    return {
      label: 'Great Match',
      ringClass: 'ring-emerald-500',
      glowColor: 'shadow-emerald-500/30',
      textClass: 'text-emerald-400',
    }
  if (pct >= 60)
    return {
      label: 'Good Match',
      ringClass: 'ring-blue-400',
      glowColor: 'shadow-blue-400/30',
      textClass: 'text-blue-400',
    }
  if (pct >= 40)
    return {
      label: 'Decent Match',
      ringClass: 'ring-amber-400',
      glowColor: 'shadow-amber-400/20',
      textClass: 'text-amber-400',
    }
  return {
    label: 'Some Overlap',
    ringClass: 'ring-slate-500',
    glowColor: 'shadow-slate-500/20',
    textClass: 'text-slate-400',
  }
}

export const CompatibilityBadge: React.FC<CompatibilityBadgeProps> = ({ score, size = 'lg' }) => {
  const pct = getCompatibilityPercentage(score)
  const { label, ringClass, glowColor, textClass } = getBadgeMeta(pct)

  // SVG ring dimensions
  const dim = size === 'lg' ? 72 : 48
  const stroke = size === 'lg' ? 5 : 3.5
  const radius = (dim - stroke) / 2
  const circumference = 2 * Math.PI * radius
  const offset = circumference - (pct / 100) * circumference

  return (
    <div className="flex flex-col items-center gap-1">
      <div
        className={`relative flex items-center justify-center rounded-full ring-2 ${ringClass} shadow-lg ${glowColor}`}
        style={{ width: dim, height: dim }}
      >
        {/* Background track */}
        <svg
          width={dim}
          height={dim}
          className="absolute inset-0 -rotate-90"
          viewBox={`0 0 ${dim} ${dim}`}
        >
          <circle
            cx={dim / 2}
            cy={dim / 2}
            r={radius}
            fill="none"
            stroke="rgba(255,255,255,0.06)"
            strokeWidth={stroke}
          />
          <circle
            cx={dim / 2}
            cy={dim / 2}
            r={radius}
            fill="none"
            stroke="currentColor"
            strokeWidth={stroke}
            strokeDasharray={circumference}
            strokeDashoffset={offset}
            strokeLinecap="round"
            className={`${textClass} transition-all duration-700`}
          />
        </svg>
        {/* Percentage number */}
        <span className={`relative z-10 font-bold tabular-nums ${textClass} ${size === 'lg' ? 'text-lg' : 'text-sm'}`}>
          {pct}%
        </span>
      </div>
      {size === 'lg' && (
        <span className={`text-[11px] font-semibold uppercase tracking-widest ${textClass}`}>
          {label}
        </span>
      )}
    </div>
  )
}
