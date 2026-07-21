import { FastifyPluginAsyncZod } from 'fastify-type-provider-zod'
import z from 'zod'
import { authenticate } from '../middleware/authenticate'
import { adminDb } from '../config/firebase'
import { FieldValue } from 'firebase-admin/firestore'
import { notificationService } from '../services/NotificationService'
import { auditService } from '../services/AuditService'

export const appealRoutes: FastifyPluginAsyncZod = async (app) => {
  /**
   * POST /appeals (also /api/v1/appeals)
   * Submit a new appeal for a suspended/banned account.
   */
  app.post(
    '/appeals',
    {
      preHandler: [authenticate], // Note: Does not require active account
      config: {
        rateLimit: {
          max: 3, // 3 appeals max per day to prevent spam
          timeWindow: '1 day',
        },
      },
      schema: {
        description: 'Submit an appeal',
        tags: ['appeals'],
        body: z.object({
          reason: z.string().min(10).max(2000),
          actionTaken: z.enum(['suspended', 'banned']),
          suspensionDate: z.string().optional().nullable(),
        }),
        response: {
          200: z.object({
            success: z.boolean(),
            appealId: z.string(),
          }),
          400: z.object({ error: z.string() }),
          409: z.object({ error: z.string() })
        },
      },
    },
    async (request, reply) => {
      const { reason, actionTaken, suspensionDate } = request.body
      const userId = request.user.uid
      const requestId = request.id

      // 1. Ensure user is actually suspended/banned
      const profileSnap = await adminDb.collection('profiles').doc(userId).get()
      const status = profileSnap.data()?.status
      if (status !== 'suspended' && status !== 'banned') {
        return reply.status(400).send({ error: 'Account is not suspended or banned.' })
      }

      // 2. Prevent multiple pending appeals
      const existingQuery = await adminDb.collection('appeals')
        .where('userId', '==', userId)
        .where('status', 'in', ['pending', 'in_review'])
        .get()

      if (!existingQuery.empty) {
        return reply.status(409).send({ error: 'You already have a pending appeal.' })
      }

      // 3. Create the appeal document
      const newAppealRef = adminDb.collection('appeals').doc()
      await newAppealRef.set({
        id: newAppealRef.id,
        userId,
        reason,
        actionTaken,
        suspensionDate: suspensionDate || null,
        status: 'pending',
        createdAt: FieldValue.serverTimestamp(),
        updatedAt: FieldValue.serverTimestamp(),
      })

      // 4. Update profile status to under_appeal (if it was suspended)
      if (status === 'suspended') {
        await profileSnap.ref.update({ status: 'under_appeal' })
      }

      // 5. Notify the user they submitted an appeal
      await notificationService.create({
        recipientId: userId,
        type: 'appeal',
        title: 'Appeal Submitted Successfully',
        body: 'We have received your appeal request. Our safety administrators will review it shortly.',
        link: '/appeal-status',
        senderId: 'system_trust_and_safety',
      }).catch(err => request.log.error({ msg: 'Failed to notify user of appeal', err }))

      // 6. Audit logging
      await auditService.log({
        actorUid: userId,
        action: 'appeal_submitted',
        resource: `appeals/${newAppealRef.id}`,
        requestId,
        metadata: { actionTaken }
      })

      return { success: true, appealId: newAppealRef.id }
    }
  )

  /**
   * GET /appeals/me
   * Get the current user's appeals.
   */
  app.get(
    '/appeals/me',
    {
      preHandler: [authenticate],
      schema: {
        description: 'Get user appeals',
        tags: ['appeals'],
        response: {
          200: z.object({
            success: z.boolean(),
            appeals: z.array(z.any()), // Can be tightened later
          }),
        },
      },
    },
    async (request, reply) => {
      const userId = request.user.uid

      const snapshot = await adminDb.collection('appeals')
        .where('userId', '==', userId)
        .orderBy('createdAt', 'desc')
        .get()

      const appeals = snapshot.docs.map(doc => ({
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate().toISOString(),
        updatedAt: doc.data().updatedAt?.toDate().toISOString(),
      }))

      return { success: true, appeals }
    }
  )
}
