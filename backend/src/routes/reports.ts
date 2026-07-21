import { FastifyPluginAsyncZod } from 'fastify-type-provider-zod'
import z from 'zod'
import { authenticate } from '../middleware/authenticate'
import { requireActiveAccount } from '../middleware/accountState'
import { adminDb } from '../config/firebase'
import { FieldValue } from 'firebase-admin/firestore'
import { auditService } from '../services/AuditService'

export const reportRoutes: FastifyPluginAsyncZod = async (app) => {
  /**
   * POST /reports (also /api/v1/reports)
   * Submit a trust and safety report.
   */
  app.post(
    '/reports',
    {
      preHandler: [authenticate, requireActiveAccount],
      config: {
        rateLimit: {
          max: 10,
          timeWindow: '1 day',
        },
      },
      schema: {
        description: 'Submit a trust and safety report',
        tags: ['reports'],
        body: z.object({
          reportedUserId: z.string(),
          reason: z.string(),
          description: z.string().optional(),
          evidenceLink: z.string().optional().nullable(),
        }),
        response: {
          200: z.object({
            success: z.boolean(),
            reportId: z.string(),
          }),
          400: z.object({ error: z.string() }),
          409: z.object({ error: z.string() })
        },
      },
    },
    async (request, reply) => {
      const { reportedUserId, reason, description, evidenceLink } = request.body
      const reporterUid = request.user.uid
      const requestId = request.id

      if (reportedUserId === reporterUid) {
        return reply.status(400).send({ error: 'You cannot report yourself' })
      }

      // 1. Prevent duplicate pending reports for the same user by the same reporter
      const existingQuery = await adminDb.collection('reports')
        .where('reportedBy', '==', reporterUid)
        .where('reportedUserId', '==', reportedUserId)
        .where('status', 'in', ['pending', 'in_review'])
        .get()

      if (!existingQuery.empty) {
        return reply.status(409).send({ error: 'You already have a pending report for this user.' })
      }

      // 2. Create report document
      const newReportRef = adminDb.collection('reports').doc()
      await newReportRef.set({
        id: newReportRef.id,
        reportedBy: reporterUid,
        reportedUserId,
        reason,
        description: description || '',
        evidenceLink: evidenceLink || null,
        status: 'pending',
        createdAt: FieldValue.serverTimestamp(),
      })

      // 3. Audit log
      await auditService.log({
        actorUid: reporterUid,
        action: 'report_submitted',
        resource: `reports/${newReportRef.id}`,
        requestId,
        metadata: { reportedUserId, reason }
      })

      return { success: true, reportId: newReportRef.id }
    }
  )
}
