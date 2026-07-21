import { FastifyPluginAsyncZod } from 'fastify-type-provider-zod'
import z from 'zod'
import { invitationService } from '../services/InvitationService'
import { authenticate } from '../middleware/authenticate'
import { requirePermission } from '../middleware/authorize'
import { profileRepository } from '../repositories/ProfileRepository'
import { EventBus } from '../events/EventBus'
import { Events } from '../events/EventCatalogue'

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

  // Requires authentication and MANAGE_USERS permission
  app.put(
    '/admin/users/:uid/status',
    {
      preHandler: [authenticate, requirePermission('MANAGE_USERS')],
      schema: {
        description: 'Update user account status',
        tags: ['admin'],
        security: [{ bearerAuth: [] }],
        params: z.object({
          uid: z.string(),
        }),
        body: z.object({
          status: z.enum(['active', 'banned']),
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
      const { uid } = request.params
      const { status } = request.body
      
      const profile = await profileRepository.getById(uid)
      if (!profile) {
        return reply.status(404).send({ success: false, message: 'User not found' })
      }

      if (status === 'banned') {
        profile.ban()
      } else if (status === 'active') {
        profile.activate()
      }
      
      await profileRepository.save(profile)
      
      EventBus.publish(Events.PROFILE_UPDATED, { uid, changes: { status } })
      
      return { success: true, message: `User status updated to ${status}` }
    }
  )
}
