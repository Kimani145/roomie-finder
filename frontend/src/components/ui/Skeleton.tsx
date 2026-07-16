import React from 'react'
import { cn } from './cn'

// ─── Base shimmer ──────────────────────────────────────────────────────────────
/**
 * Core skeleton block. Compose these to build any loading shape.
 */
export interface SkeletonProps {
  className?: string
  /** Rounded pill shape */
  rounded?: boolean
  /** Full circle (avatars) */
  circle?: boolean
}

export const Skeleton: React.FC<SkeletonProps> = ({
  className,
  rounded = false,
  circle = false,
}) => (
  <div
    aria-hidden="true"
    className={cn(
      // Shimmer animation via CSS gradient sweep
      'relative overflow-hidden bg-slate-200 dark:bg-slate-700',
      'before:absolute before:inset-0',
      'before:-translate-x-full',
      'before:animate-[shimmer_1.6s_infinite]',
      'before:bg-white/60',
      circle ? 'rounded-full' : rounded ? 'rounded-full' : 'rounded-lg',
      className
    )}
  />
)

// ─── Composed skeletons ────────────────────────────────────────────────────────

/** Skeleton for a short text line */
export const SkeletonText: React.FC<{ width?: string; className?: string }> = ({
  width = 'w-32',
  className,
}) => <Skeleton className={cn('h-3.5', width, className)} />

/** Skeleton for a section heading */
export const SkeletonHeading: React.FC<{ width?: string; className?: string }> = ({
  width = 'w-48',
  className,
}) => <Skeleton className={cn('h-5', width, className)} />

/** Skeleton for a circular avatar */
export const SkeletonAvatar: React.FC<{
  size?: 'sm' | 'md' | 'lg'
  className?: string
}> = ({ size = 'md', className }) => {
  const sizeMap = { sm: 'h-8 w-8', md: 'h-10 w-10', lg: 'h-14 w-14' }
  return <Skeleton circle className={cn(sizeMap[size], className)} />
}

/** Skeleton for a badge/chip */
export const SkeletonBadge: React.FC<{ className?: string }> = ({ className }) => (
  <Skeleton rounded className={cn('h-6 w-24', className)} />
)

/** Skeleton for the budget bar */
export const SkeletonBudgetBar: React.FC<{ className?: string }> = ({ className }) => (
  <div className={cn('space-y-2', className)}>
    <div className="flex justify-between">
      <Skeleton className="h-3 w-20" />
      <Skeleton className="h-3 w-24" />
    </div>
    <Skeleton className="h-2 w-full rounded-full" />
    <div className="flex gap-3">
      <Skeleton rounded className="h-3 w-14" />
      <Skeleton rounded className="h-3 w-16" />
    </div>
  </div>
)

// ─── Discovery Card Skeletons ─────────────────────────────────────────────────
/**
 * Full-fidelity skeleton matching ListingCard layout.
 */
export const ListingCardSkeleton: React.FC<{ className?: string }> = ({
  className,
}) => (
  <div
    aria-hidden="true"
    aria-label="Loading listing card"
    className={cn(
      'flex flex-col min-h-[360px] overflow-hidden rounded-2xl',
      'bg-white dark:bg-slate-800 ring-1 ring-slate-200 dark:ring-slate-700',
      className
    )}
  >
    {/* Photo placeholder */}
    <Skeleton className="h-56 w-full rounded-none" />

    {/* Card body */}
    <div className="flex flex-col justify-between gap-4 p-4 flex-1">
      <div className="space-y-2">
        <SkeletonHeading width="w-40" />
        <SkeletonText width="w-44" />
        <SkeletonText width="w-24" />
      </div>

      <div className="flex items-center justify-between pt-2 border-t border-slate-200/70 dark:border-slate-700/70">
        <div className="flex items-center gap-2">
          <Skeleton circle className="h-8 w-8" />
          <SkeletonText width="w-24" />
        </div>
        <Skeleton rounded className="h-4 w-16" />
      </div>
    </div>
  </div>
)

/**
 * Full-fidelity skeleton matching SeekerCard layout.
 */
export const SeekerCardSkeleton: React.FC<{ className?: string }> = ({
  className,
}) => (
  <div
    aria-hidden="true"
    aria-label="Loading seeker card"
    className={cn(
      'flex flex-col overflow-hidden rounded-2xl',
      'bg-white dark:bg-slate-800 ring-1 ring-slate-200 dark:ring-slate-700',
      className
    )}
  >
    <div className="p-5 flex flex-col gap-4">
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-center gap-4">
          <Skeleton circle className="h-16 w-16" />
          <div className="space-y-2">
            <SkeletonHeading width="w-32" />
            <SkeletonText width="w-40" />
          </div>
        </div>
        <Skeleton rounded className="h-4 w-16" />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <SkeletonText width="w-20" />
          <SkeletonHeading width="w-24" />
        </div>
        <div className="space-y-2">
          <SkeletonText width="w-20" />
          <SkeletonHeading width="w-24" />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-2">
        {[0, 1, 2, 3].map((i) => (
          <Skeleton key={i} rounded className="h-6 w-full" />
        ))}
      </div>
    </div>
  </div>
)

export const DiscoveryCardSkeleton: React.FC<{ className?: string }> = ({
  className,
}) => <ListingCardSkeleton className={className} />

// ─── Feed Skeleton ────────────────────────────────────────────────────────────
/**
 * Renders n card skeletons for the full discovery feed loading state.
 */
export const FeedSkeleton: React.FC<{
  count?: number
  className?: string
  variant?: 'listing' | 'seeker'
}> = ({ count = 3, className, variant = 'listing' }) => (
  <div className={cn('grid gap-5', className)} aria-label="Loading feed">
    {Array.from({ length: count }, (_, i) =>
      variant === 'seeker' ? (
        <SeekerCardSkeleton key={i} />
      ) : (
        <ListingCardSkeleton key={i} />
      )
    )}
  </div>
)

// ─── Profile Page Skeleton ─────────────────────────────────────────────────────
export const ProfileSkeleton: React.FC<{ className?: string }> = ({ className }) => (
  <div className={cn('flex flex-col gap-6 p-4', className)}>
    {/* Avatar + name */}
    <div className="flex flex-col items-center gap-3 pt-8">
      <SkeletonAvatar size="lg" className="h-20 w-20" />
      <SkeletonHeading width="w-40" />
      <SkeletonText width="w-28" />
    </div>

    {/* Badges row */}
    <div className="flex justify-center gap-2">
      <SkeletonBadge />
      <SkeletonBadge className="w-20" />
    </div>

    {/* Bio */}
    <div className="space-y-2">
      <SkeletonText width="w-full" />
      <SkeletonText width="w-5/6" />
      <SkeletonText width="w-4/6" />
    </div>

    {/* Stats row */}
    <div className="grid grid-cols-3 gap-3">
      {[1, 2, 3].map((i) => (
        <div key={i} className="flex flex-col items-center gap-1.5 rounded-xl bg-slate-50 p-3">
          <Skeleton className="h-7 w-10 rounded" />
          <SkeletonText width="w-14" />
        </div>
      ))}
    </div>

    {/* Lifestyle tags */}
    <div className="flex flex-wrap gap-2">
      {[1, 2, 3, 4].map((i) => (
        <SkeletonBadge key={i} className={i % 2 === 0 ? 'w-24' : 'w-20'} />
      ))}
    </div>
  </div>
)
