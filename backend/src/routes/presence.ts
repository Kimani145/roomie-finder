import { FastifyPluginAsyncZod } from 'fastify-type-provider-zod'
import z from 'zod'
import { authenticate } from '../middleware/authenticate'
import { adminDb } from '../config/firebase'
import { FieldValue } from 'firebase-admin/firestore'

export const presenceRoutes: FastifyPluginAsyncZod = async (app) => {
  /**
   * POST /presence/heartbeat
   * Update online status, last active timestamp, and optional typing status
   */
  app.post(
    '/presence/heartbeat',
    {
      preHandler: [authenticate],
      schema: {
        description: 'Send presence heartbeat',
        tags: ['presence'],
        body: z.object({
          status: z.enum(['online', 'idle', 'offline']).default('online'),
          typingChatId: z.string().nullable().optional(),
        }),
        response: {
          200: z.object({
            success: z.boolean(),
            timestamp: z.string(),
          }),
        },
      },
    },
    async (request) => {
      const userId = request.user.uid
      const { status, typingChatId } = request.body

      const profileRef = adminDb.collection('profiles').doc(userId)
      const nowIso = new Date().toISOString()

      const updateData: Record<string, any> = {
        lastActive: FieldValue.serverTimestamp(),
        onlineStatus: status,
      }

      if (typingChatId !== undefined) {
        updateData.typingChatId = typingChatId
      }

      await profileRef.set(updateData, { merge: true })

      return {
        success: true,
        timestamp: nowIso,
      }
    }
  )

  /**
   * GET /presence/:uid
   * Get user presence metadata
   */
  app.get(
    '/presence/:uid',
    {
      preHandler: [authenticate],
      schema: {
        description: 'Get user presence metadata',
        tags: ['presence'],
        params: z.object({
          uid: z.string(),
        }),
        response: {
          200: z.object({
            uid: z.string(),
            onlineStatus: z.enum(['online', 'idle', 'offline']),
            lastActive: z.string().nullable(),
            isTyping: z.boolean(),
            typingChatId: z.string().nullable().optional(),
          }),
          404: z.object({ error: z.string() }),
        },
      },
    },
    async (request, reply) => {
      const { uid } = request.params

      const doc = await adminDb.collection('profiles').doc(uid).get()
      if (!doc.exists) {
        return reply.status(404).send({ error: 'User profile not found' })
      }

      const data = doc.data()!
      const lastActiveDate = data.lastActive?.toDate ? data.lastActive.toDate() : null

      // If user hasn't updated heartbeat in over 2 minutes, consider them offline
      let computedStatus: 'online' | 'idle' | 'offline' = data.onlineStatus || 'offline'
      if (lastActiveDate && Date.now() - lastActiveDate.getTime() > 2 * 60 * 1000) {
        computedStatus = 'offline'
      }

      return {
        uid,
        onlineStatus: computedStatus,
        lastActive: lastActiveDate ? lastActiveDate.toISOString() : null,
        isTyping: Boolean(data.typingChatId),
        typingChatId: data.typingChatId ?? null,
      }
    }
  )
}
