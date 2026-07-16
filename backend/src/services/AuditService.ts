import { adminDb } from '../config/firebase'
import { logger } from '../utils/logger'

export interface AuditLogEntry {
  action: string
  actorUid?: string
  targetUid?: string
  targetEmail?: string
  details?: Record<string, any>
  requestId?: string
}

export class AuditService {
  async log(entry: AuditLogEntry): Promise<void> {
    try {
      const logData = {
        ...entry,
        timestamp: new Date(),
      }
      
      await adminDb.collection('auditLogs').add(logData)
    } catch (error) {
      // We don't want audit failures to necessarily crash the request, 
      // but they must be logged as critical.
      logger.error({ msg: 'Failed to write audit log', entry, error })
    }
  }

  async getLogs(limit: number = 50): Promise<any[]> {
    const snapshot = await adminDb.collection('auditLogs')
      .orderBy('timestamp', 'desc')
      .limit(limit)
      .get()
      
    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }))
  }
}

export const auditService = new AuditService()
