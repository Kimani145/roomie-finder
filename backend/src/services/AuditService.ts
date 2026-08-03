import { adminDb } from '../config/firebase'
import { FieldValue } from 'firebase-admin/firestore'
import { logger } from '../utils/logger'
import { hydrateUserIdentities } from '../utils/identityHydrator'

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
  | 'report_status_pending'
  | 'report_status_under_review'
  | 'report_status_resolved'
  | 'report_status_archived'
  | 'moderation_ban_user'
  | 'moderation_pause_listing'
  | 'user_banned'
  | 'user_unbanned'
  | 'account_suspension'
  | 'account_reinstated'
  | 'appeal_submitted'
  | 'appeal_decision'
  // Listings Administration
  | 'listing_status_active'
  | 'listing_status_paused'
  | 'listing_status_flagged'
  | 'listing_status_filled'
  | 'listing_featured'
  | 'listing_unfeatured'
  | 'listing_deleted'
  // Admin Team Actions
  | 'admin_role_updated_SUPER_ADMIN'
  | 'admin_role_updated_ADMIN'
  | 'admin_status_active'
  | 'admin_status_disabled'
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

    const uidsToHydrate = docs.flatMap((d) => [d['actorUid'], d['targetUid'], d['metadata']?.targetUid])
    const identities = await hydrateUserIdentities(uidsToHydrate)

    return docs.map((doc) => {
      const actorId = doc['actorUid']
      const targetId = doc['targetUid'] || doc['metadata']?.targetUid
      const actorIdentity = actorId ? identities.get(actorId) : null
      const targetIdentity = targetId ? identities.get(targetId) : null

      return {
        ...doc,
        actor: actorIdentity
          ? {
              uid: actorIdentity.uid,
              name: actorIdentity.displayName,
              email: actorIdentity.email,
              role: actorIdentity.role,
              avatar: actorIdentity.photoURL,
              status: actorIdentity.status,
            }
          : null,
        target: targetIdentity
          ? {
              uid: targetIdentity.uid,
              name: targetIdentity.displayName,
              email: targetIdentity.email,
              role: targetIdentity.role,
              avatar: targetIdentity.photoURL,
              status: targetIdentity.status,
            }
          : null,
      }
    })
  }
}

export const auditService = new AuditService()
