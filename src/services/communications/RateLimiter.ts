import { db } from '@/firebase/config'
import {
  doc,
  getDoc,
  setDoc,
  Timestamp,
} from 'firebase/firestore'
import { FeatureFlags } from '@/config/featureFlags'
import { logger } from '@/utils/logger'
import type { CommunicationType } from './CommunicationTypes'

// ─── Rate Limit Configuration ────────────────────────────────────────────────

export interface RateLimitConfig {
  /** Maximum number of attempts allowed within the window */
  maxAttempts: number
  /** Time window in milliseconds */
  windowMs: number
  /** Human-readable description of the limit */
  description: string
}

/**
 * Default rate limits for security-sensitive communication types.
 *
 * Configurable — these defaults can be overridden at runtime
 * by calling `setRateLimitConfig()`.
 */
const DEFAULT_RATE_LIMITS: Partial<Record<CommunicationType, RateLimitConfig>> = {
  login_2fa: {
    maxAttempts: 5,
    windowMs: 60 * 60 * 1000,       // 1 hour
    description: '5 login OTP requests per hour',
  },
  password_reset: {
    maxAttempts: 3,
    windowMs: 60 * 60 * 1000,       // 1 hour
    description: '3 password reset requests per hour',
  },
  verification: {
    maxAttempts: 5,
    windowMs: 24 * 60 * 60 * 1000,  // 24 hours
    description: '5 verification email resends per day',
  },
  report_received: {
    maxAttempts: 3,
    windowMs: 60 * 60 * 1000,       // 1 hour
    description: '3 report submissions per hour',
  },
}

// Mutable copy for runtime overrides
let rateLimits: Partial<Record<CommunicationType, RateLimitConfig>> = { ...DEFAULT_RATE_LIMITS }

// ─── Firestore Schema ────────────────────────────────────────────────────────

const RATE_LIMITS_COLLECTION = 'rate_limits'

interface RateLimitDoc {
  /** Array of attempt timestamps (epoch ms) within the current window */
  attempts: number[]
  /** Last updated timestamp */
  updatedAt: Timestamp
}

// ─── Rate Limit Check Result ─────────────────────────────────────────────────

export interface RateLimitCheckResult {
  /** Whether the action is allowed */
  allowed: boolean
  /** If not allowed, how many milliseconds until the window resets */
  retryAfterMs?: number
  /** Current attempt count within the window */
  currentCount: number
  /** Maximum allowed attempts */
  maxAttempts: number
}

// ─── Rate Limiter ────────────────────────────────────────────────────────────

export const RateLimiter = {
  /**
   * Override default rate limit configuration at runtime.
   */
  setRateLimitConfig(type: CommunicationType, config: RateLimitConfig): void {
    rateLimits[type] = config
    logger.info(`Rate limit updated for ${type}: ${config.description}`)
  },

  /**
   * Get the current rate limit configuration for a communication type.
   * Returns undefined if no rate limit is configured for that type.
   */
  getConfig(type: CommunicationType): RateLimitConfig | undefined {
    return rateLimits[type]
  },

  /**
   * Check whether a user is within their rate limit for a given communication type.
   *
   * This uses a sliding-window approach: we store timestamps of recent attempts
   * and prune any that fall outside the current window.
   */
  async checkRateLimit(
    userId: string,
    type: CommunicationType
  ): Promise<RateLimitCheckResult> {
    // If rate limiting is disabled globally, always allow
    if (!FeatureFlags.ENABLE_RATE_LIMITING) {
      return { allowed: true, currentCount: 0, maxAttempts: Infinity }
    }

    const config = rateLimits[type]
    if (!config) {
      // No rate limit configured for this type — allow
      return { allowed: true, currentCount: 0, maxAttempts: Infinity }
    }

    const docId = `${userId}_${type}`
    const docRef = doc(db, RATE_LIMITS_COLLECTION, docId)

    try {
      const snap = await getDoc(docRef)
      const now = Date.now()
      const windowStart = now - config.windowMs

      if (!snap.exists()) {
        // No previous attempts — allowed
        return { allowed: true, currentCount: 0, maxAttempts: config.maxAttempts }
      }

      const data = snap.data() as RateLimitDoc

      // Prune expired attempts (outside the sliding window)
      const validAttempts = (data.attempts || []).filter(ts => ts > windowStart)
      const currentCount = validAttempts.length

      if (currentCount >= config.maxAttempts) {
        // Find the earliest attempt in the window to calculate retry delay
        const earliest = Math.min(...validAttempts)
        const retryAfterMs = (earliest + config.windowMs) - now

        logger.warn(
          `Rate limit reached for ${type} (user: ${userId}). ` +
          `${currentCount}/${config.maxAttempts} in window. ` +
          `Retry after ${Math.ceil(retryAfterMs / 60000)}m.`
        )

        return {
          allowed: false,
          retryAfterMs: Math.max(0, retryAfterMs),
          currentCount,
          maxAttempts: config.maxAttempts,
        }
      }

      return { allowed: true, currentCount, maxAttempts: config.maxAttempts }
    } catch {
      // If Firestore read fails, fail open (allow) to avoid blocking auth flows
      logger.error(`Rate limit check failed for ${type}. Failing open.`)
      return { allowed: true, currentCount: 0, maxAttempts: config.maxAttempts }
    }
  },

  /**
   * Record a new attempt for rate limiting purposes.
   *
   * Prunes expired entries to prevent unbounded document growth.
   */
  async recordAttempt(
    userId: string,
    type: CommunicationType
  ): Promise<void> {
    const config = rateLimits[type]
    if (!config || !FeatureFlags.ENABLE_RATE_LIMITING) return

    const docId = `${userId}_${type}`
    const docRef = doc(db, RATE_LIMITS_COLLECTION, docId)

    try {
      const snap = await getDoc(docRef)
      const now = Date.now()
      const windowStart = now - config.windowMs

      let validAttempts: number[] = []
      if (snap.exists()) {
        const data = snap.data() as RateLimitDoc
        // Prune expired, add new
        validAttempts = (data.attempts || []).filter(ts => ts > windowStart)
      }

      validAttempts.push(now)

      await setDoc(docRef, {
        attempts: validAttempts,
        updatedAt: Timestamp.now(),
      })
    } catch {
      // Non-blocking — don't fail the main operation if recording fails
      logger.error(`Failed to record rate limit attempt for ${type}.`)
    }
  },

  /**
   * Format a retry-after duration into a human-readable string.
   */
  formatRetryAfter(ms: number): string {
    const minutes = Math.ceil(ms / 60000)
    if (minutes < 60) return `${minutes} minute${minutes === 1 ? '' : 's'}`
    const hours = Math.ceil(minutes / 60)
    return `${hours} hour${hours === 1 ? '' : 's'}`
  },
}
