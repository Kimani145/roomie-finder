import React from 'react'

interface BudgetBarProps {
  viewerMin: number
  viewerMax: number
  candidateMin: number
  candidateMax: number
}

/**
 * Renders a visual budget overlap bar.
 * Shows viewer range, candidate range, and their overlap zone.
 */
export const BudgetBar: React.FC<BudgetBarProps> = ({
  viewerMin,
  viewerMax,
  candidateMin,
  candidateMax,
}) => {
  const globalMin = Math.min(viewerMin, candidateMin)
  const globalMax = Math.max(viewerMax, candidateMax)
  const range = globalMax - globalMin || 1

  const toPercent = (val: number) => ((val - globalMin) / range) * 100

  const overlapStart = Math.max(viewerMin, candidateMin)
  const overlapEnd = Math.min(viewerMax, candidateMax)
  const hasOverlap = overlapEnd >= overlapStart

  const fmt = (n: number) =>
    n >= 1000 ? `${(n / 1000).toFixed(0)}k` : `${n}`

  return (
    <div className="w-full space-y-2">
      <div className="flex items-center justify-between text-[11px] font-medium text-slate-400 uppercase tracking-wider">
        <span>Budget Overlap</span>
        <span className="text-slate-300">
          KES {fmt(candidateMin)} – {fmt(candidateMax)}
        </span>
      </div>

      {/* Track */}
      <div className="relative h-2 w-full rounded-full bg-slate-700/60">
        {/* Candidate range — dimmer background */}
        <div
          className="absolute h-full rounded-full bg-blue-500/25"
          style={{
            left: `${toPercent(candidateMin)}%`,
            width: `${toPercent(candidateMax) - toPercent(candidateMin)}%`,
          }}
        />

        {/* Overlap zone — bright */}
        {hasOverlap && (
          <div
            className="absolute h-full rounded-full bg-emerald-400"
            style={{
              left: `${toPercent(overlapStart)}%`,
              width: `${toPercent(overlapEnd) - toPercent(overlapStart)}%`,
            }}
          />
        )}
      </div>

      {/* Legend */}
      <div className="flex items-center gap-3 text-[10px] text-slate-500">
        <span className="flex items-center gap-1">
          <span className="inline-block h-1.5 w-3 rounded-full bg-emerald-400" />
          Overlap
        </span>
        <span className="flex items-center gap-1">
          <span className="inline-block h-1.5 w-3 rounded-full bg-blue-500/40" />
          Their range
        </span>
      </div>
    </div>
  )
}
