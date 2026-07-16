import type { AccountStatus } from '@/types'

/**
 * Account Lifecycle Service — single source of truth for account status logic.
 *
 * This service replaces scattered boolean flags (isSuspended, isAppealing, etc.)
 * with a centralized status model that governs:
 *   - Authentication flow decisions
 *   - Route access (ProtectedRoute)
 *   - Dashboard / feature access
 *   - Communication eligibility
 *   - Moderation decisions
 */

// ─── Valid Status Transitions ────────────────────────────────────────────────

/**
 * Defines which statuses a given status can transition TO.
 * Any transition not listed here is invalid and should be rejected.
 */
export const VALID_TRANSITIONS: Record<AccountStatus, AccountStatus[]> = {
  email_unverified: ['active'],
  active:           ['inactive', 'paused', 'warning', 'suspended', 'banned'],
  inactive:         ['active'],
  paused:           ['active'],
  warning:          ['active', 'suspended', 'banned'],
  suspended:        ['under_appeal', 'banned'],
  under_appeal:     ['reinstated', 'suspended', 'banned'],
  reinstated:       ['active'],
  banned:           [],  // Terminal state — no transitions allowed
}

/**
 * Check whether a status transition is valid.
 */
export function isValidTransition(from: AccountStatus, to: AccountStatus): boolean {
  return VALID_TRANSITIONS[from]?.includes(to) ?? false
}

// ─── Access Control Helpers ──────────────────────────────────────────────────

/**
 * Whether the user can access the main application (discover, chat, etc.).
 */
export function canAccessApp(status: AccountStatus): boolean {
  return ['active', 'warning', 'reinstated'].includes(status)
}

/**
 * Whether the user can create or edit listings.
 */
export function canCreateListings(status: AccountStatus): boolean {
  return ['active', 'reinstated'].includes(status)
}

/**
 * Whether the user can send messages to other users.
 */
export function canSendMessages(status: AccountStatus): boolean {
  return ['active', 'warning', 'reinstated'].includes(status)
}

/**
 * Whether the user can submit an appeal.
 */
export function canSubmitAppeal(status: AccountStatus): boolean {
  return status === 'suspended'
}

/**
 * Whether the user can access the appeal status page.
 */
export function canViewAppealStatus(status: AccountStatus): boolean {
  return ['suspended', 'under_appeal'].includes(status)
}

/**
 * Whether the user should be redirected to the suspension page.
 */
export function shouldRedirectToSuspension(status: AccountStatus): boolean {
  return ['suspended', 'under_appeal', 'banned'].includes(status)
}

/**
 * Whether the account is in a terminal state (no recovery possible).
 */
export function isTerminalStatus(status: AccountStatus): boolean {
  return status === 'banned'
}

// ─── Display Helpers ─────────────────────────────────────────────────────────

interface StatusDisplayInfo {
  label: string
  color: string
  bgColor: string
  description: string
}

/**
 * Get display-friendly information for a given account status.
 * Used for admin dashboards and user-facing status badges.
 */
export function getStatusDisplayInfo(status: AccountStatus): StatusDisplayInfo {
  switch (status) {
    case 'email_unverified':
      return {
        label: 'Email Unverified',
        color: 'text-amber-600 dark:text-amber-400',
        bgColor: 'bg-amber-50 dark:bg-amber-950/40',
        description: 'Email verification pending.',
      }
    case 'active':
      return {
        label: 'Active',
        color: 'text-emerald-600 dark:text-emerald-400',
        bgColor: 'bg-emerald-50 dark:bg-emerald-950/40',
        description: 'Account is in good standing.',
      }
    case 'inactive':
      return {
        label: 'Inactive',
        color: 'text-slate-500 dark:text-slate-400',
        bgColor: 'bg-slate-50 dark:bg-slate-800',
        description: 'User has deactivated their account.',
      }
    case 'paused':
      return {
        label: 'Paused',
        color: 'text-blue-600 dark:text-blue-400',
        bgColor: 'bg-blue-50 dark:bg-blue-950/40',
        description: 'Account is temporarily paused by the user.',
      }
    case 'warning':
      return {
        label: 'Warning',
        color: 'text-orange-600 dark:text-orange-400',
        bgColor: 'bg-orange-50 dark:bg-orange-950/40',
        description: 'Account has received a warning for policy violation.',
      }
    case 'suspended':
      return {
        label: 'Suspended',
        color: 'text-red-600 dark:text-red-400',
        bgColor: 'bg-red-50 dark:bg-red-950/40',
        description: 'Account is suspended pending review or appeal.',
      }
    case 'under_appeal':
      return {
        label: 'Under Appeal',
        color: 'text-violet-600 dark:text-violet-400',
        bgColor: 'bg-violet-50 dark:bg-violet-950/40',
        description: 'Suspension appeal is under review.',
      }
    case 'reinstated':
      return {
        label: 'Reinstated',
        color: 'text-emerald-600 dark:text-emerald-400',
        bgColor: 'bg-emerald-50 dark:bg-emerald-950/40',
        description: 'Account has been reinstated after appeal.',
      }
    case 'banned':
      return {
        label: 'Banned',
        color: 'text-red-700 dark:text-red-500',
        bgColor: 'bg-red-100 dark:bg-red-950/60',
        description: 'Account is permanently banned.',
      }
    default:
      return {
        label: 'Unknown',
        color: 'text-slate-500',
        bgColor: 'bg-slate-50',
        description: 'Unknown account status.',
      }
  }
}
