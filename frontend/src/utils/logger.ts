/**
 * Production-safe logger utility for Roomie Finder.
 *
 * Principles:
 *  - In development (import.meta.env.DEV): logs normally, but NEVER logs secrets.
 *  - In production: suppresses all debug output. Only sanitized error metadata
 *    is emitted (no stack traces, no raw error objects).
 *
 * Usage:
 *   import { logger } from '@/utils/logger'
 *   logger.info('Component mounted')
 *   logger.warn('Degraded state detected')
 *   logger.error('Operation failed', err)
 */

const isDev = typeof import.meta !== 'undefined' && import.meta.env?.DEV

/**
 * Fields that must NEVER appear in any log output — even in development.
 */
const SENSITIVE_KEYS = new Set([
  'otp',
  'password',
  'hashedOtp',
  'hash',
  'token',
  'refreshToken',
  'accessToken',
  'idToken',
  'sessionToken',
  'apiKey',
  'api_key',
  'secret',
  'authorization',
  'cookie',
  'verificationToken',
  'resetToken',
  'privateKey',
  'credential',
])

/**
 * Recursively strip sensitive keys from an object before logging.
 */
function sanitize(obj: unknown): unknown {
  if (obj === null || obj === undefined) return obj
  if (typeof obj === 'string') return obj
  if (typeof obj === 'number' || typeof obj === 'boolean') return obj

  if (obj instanceof Error) {
    return {
      name: obj.name,
      message: isDev ? obj.message : 'An internal error occurred.',
      // Never include stack in production
      ...(isDev ? { stack: obj.stack } : {}),
    }
  }

  if (Array.isArray(obj)) {
    return obj.map(sanitize)
  }

  if (typeof obj === 'object') {
    const sanitized: Record<string, unknown> = {}
    for (const [key, value] of Object.entries(obj as Record<string, unknown>)) {
      if (SENSITIVE_KEYS.has(key.toLowerCase())) {
        sanitized[key] = '[REDACTED]'
      } else {
        sanitized[key] = sanitize(value)
      }
    }
    return sanitized
  }

  return obj
}

export const logger = {
  /**
   * Informational messages — development only.
   */
  info: (message: string, ...args: unknown[]): void => {
    if (!isDev) return
    console.info(`[Roomie] ${message}`, ...args.map(sanitize))
  },

  /**
   * Warning messages — development only.
   */
  warn: (message: string, ...args: unknown[]): void => {
    if (!isDev) return
    console.warn(`[Roomie] ${message}`, ...args.map(sanitize))
  },

  /**
   * Error messages — emitted in all environments, but sanitized.
   * In production, only the message string is logged (no raw error objects).
   */
  error: (message: string, ...args: unknown[]): void => {
    if (isDev) {
      console.error(`[Roomie] ${message}`, ...args.map(sanitize))
    } else {
      // Production: log only the label — no error objects, no stack traces
      console.error(`[Roomie] ${message}`)
    }
  },

  /**
   * Debug messages — development only. Use for verbose output that
   * would be noise in production.
   */
  debug: (message: string, ...args: unknown[]): void => {
    if (!isDev) return
    console.debug(`[Roomie] ${message}`, ...args.map(sanitize))
  },
}
