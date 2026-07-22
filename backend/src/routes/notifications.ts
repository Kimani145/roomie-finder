import { FastifyPluginAsyncZod } from 'fastify-type-provider-zod'
import z from 'zod'
import { authenticate } from '../middleware/authenticate'
import { requireActiveAccount } from '../middleware/accountState'
import { adminDb } from '../config/firebase'

export const notificationRoutes: FastifyPluginAsyncZod = async (app) => {
  /**
   * GET /notifications
   * List notifications for the authenticated user with optional filtering and limit
   */
  app.get(
    '/notifications',
    {
      preHandler: [authenticate, requireActiveAccount],
      schema: {
        description: 'Get user notifications',
        tags: ['notifications'],
        querystring: z.object({
          limit: z.coerce.number().min(1).max(100).default(30),
          type: z.string().optional(),
        }),
        response: {
          200: z.object({
            notifications: z.array(
              z.object({
                id: z.string(),
                recipientId: z.string(),
                type: z.string(),
                title: z.string(),
                body: z.string(),
                isRead: z.boolean(),
                metadata: z.record(z.unknown()).optional(),
                createdAt: z.string().nullable(),
              })
            ),
            unreadCount: z.number(),
          }),
        },
      },
    },
    async (request) => {
      const userId = request.user.uid
      const { limit: queryLimit, type } = request.query

      const snapshot = await adminDb
        .collection('notifications')
        .where('recipientId', '==', userId)
        .orderBy('createdAt', 'desc')
        .limit(queryLimit)
        .get()

      let notifs = snapshot.docs.map((doc) => {
        const data = doc.data()
        return {
          id: doc.id,
          recipientId: data.recipientId ?? userId,
          type: data.type ?? 'system',
          title: data.title ?? 'Notification',
          body: data.body ?? '',
          isRead: Boolean(data.isRead),
          metadata: data.metadata ?? {},
          createdAt: data.createdAt?.toDate ? data.createdAt.toDate().toISOString() : null,
        }
      })

      if (type) {
        notifs = notifs.filter((n) => n.type === type)
      }

      const unreadCount = notifs.filter((n) => !n.isRead).length

      return {
        notifications: notifs,
        unreadCount,
      }
    }
  )

  /**
   * GET /notifications/unread-count
   * Fast unread notification counter endpoint
   */
  app.get(
    '/notifications/unread-count',
    {
      preHandler: [authenticate],
      schema: {
        description: 'Get total unread notifications count',
        tags: ['notifications'],
        response: {
          200: z.object({
            unreadCount: z.number(),
          }),
        },
      },
    },
    async (request) => {
      const userId = request.user.uid

      const snapshot = await adminDb
        .collection('notifications')
        .where('recipientId', '==', userId)
        .where('isRead', '==', false)
        .get()

      return { unreadCount: snapshot.size }
    }
  )

  /**
   * PATCH /notifications/:id/read
   * Mark a single notification as read
   */
  app.patch(
    '/notifications/:id/read',
    {
      preHandler: [authenticate],
      schema: {
        description: 'Mark notification as read',
        tags: ['notifications'],
        params: z.object({
          id: z.string(),
        }),
        response: {
          200: z.object({
            success: z.boolean(),
          }),
          404: z.object({ error: z.string() }),
        },
      },
    },
    async (request, reply) => {
      const { id } = request.params
      const userId = request.user.uid

      const notifRef = adminDb.collection('notifications').doc(id)
      const notifSnap = await notifRef.get()

      if (!notifSnap.exists || notifSnap.data()?.recipientId !== userId) {
        return reply.status(404).send({ error: 'Notification not found' })
      }

      await notifRef.update({ isRead: true })

      return { success: true }
    }
  )

  /**
   * PATCH /notifications/read-all
   * Mark all notifications as read for current user
   */
  app.patch(
    '/notifications/read-all',
    {
      preHandler: [authenticate],
      schema: {
        description: 'Mark all notifications as read',
        tags: ['notifications'],
        response: {
          200: z.object({
            success: z.boolean(),
            updatedCount: z.number(),
          }),
        },
      },
    },
    async (request) => {
      const userId = request.user.uid

      const unreadSnap = await adminDb
        .collection('notifications')
        .where('recipientId', '==', userId)
        .where('isRead', '==', false)
        .get()

      if (unreadSnap.empty) {
        return { success: true, updatedCount: 0 }
      }

      const batch = adminDb.batch()
      unreadSnap.docs.forEach((doc) => {
        batch.update(doc.ref, { isRead: true })
      })
      await batch.commit()

      return { success: true, updatedCount: unreadSnap.size }
    }
  )

  /**
   * DELETE /notifications/:id
   * Delete a notification
   */
  app.delete(
    '/notifications/:id',
    {
      preHandler: [authenticate],
      schema: {
        description: 'Delete a notification',
        tags: ['notifications'],
        params: z.object({
          id: z.string(),
        }),
        response: {
          200: z.object({
            success: z.boolean(),
          }),
          404: z.object({ error: z.string() }),
        },
      },
    },
    async (request, reply) => {
      const { id } = request.params
      const userId = request.user.uid

      const notifRef = adminDb.collection('notifications').doc(id)
      const notifSnap = await notifRef.get()

      if (!notifSnap.exists || notifSnap.data()?.recipientId !== userId) {
        return reply.status(404).send({ error: 'Notification not found' })
      }

      await notifRef.delete()

      return { success: true }
    }
  )
}
