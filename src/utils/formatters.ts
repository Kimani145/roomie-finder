import { getCompatibilityPercentage } from '@/engine/compatibilityEngine'

/**
 * Returns a label + color for a compatibility score.
 */
export function getMatchLabel(score: number): {
  label: string
  color: string
  percentage: number
} {
  const percentage = getCompatibilityPercentage(score)

  if (percentage >= 80) return { label: 'Great Match', color: '#2cb67d', percentage }
  if (percentage >= 60) return { label: 'Good Match', color: '#5bc4bf', percentage }
  if (percentage >= 40) return { label: 'Decent Match', color: '#e8c73a', percentage }
  return { label: 'Some Overlap', color: '#a7a9be', percentage }
}

/**
 * Formats a budget range for display.
 * e.g. formatBudget(5000, 8000) → "KES 5k – 8k"
 */
export function formatBudget(min: number, max: number): string {
  const fmt = (n: number) =>
    n >= 1000 ? `${(n / 1000).toFixed(0)}k` : `${n}`
  return `KES ${fmt(min)} – ${fmt(max)}`
}

/**
 * Returns "Active today", "Active 3 days ago", etc.
 */
export function formatLastActive(date: Date): string {
  const now = new Date()
  const diffMs = now.getTime() - new Date(date).getTime()
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24))

  if (diffDays === 0) return 'Active today'
  if (diffDays === 1) return 'Active yesterday'
  if (diffDays < 7) return `Active ${diffDays} days ago`
  return 'Active this month'
}
