import { collection, addDoc, serverTimestamp } from 'firebase/firestore'
import { db } from '@/firebase/config'
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
  async log(payload: AuditLogPayload): Promise<void> {
    try {
      const logEntry = {
        ...payload,
        userAgent: payload.userAgent || navigator.userAgent,
        ipAddress: payload.ipAddress || 'Unknown', // IP address will be captured if available
        timestamp: serverTimestamp(),
      }

      await addDoc(collection(db, 'auditLogs'), logEntry)
      logger.info(`[Audit] ${payload.action} by ${payload.actorUid}`)
    } catch (error) {
      // We log to console/monitoring, but do not necessarily fail the main transaction
      // if an audit log fails to write, though in a strict environment we might.
      logger.error('Failed to write audit log', error)
    }
  },
}
