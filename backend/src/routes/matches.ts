import { FastifyPluginAsyncZod } from 'fastify-type-provider-zod'
import z from 'zod'
import { matchService } from '../services/MatchService'
import { authenticate } from '../middleware/authenticate'

// ─── Zod Schemas ─────────────────────────────────────────────────────────────

const LikeBodySchema = z.object({
  targetUid: z.string().min(1, 'targetUid is required'),
  listingId: z.string().optional(),
})

const LikeResponseSchema = z.object({
  success: z.boolean(),
  matched: z.boolean(),
  alreadyLiked: z.boolean().optional(),
  matchId: z.string().optional(),
  chatId: z.string().optional(),
})

// ─── Routes ──────────────────────────────────────────────────────────────────

export const matchRoutes: FastifyPluginAsyncZod = async (app) => {
  /**
   * POST /api/v1/matches/like
   *
   * Authenticated. Rate limited at 60 req/min (inherited from global limiter).
   *
   * Idempotent: calling this twice with the same UIDs returns alreadyLiked:true
   * without creating duplicate documents.
   */
  app.post(
    '/matches/like',
    {
      preHandler: [authenticate],
      config: {
        rateLimit: {
          max: 60,
          timeWindow: '1 minute',
        },
      },
      schema: {
        description: 'Like a user profile. Creates a match and chat if the like is mutual.',
        tags: ['matches'],
        security: [{ bearerAuth: [] }],
        body: LikeBodySchema,
        response: {
          200: LikeResponseSchema,
          400: z.object({ error: z.string() }),
          409: z.object({ error: z.string(), alreadyLiked: z.boolean() }),
        },
      },
    },
    async (request, reply) => {
      const { targetUid, listingId } = request.body
      const fromUid = request.user!.uid

      // Self-like guard
      if (fromUid === targetUid) {
        return reply.status(400).send({ error: 'Cannot like your own profile' })
      }

      try {
        const result = await matchService.likeProfile({
          fromUid,
          toUid: targetUid,
          listingId,
          requestId: request.id,
          ip: request.ip,
        })

        if (result.alreadyLiked && !result.matched) {
          return reply.status(409).send({
            error: 'Already liked this profile',
            alreadyLiked: true,
          })
        }

        return {
          success: true,
          matched: result.matched,
          ...(result.alreadyLiked !== undefined && { alreadyLiked: result.alreadyLiked }),
          ...(result.matchId && { matchId: result.matchId }),
          ...(result.chatId && { chatId: result.chatId }),
        }
      } catch (error: any) {
        request.log.error({ msg: 'matchRoutes: like failed', error: error?.message, fromUid, targetUid })

        if (error?.message?.startsWith('SELF_LIKE')) {
          return reply.status(400).send({ error: 'Cannot like your own profile' })
        }

        return reply.status(500).send({ error: 'Failed to process like' })
      }
    }
  )
}
