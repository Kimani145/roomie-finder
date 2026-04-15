import { formatDistanceToNowStrict } from 'date-fns'
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

  if (percentage >= 90) return { label: 'Top Match', color: '#34d399', percentage }
  if (percentage >= 75) return { label: 'Strong Match', color: '#60a5fa', percentage }
  return { label: 'Fair Match', color: '#94a3b8', percentage }
}

export function getMatchTierMeta(score: number): {
  label: 'Top Match' | 'Strong Match' | 'Fair Match'
  percentage: number
  classes: string
} {
  const percentage = getCompatibilityPercentage(score)

  if (percentage >= 90) {
    return {
      label: 'Top Match',
      percentage,
      classes: 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20',
    }
  }

  if (percentage >= 75) {
    return {
      label: 'Strong Match',
      percentage,
      classes: 'bg-blue-500/10 text-blue-400 border border-blue-500/20',
    }
  }

  return {
    label: 'Fair Match',
    percentage,
    classes: 'bg-slate-800 text-slate-400 border border-slate-700/50',
  }
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

/**
 * Formats a course year number into a string.
 * e.g. formatCourseYear(1) -> "1st Year Student"
 */
export function formatCourseYear(year: number): string {
  if (year === 1) return '1st Year Student'
  if (year === 2) return '2nd Year Student'
  if (year === 3) return '3rd Year Student'
  if (year >= 4) return `${year}th Year Student`
  return 'Student'
}

/**
 * Formats a date into a short, scannable time-ago string.
 * e.g. "5h ago", "2d ago", "1mo ago"
 */
export function formatTimeAgo(date: Date): string {
  const parsed = new Date(date)
  if (Number.isNaN(parsed.getTime())) return ''
  return formatDistanceToNowStrict(parsed, { addSuffix: true })
}

export function getMatchBadgeClasses(score: number): string {
  const { classes } = getMatchTierMeta(score)
  return classes
}
