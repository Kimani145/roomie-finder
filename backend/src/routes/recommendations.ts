import { FastifyPluginAsyncZod } from 'fastify-type-provider-zod'
import z from 'zod'
import { authenticate } from '../middleware/authenticate'
import { requireActiveAccount } from '../middleware/accountState'
import { recommendationService } from '../services/RecommendationService'

export const recommendationRoutes: FastifyPluginAsyncZod = async (app) => {
  /**
   * GET /recommendations/listings
   * Get intelligent listing recommendations for authenticated student
   */
  app.get(
    '/recommendations/listings',
    {
      preHandler: [authenticate, requireActiveAccount],
      schema: {
        description: 'Get recommended listings',
        tags: ['recommendations'],
        querystring: z.object({
          limit: z.coerce.number().min(1).max(20).default(10),
        }),
        response: {
          200: z.object({
            recommendations: z.array(
              z.object({
                id: z.string(),
                title: z.string(),
                zone: z.string(),
                rentAmount: z.number(),
                roommateShare: z.number(),
                hostId: z.string(),
                images: z.array(z.string()),
                score: z.number(),
                reasons: z.array(z.string()),
              })
            ),
          }),
        },
      },
    },
    async (request) => {
      const userId = request.user.uid
      const { limit } = request.query
      const recommendations = await recommendationService.getRecommendedListings(userId, limit)
      return { recommendations }
    }
  )

  /**
   * GET /recommendations/roommates
   * Get intelligent roommate candidate recommendations for authenticated student
   */
  app.get(
    '/recommendations/roommates',
    {
      preHandler: [authenticate, requireActiveAccount],
      schema: {
        description: 'Get recommended roommates',
        tags: ['recommendations'],
        querystring: z.object({
          limit: z.coerce.number().min(1).max(20).default(10),
        }),
        response: {
          200: z.object({
            recommendations: z.array(
              z.object({
                uid: z.string(),
                displayName: z.string(),
                photoURL: z.string().optional(),
                role: z.string(),
                courseYear: z.string().optional(),
                zones: z.array(z.string()),
                minBudget: z.number(),
                maxBudget: z.number(),
                score: z.number(),
                reasons: z.array(z.string()),
              })
            ),
          }),
        },
      },
    },
    async (request) => {
      const userId = request.user.uid
      const { limit } = request.query
      const recommendations = await recommendationService.getRecommendedRoommates(userId, limit)
      return { recommendations }
    }
  )
}
