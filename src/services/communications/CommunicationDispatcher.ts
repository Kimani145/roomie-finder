import { Timestamp } from 'firebase/firestore'
import { db } from '@/firebase/config'
import { collection, addDoc, serverTimestamp } from 'firebase/firestore'
import { FeatureFlags } from '@/config/featureFlags'
import { RateLimiter } from './RateLimiter'
import { CommunicationFactory } from './CommunicationFactory'
import { resendProvider } from './resendProvider'
import { logger } from '@/utils/logger'
import {
  CommunicationEvent,
  CommunicationLog,
  CommunicationPayload,
  DispatchResult,
  COMMUNICATION_CATEGORIES,
} from './CommunicationTypes'

// ─── Audit Collection ────────────────────────────────────────────────────────

const COMMUNICATION_LOGS_COLLECTION = 'communication_logs'

// ─── Audit Logger ────────────────────────────────────────────────────────────

async function writeAuditLog(log: Omit<CommunicationLog, 'id'>): Promise<void> {
  // Sanitized dev console output
  const statusEmoji = log.status === 'sent' ? '✅' : log.status === 'failed' ? '❌' : '⏸️'
  logger.info(
    `📧 [${statusEmoji} ${log.status.toUpperCase()}] ${log.type} → ${log.recipient} via ${log.provider}`
  )
  if (log.failedReason) {
    logger.warn(`  Reason: ${log.failedReason}`)
  }

  try {
    await addDoc(collection(db, COMMUNICATION_LOGS_COLLECTION), {
      type: log.type,
      category: log.category,
      recipient: log.recipient,
      provider: log.provider,
      providerMessageId: log.providerMessageId || null,
      status: log.status,
      failedReason: log.failedReason || null,
      requestId: log.requestId || null,
      reportId: log.reportId || null,
      appealId: log.appealId || null,
      createdAt: serverTimestamp(),
    })
  } catch {
    logger.error('[CommunicationDispatcher] Failed to write audit log.')
  }
}

// ─── Feature Flag Checks ─────────────────────────────────────────────────────

function isTypeEnabled(type: string): boolean {
  // Master kill-switch
  if (!FeatureFlags.ENABLE_EMAILS) return false

  const category = COMMUNICATION_CATEGORIES[type as keyof typeof COMMUNICATION_CATEGORIES]

  switch (category) {
    case 'auth':
      if (type === 'security_alert') return FeatureFlags.ENABLE_SECURITY_ALERTS
      return FeatureFlags.ENABLE_AUTH_EMAILS
    case 'trust':
      return FeatureFlags.ENABLE_TRUST_EMAILS
    default:
      return true
  }
}

// ─── Dispatcher ──────────────────────────────────────────────────────────────

/**
 * Communication Dispatcher — the event-based dispatch layer.
 *
 * All communication goes through this dispatcher, which:
 *   1. Checks feature flags (can disable categories or all emails)
 *   2. Checks rate limits (prevents abuse)
 *   3. Compiles the template via CommunicationFactory
 *   4. Sends via the provider (resendProvider)
 *   5. Writes an audit log entry
 *
 * The `enqueue()` method currently dispatches immediately, but its
 * signature makes it trivial to swap in Cloud Tasks / BullMQ / RabbitMQ
 * later without refactoring business logic.
 */
export const CommunicationDispatcher = {
  /**
   * Dispatch a communication event immediately.
   *
   * @param event - The communication event to dispatch
   * @param userId - The user ID (for rate limiting). Optional for system-initiated comms.
   * @returns DispatchResult with success status and metadata
   */
  async dispatch(event: CommunicationEvent, userId?: string): Promise<DispatchResult> {
    const { type, recipient, payload } = event
    const category = COMMUNICATION_CATEGORIES[type] || 'auth'

    // ── Step 1: Feature Flag Check ───────────────────────────────────────
    if (!isTypeEnabled(type)) {
      logger.info(`[Dispatcher] ${type} skipped — feature disabled.`)

      await writeAuditLog({
        type,
        category,
        recipient,
        provider: 'disabled',
        status: 'feature_disabled',
        requestId: payload.requestId,
        reportId: payload.reportId,
        appealId: payload.appealId,
        createdAt: Timestamp.now(),
      })

      return { success: true, skipped: true }
    }

    // ── Step 2: Rate Limit Check ─────────────────────────────────────────
    if (userId) {
      const rateCheck = await RateLimiter.checkRateLimit(userId, type)

      if (!rateCheck.allowed) {
        const retryMsg = rateCheck.retryAfterMs
          ? ` Try again in ${RateLimiter.formatRetryAfter(rateCheck.retryAfterMs)}.`
          : ''

        await writeAuditLog({
          type,
          category,
          recipient,
          provider: 'resend',
          status: 'rate_limited',
          failedReason: `Rate limit exceeded (${rateCheck.currentCount}/${rateCheck.maxAttempts}).${retryMsg}`,
          requestId: payload.requestId,
          reportId: payload.reportId,
          appealId: payload.appealId,
          createdAt: Timestamp.now(),
        })

        return {
          success: false,
          rateLimited: true,
          retryAfterMs: rateCheck.retryAfterMs,
          error: `Rate limit exceeded.${retryMsg}`,
        }
      }
    }

    // ── Step 3: Compile Template ─────────────────────────────────────────
    let subject: string
    let html: string

    try {
      const compiled = CommunicationFactory.compile(type, payload)
      subject = compiled.subject
      html = compiled.html
    } catch {
      logger.error(`[Dispatcher] Template compilation failed for ${type}.`)

      await writeAuditLog({
        type,
        category,
        recipient,
        provider: 'resend',
        status: 'failed',
        failedReason: 'Template compilation failed.',
        requestId: payload.requestId,
        reportId: payload.reportId,
        appealId: payload.appealId,
        createdAt: Timestamp.now(),
      })

      return { success: false, error: 'Failed to prepare email content.' }
    }

    // ── Step 4: Send via Provider ────────────────────────────────────────
    const sendPayload: CommunicationPayload = {
      to: recipient,
      type,
      subject,
      variables: payload,
    }

    const result = await resendProvider.send(sendPayload, html)

    // ── Step 5: Record Rate Limit Attempt (on success or provider failure) ─
    if (userId) {
      await RateLimiter.recordAttempt(userId, type)
    }

    // ── Step 6: Audit Log (provider handles its own logging) ─────────────
    // resendProvider already writes audit logs internally, so we don't
    // double-write here. The provider's auditCommunicationLog covers it.

    // ── Step 7: Return Result ────────────────────────────────────────────
    // TRUST BOUNDARY: Never return OTP, tokens, or internal details.
    // Only success/failure and a user-safe error message.
    return {
      success: result.success,
      id: result.id,
      error: result.error,
    }
  },

  /**
   * Enqueue a communication event for delivery.
   *
   * Currently dispatches immediately. This method exists as an
   * architectural seam — swap its implementation to a job queue
   * (Cloud Tasks, BullMQ, RabbitMQ) without changing callers.
   */
  async enqueue(event: CommunicationEvent, userId?: string): Promise<DispatchResult> {
    // Future: push to a durable queue with retry/backoff
    // For now, dispatch immediately
    return CommunicationDispatcher.dispatch(event, userId)
  },
}
