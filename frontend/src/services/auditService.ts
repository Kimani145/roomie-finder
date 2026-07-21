/**
 * auditService.ts — Frontend audit stub.
 *
 * BACKEND AUTHORITY: All audit logs are written by the backend (AuditService via Admin SDK).
 * Firestore rule: auditLogs — allow create: if false
 *
 * This stub exists so existing callers do not need to be refactored immediately.
 * In development, events are logged to console. In production, they are silently
 * dropped — the backend creates the authoritative audit trail.
 *
 * TODO: Replace remaining callers with server-side audit events in their
 * corresponding backend endpoints (Phase 2 of audit migration).
 */
import { logger } from '@/utils/logger'
import { UserRole } from '@/types'

export type AuditAction =
  | 'admin_created'
  | 'admin_disabled'
  | 'admin_reactivated'
  | 'admin_promoted'
  | 'admin_demoted'
  | 'invitation_sent'
  | 'invitation_accepted'
  | 'password_changed'
  | 'login'
  | 'failed_login'
  | '2fa_enabled'
  | '2fa_verified'
  | 'appeal_decision'
  | 'account_suspension'
  | 'report_reviewed'

export interface AuditLogPayload {
  action: AuditAction
  actorUid: string
  actorEmail?: string
  actorRole?: UserRole
  targetUid?: string
  targetEmail?: string
  details?: Record<string, any>
  ipAddress?: string
  userAgent?: string
  requestId?: string
}

export const auditService = {
  /**
   * @deprecated Frontend audit logging is disabled. Audit events are now
   * written exclusively by the backend. This stub exists for backward
   * compatibility only and will be removed in a future sprint.
   */
  async log(payload: AuditLogPayload): Promise<void> {
    // Development: log to console so devs can see what would have been audited
    if (import.meta.env.DEV) {
      logger.info(`[Audit (client-stub)] ${payload.action} by ${payload.actorUid}`, payload)
    }
    // Production: intentionally no-op — backend owns the audit trail
  },
}
