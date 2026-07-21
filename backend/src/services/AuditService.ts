import { adminDb } from '../config/firebase'
import { FieldValue } from 'firebase-admin/firestore'
import { logger } from '../utils/logger'

// ─── Typed Audit Actions ──────────────────────────────────────────────────────
export type AuditAction =
  // Authentication
  | 'login'
  | 'logout'
  | 'failed_login'
  | 'password_reset_request'
  | 'email_verification_sent'
  // Match / Like system
  | 'like'
  | 'match_created'
  // 2FA
  | '2fa_enabled'
  | '2fa_disabled'
  | '2fa_generated'
  | '2fa_success'
  | '2fa_failed_attempt'
  | '2fa_exceeded_attempts'
  // Admin management
  | 'admin_created'
  | 'admin_disabled'
  | 'admin_reactivated'
  | 'admin_promoted'
  | 'admin_demoted'
  | 'invitation_sent'
  | 'admin_activated'
  // Trust & Safety
  // Trust & Safety
  | 'report_submitted'
  | 'report_reviewed'
  | 'account_suspension'
  | 'account_reinstated'
  | 'appeal_submitted'
  | 'appeal_decision'
  // Messaging
  | 'message_sent'

export type AuditStatus = 'success' | 'failure' | 'pending'

export interface AuditLogEntry {
  /** The type of action being logged */
  action: AuditAction
  /** The specific resource URI involved (e.g., otps/email@tukenya.ac.ke) */
  resource?: string
  /** UID of the user performing the action */
  actorUid?: string
  /** Email of the acting user (for readability) */
  actorEmail?: string
  /** UID of the user the action targets */
  targetUid?: string
  /** Email of the target user */
  targetEmail?: string
  /** Result of the action */
  status?: AuditStatus
  /** Free-form context data */
  details?: Record<string, unknown>
  /** HTTP request correlation ID */
  requestId?: string
  /** HTTP request correlation ID (alias) */
  correlationId?: string
  /** Requester IP address */
  ip?: string
  /** Requester user-agent string */
  userAgent?: string
  /** Arbitrary metadata specific to the action */
  metadata?: Record<string, unknown>
}

export class AuditService {
  async log(entry: AuditLogEntry): Promise<void> {
    try {
      const logData = {
        ...entry,
        status: entry.status ?? 'success',
        timestamp: FieldValue.serverTimestamp(),
      }

      await adminDb.collection('auditLogs').add(logData)
    } catch (error) {
      // Audit failures must never crash the primary request.
      // They are always logged as critical errors.
      logger.error({ msg: 'CRITICAL: Failed to write audit log', entry, error })
    }
  }

  async getLogs(limit: number = 50, filters?: { actorUid?: string; action?: AuditAction }): Promise<any[]> {
    let q = adminDb.collection('auditLogs').orderBy('timestamp', 'desc').limit(limit)

    // NOTE: compound queries require Firestore indexes. For now, filter post-fetch
    // if the index doesn't exist. A future migration can add the index.

    const snapshot = await q.get()
    let docs: Record<string, any>[] = snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
      timestamp: (doc.data().timestamp as any)?.toDate?.()?.toISOString?.() ?? null,
    }))

    if (filters?.actorUid) {
      docs = docs.filter((d) => d['actorUid'] === filters!.actorUid)
    }
    if (filters?.action) {
      docs = docs.filter((d) => d['action'] === filters!.action)
    }

    return docs
  }
}

export const auditService = new AuditService()
