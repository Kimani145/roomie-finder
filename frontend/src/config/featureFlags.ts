import { logger } from '@/utils/logger'

/**
 * Feature Flags — centralized configuration for toggling platform capabilities.
 *
 * Reads from Vite env vars (`VITE_ENABLE_*`) with safe boolean parsing.
 * All flags default to `true` in production to ensure full functionality
 * unless explicitly disabled.
 *
 * Usage:
 *   import { FeatureFlags } from '@/config/featureFlags'
 *   if (FeatureFlags.ENABLE_EMAILS) { ... }
 *
 * Environment overrides:
 *   VITE_ENABLE_EMAILS=false        → disables ALL email delivery
 *   VITE_ENABLE_2FA=false           → disables two-factor authentication
 *   VITE_ENABLE_TRUST_EMAILS=false  → disables trust & safety emails
 *   VITE_ENABLE_SECURITY_ALERTS=false → disables security alert emails
 *   VITE_ENABLE_AUTH_EMAILS=false   → disables auth category emails
 *   VITE_ENABLE_RATE_LIMITING=false → disables rate limiting enforcement
 */

// ─── Boolean Parser ──────────────────────────────────────────────────────────

function envBool(key: string, defaultValue = true): boolean {
  const raw = import.meta.env?.[key]
  if (raw === undefined || raw === null || raw === '') return defaultValue
  if (typeof raw === 'boolean') return raw
  const str = String(raw).toLowerCase().trim()
  if (str === 'false' || str === '0' || str === 'no' || str === 'off') return false
  if (str === 'true' || str === '1' || str === 'yes' || str === 'on') return true
  return defaultValue
}

// ─── Flag Definitions ────────────────────────────────────────────────────────

export const FeatureFlags = {
  /** Master kill-switch for all email delivery. When false, no emails are sent. */
  ENABLE_EMAILS: envBool('VITE_ENABLE_EMAILS', true),

  /** Toggle two-factor authentication. When false, 2FA is skipped entirely. */
  ENABLE_2FA: envBool('VITE_ENABLE_2FA', true),

  /** Toggle trust & safety category emails (reports, warnings, suspensions, appeals). */
  ENABLE_TRUST_EMAILS: envBool('VITE_ENABLE_TRUST_EMAILS', true),

  /** Toggle security alert emails (login alerts, suspicious activity). */
  ENABLE_SECURITY_ALERTS: envBool('VITE_ENABLE_SECURITY_ALERTS', true),

  /** Toggle auth category emails (verification, password reset, email change). */
  ENABLE_AUTH_EMAILS: envBool('VITE_ENABLE_AUTH_EMAILS', true),

  /** Toggle rate limiting enforcement. When false, rate limits are not checked. */
  ENABLE_RATE_LIMITING: envBool('VITE_ENABLE_RATE_LIMITING', true),
} as const

// ─── Type Export ──────────────────────────────────────────────────────────────

export type FeatureFlagKey = keyof typeof FeatureFlags

// ─── Helper ──────────────────────────────────────────────────────────────────

/**
 * Check whether a specific feature flag is enabled.
 */
export function isFeatureEnabled(flag: FeatureFlagKey): boolean {
  return FeatureFlags[flag]
}

// ─── Startup Log (Dev Only) ──────────────────────────────────────────────────

if (import.meta.env?.DEV) {
  const disabledFlags = (Object.entries(FeatureFlags) as [FeatureFlagKey, boolean][])
    .filter(([, v]) => !v)
    .map(([k]) => k)

  if (disabledFlags.length > 0) {
    logger.warn(`Feature flags DISABLED: ${disabledFlags.join(', ')}`)
  } else {
    logger.info('All feature flags are ENABLED.')
  }
}
