import { FastifyPluginAsyncZod } from 'fastify-type-provider-zod'
import z from 'zod'
import { authenticate } from '../middleware/authenticate'
import { requireActiveAccount } from '../middleware/accountState'
import { adminDb } from '../config/firebase'
import { FieldValue } from 'firebase-admin/firestore'

export const favoritesRoutes: FastifyPluginAsyncZod = async (app) => {
  /**
   * GET /favorites
   * List saved listings and roommate profiles for the authenticated user
   */
  app.get(
    '/favorites',
    {
      preHandler: [authenticate, requireActiveAccount],
      schema: {
        description: 'Get user saved wishlist items',
        tags: ['favorites'],
        response: {
          200: z.object({
            favorites: z.array(
              z.object({
                id: z.string(),
                targetType: z.enum(['listing', 'profile']),
                targetId: z.string(),
                createdAt: z.string().nullable(),
                targetData: z.record(z.unknown()).optional(),
              })
            ),
          }),
        },
      },
    },
    async (request) => {
      const userId = request.user.uid

      const snapshot = await adminDb
        .collection('favorites')
        .where('userId', '==', userId)
        .orderBy('createdAt', 'desc')
        .get()

      const favorites = await Promise.all(
        snapshot.docs.map(async (docSnap) => {
          const data = docSnap.data()
          const targetType = data.targetType as 'listing' | 'profile'
          const targetId = data.targetId as string

          let targetData: Record<string, any> = {}
          try {
            if (targetType === 'listing') {
              const listingDoc = await adminDb.collection('listings').doc(targetId).get()
              if (listingDoc.exists) targetData = { id: listingDoc.id, ...listingDoc.data() }
            } else if (targetType === 'profile') {
              const profileDoc = await adminDb.collection('profiles').doc(targetId).get()
              if (profileDoc.exists) targetData = { uid: profileDoc.id, ...profileDoc.data() }
            }
          } catch (err) {}

          return {
            id: docSnap.id,
            targetType,
            targetId,
            createdAt: data.createdAt?.toDate ? data.createdAt.toDate().toISOString() : null,
            targetData,
          }
        })
      )

      return { favorites }
    }
  )

  /**
   * POST /favorites
   * Save a listing or roommate profile
   */
  app.post(
    '/favorites',
    {
      preHandler: [authenticate, requireActiveAccount],
      schema: {
        description: 'Save listing or profile to wishlist',
        tags: ['favorites'],
        body: z.object({
          targetType: z.enum(['listing', 'profile']),
          targetId: z.string(),
        }),
        response: {
          200: z.object({
            success: z.boolean(),
            favoriteId: z.string(),
          }),
          400: z.object({ error: z.string() }),
        },
      },
    },
    async (request, reply) => {
      const userId = request.user.uid
      const { targetType, targetId } = request.body

      // Prevent saving self
      if (targetType === 'profile' && targetId === userId) {
        return reply.status(400).send({ error: 'Cannot save yourself to favorites' })
      }

      // Check existing favorite
      const existingSnap = await adminDb
        .collection('favorites')
        .where('userId', '==', userId)
        .where('targetType', '==', targetType)
        .where('targetId', '==', targetId)
        .get()

      if (!existingSnap.empty) {
        return { success: true, favoriteId: existingSnap.docs[0].id }
      }

      const favRef = await adminDb.collection('favorites').add({
        userId,
        targetType,
        targetId,
        createdAt: FieldValue.serverTimestamp(),
      })

      return { success: true, favoriteId: favRef.id }
    }
  )

  /**
   * DELETE /favorites/:targetId
   * Remove item from wishlist by targetId or favoriteId
   */
  app.delete(
    '/favorites/:targetId',
    {
      preHandler: [authenticate],
      schema: {
        description: 'Remove item from wishlist',
        tags: ['favorites'],
        params: z.object({
          targetId: z.string(),
        }),
        response: {
          200: z.object({
            success: z.boolean(),
          }),
        },
      },
    },
    async (request) => {
      const userId = request.user.uid
      const { targetId } = request.params

      // Try searching by ID directly first
      const directDoc = await adminDb.collection('favorites').doc(targetId).get()
      if (directDoc.exists && directDoc.data()?.userId === userId) {
        await directDoc.ref.delete()
        return { success: true }
      }

      // Otherwise search by targetId
      const snap = await adminDb
        .collection('favorites')
        .where('userId', '==', userId)
        .where('targetId', '==', targetId)
        .get()

      const batch = adminDb.batch()
      snap.docs.forEach((d) => batch.delete(d.ref))
      await batch.commit()

      return { success: true }
    }
  )
}
