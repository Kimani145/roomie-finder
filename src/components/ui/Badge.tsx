import React from 'react'
import { cn } from './cn'

// ─── Types ─────────────────────────────────────────────────────────────────────
export type BadgeVariant = 'verified' | 'compatibility' | 'neutral' | 'warning' | 'danger'
export type BadgeSize = 'sm' | 'md'

export interface BadgeProps {
  variant?: BadgeVariant
  size?: BadgeSize
  /** Numeric 0–100 — only used when variant='compatibility' */
  score?: number
  icon?: React.ReactNode
  children: React.ReactNode
  className?: string
}

// ─── Verified checkmark icon ───────────────────────────────────────────────────
const CheckIcon: React.FC = () => (
  <svg
    className="h-3 w-3 flex-shrink-0"
    viewBox="0 0 12 12"
    fill="none"
    aria-hidden="true"
  >
    <path
      d="M2 6.5L4.5 9L10 3"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
)

// ─── Variant map ───────────────────────────────────────────────────────────────
const variantStyles: Record<BadgeVariant, string> = {
  // Trust — emerald. Used for verified student status.
  verified:
    'bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200',

  // Compatibility gradient — represents match quality.
  compatibility:
    'bg-gradient-to-r from-blue-500 to-blue-600 text-white ring-0 shadow-sm shadow-blue-500/30',

  // Neutral — for generic labels, zone chips, etc.
  neutral:
    'bg-slate-100 text-slate-600 ring-1 ring-slate-200',

  // Premium/alert — amber.
  warning:
    'bg-amber-50 text-amber-700 ring-1 ring-amber-200',

  // Danger
  danger:
    'bg-red-50 text-red-600 ring-1 ring-red-200',
}

const sizeStyles: Record<BadgeSize, string> = {
  sm: 'text-[10px] px-2 py-0.5 gap-1 rounded-full',
  md: 'text-xs px-2.5 py-1 gap-1.5 rounded-full',
}

// ─── Badge ─────────────────────────────────────────────────────────────────────
export const Badge: React.FC<BadgeProps> = ({
  variant = 'neutral',
  size = 'md',
  score,
  icon,
  children,
  className,
}) => {
  return (
    <span
      className={cn(
        'inline-flex items-center font-semibold font-sans leading-none',
        variantStyles[variant],
        sizeStyles[size],
        className
      )}
    >
      {/* Auto-prepend checkmark for verified */}
      {variant === 'verified' && !icon && <CheckIcon />}

      {/* Custom icon */}
      {icon && (
        <span className="flex-shrink-0" aria-hidden="true">
          {icon}
        </span>
      )}

      {children}

      {/* Append score number for compatibility variant */}
      {variant === 'compatibility' && score !== undefined && (
        <span className="ml-0.5 font-bold tabular-nums opacity-90">
          {score}%
        </span>
      )}
    </span>
  )
}

// ─── Convenience exports ───────────────────────────────────────────────────────

/** Pre-configured verified student badge */
export const VerifiedBadge: React.FC<{ className?: string }> = ({ className }) => (
  <Badge variant="verified" className={className}>
    Verified Student
  </Badge>
)

/** Pre-configured compatibility badge with score */
export const CompatibilityScoreBadge: React.FC<{
  score: number
  className?: string
}> = ({ score, className }) => (
  <Badge variant="compatibility" score={score} className={className}>
    Match
  </Badge>
)
