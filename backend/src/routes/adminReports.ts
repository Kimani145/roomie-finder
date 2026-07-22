import { FastifyPluginAsyncZod } from 'fastify-type-provider-zod'
import z from 'zod'
import { authenticate } from '../middleware/authenticate'
import { requirePermission } from '../middleware/authorize'
import { adminDb } from '../config/firebase'
import { profileRepository } from '../repositories/ProfileRepository'
import { auditService } from '../services/AuditService'
import { EventBus } from '../events/EventBus'
import { Events } from '../events/EventCatalogue'
import { hydrateUserIdentities } from '../utils/identityHydrator'

export const adminReportsRoutes: FastifyPluginAsyncZod = async (app) => {
  /**
   * GET /admin/reports
   * List reports filtered by status with optional pagination limit
   */
  app.get(
    '/admin/reports',
    {
      preHandler: [authenticate, requirePermission('REVIEW_REPORTS')],
      schema: {
        description: 'Fetch moderation reports by status',
        tags: ['admin-moderation'],
        security: [{ bearerAuth: [] }],
        querystring: z.object({
          status: z.enum(['pending', 'under_review', 'resolved', 'archived']).default('pending'),
          limit: z.coerce.number().min(1).max(100).default(50),
        }),
        response: {
          200: z.object({
            success: z.boolean(),
            reports: z.array(z.any()),
          }),
        },
      },
    },
    async (request, reply) => {
      const { status, limit } = request.query
      
      const snap = await adminDb
        .collection('reports')
        .where('status', '==', status)
        .limit(limit)
        .get()

      const rawReports = snap.docs.map((doc) => {
        const data = doc.data()
        return {
          id: doc.id,
          reportedId: data.reportedId || data.reportedUserId || '',
          reportedBy: data.reportedBy || '',
          reportedName: data.reportedName || '',
          type: data.type || 'user',
          reason: data.reason || '',
          description: data.description || '',
          status: data.status || 'pending',
          assignedAdminUid: data.assignedAdminUid || null,
          createdAt: data.createdAt?.toDate ? data.createdAt.toDate().toISOString() : data.createdAt || null,
          updatedAt: data.updatedAt?.toDate ? data.updatedAt.toDate().toISOString() : data.updatedAt || null,
        }
      })

      // Batch hydrate user identities
      const uidsToHydrate = rawReports.flatMap((r) => [r.reportedId, r.reportedBy, r.assignedAdminUid])
      const identities = await hydrateUserIdentities(uidsToHydrate)

      const reports = rawReports.map((report) => {
        const reportedIdentity = report.reportedId ? identities.get(report.reportedId) : null
        const reporterIdentity = report.reportedBy ? identities.get(report.reportedBy) : null

        return {
          ...report,
          reportedName: reportedIdentity?.displayName || report.reportedName || 'User',
          reportedUser: reportedIdentity
            ? {
                uid: reportedIdentity.uid,
                name: reportedIdentity.displayName,
                email: reportedIdentity.email,
                role: reportedIdentity.role,
                avatar: reportedIdentity.photoURL,
                status: reportedIdentity.status,
              }
            : null,
          reporterUser: reporterIdentity
            ? {
                uid: reporterIdentity.uid,
                name: reporterIdentity.displayName,
                email: reporterIdentity.email,
                role: reporterIdentity.role,
                avatar: reporterIdentity.photoURL,
                status: reporterIdentity.status,
              }
            : null,
        }
      })

      // Sort client-side by createdAt descending to avoid requiring composite indexes in Firestore
      reports.sort((a, b) => {
        const timeA = a.createdAt ? new Date(a.createdAt).getTime() : 0
        const timeB = b.createdAt ? new Date(b.createdAt).getTime() : 0
        return timeB - timeA
      })

      return { success: true, reports }
    }
  )

  /**
   * PUT /admin/reports/:id/status
   * Update report status (e.g. pending -> under_review -> resolved -> archived)
   */
  app.put(
    '/admin/reports/:id/status',
    {
      preHandler: [authenticate, requirePermission('MANAGE_REPORTS')],
      schema: {
        description: 'Update report status and assignment',
        tags: ['admin-moderation'],
        security: [{ bearerAuth: [] }],
        params: z.object({
          id: z.string(),
        }),
        body: z.object({
          status: z.enum(['pending', 'under_review', 'resolved', 'archived']),
        }),
        response: {
          200: z.object({
            success: z.boolean(),
            message: z.string(),
          }),
          404: z.object({ error: z.string() }),
        },
      },
    },
    async (request, reply) => {
      const { id } = request.params
      const { status } = request.body
      const adminUid = request.user.uid

      const reportRef = adminDb.collection('reports').doc(id)
      const doc = await reportRef.get()
      if (!doc.exists) {
        return reply.status(404).send({ error: 'Report not found' })
      }

      const updateData: Record<string, any> = {
        status,
        updatedAt: new Date(),
      }

      if (status === 'under_review') {
        updateData.assignedAdminUid = adminUid
      }

      await reportRef.update(updateData)

      await auditService.log({
        actorUid: adminUid,
        action: `report_status_${status}`,
        resource: `reports/${id}`,
        requestId: request.id,
        metadata: { newStatus: status },
      })

      return { success: true, message: `Report status updated to ${status}` }
    }
  )

  /**
   * POST /admin/reports/:id/action
   * Take critical moderation enforcement action (Ban user or Pause listing) and resolve report
   */
  app.post(
    '/admin/reports/:id/action',
    {
      preHandler: [authenticate, requirePermission('MANAGE_REPORTS')],
      schema: {
        description: 'Execute moderation enforcement action and resolve report',
        tags: ['admin-moderation'],
        security: [{ bearerAuth: [] }],
        params: z.object({
          id: z.string(),
        }),
        body: z.object({
          actionType: z.enum(['ban_user', 'pause_listing']),
          targetId: z.string(),
        }),
        response: {
          200: z.object({
            success: z.boolean(),
            message: z.string(),
          }),
          404: z.object({ error: z.string() }),
        },
      },
    },
    async (request, reply) => {
      const { id } = request.params
      const { actionType, targetId } = request.body
      const adminUid = request.user.uid

      const reportRef = adminDb.collection('reports').doc(id)
      const reportSnap = await reportRef.get()
      if (!reportSnap.exists) {
        return reply.status(404).send({ error: 'Report not found' })
      }

      if (actionType === 'ban_user') {
        const profile = await profileRepository.getById(targetId)
        if (profile) {
          profile.ban()
          await profileRepository.save(profile)
          EventBus.publish(Events.PROFILE_UPDATED, { uid: targetId, changes: { status: 'banned' } })
        }

        // Pause associated listings
        const listingsSnap = await adminDb.collection('listings').where('hostId', '==', targetId).get()
        const batch = adminDb.batch()
        listingsSnap.docs.forEach((d) => {
          batch.update(d.ref, { status: 'paused', updatedAt: new Date() })
        })
        await batch.commit()
      } else if (actionType === 'pause_listing') {
        await adminDb.collection('listings').doc(targetId).update({
          status: 'paused',
          updatedAt: new Date(),
        })
      }

      // Mark report as resolved
      await reportRef.update({
        status: 'resolved',
        resolvedBy: adminUid,
        resolvedAt: new Date(),
        updatedAt: new Date(),
      })

      await auditService.log({
        actorUid: adminUid,
        action: `moderation_${actionType}`,
        resource: `reports/${id}`,
        requestId: request.id,
        metadata: { actionType, targetId },
      })

      return {
        success: true,
        message: actionType === 'ban_user'
          ? 'User banned, associated listings paused, and report resolved'
          : 'Listing paused and report resolved',
      }
    }
  )
}
