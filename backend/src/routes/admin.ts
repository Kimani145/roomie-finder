import { FastifyPluginAsyncZod } from 'fastify-type-provider-zod'
import z from 'zod'
import { invitationService } from '../services/InvitationService'
import { authenticate } from '../middleware/authenticate'
import { requirePermission } from '../middleware/authorize'

export const adminRoutes: FastifyPluginAsyncZod = async (app) => {
  // Requires authentication and CREATE_ADMIN permission
  app.post(
    '/admin/invitations',
    {
      preHandler: [authenticate, requirePermission('CREATE_ADMIN')],
      schema: {
        description: 'Invite a new administrator',
        tags: ['admin'],
        security: [{ bearerAuth: [] }],
        body: z.object({
          email: z.string().email(),
          role: z.enum(['ADMIN', 'SUPER_ADMIN']),
        }),
        response: {
          200: z.object({
            success: z.boolean(),
            token: z.string(),
            message: z.string(),
          }),
        },
      },
    },
    async (request, reply) => {
      const { email, role } = request.body
      const token = await invitationService.inviteAdmin(email, role, request.user.uid, request.id)
      return { success: true, token, message: 'Invitation sent' }
    }
  )

  // Does NOT require authentication (used by the new admin clicking the link)
  app.post(
    '/admin/invitations/accept',
    {
      schema: {
        description: 'Accept an administrator invitation',
        tags: ['admin'],
        body: z.object({
          token: z.string(),
          uid: z.string(),
          email: z.string().email(),
        }),
        response: {
          200: z.object({
            success: z.boolean(),
            message: z.string(),
          }),
        },
      },
    },
    async (request, reply) => {
      const { token, uid, email } = request.body
      await invitationService.acceptInvitation(token, uid, email, request.id)
      return { success: true, message: 'Invitation accepted successfully' }
    }
  )
}
