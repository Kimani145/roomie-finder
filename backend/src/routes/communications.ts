import { FastifyPluginAsyncZod } from 'fastify-type-provider-zod'
import z from 'zod'
import { communicationService } from '../services/CommunicationService'
import { authenticate } from '../middleware/authenticate'
import { requirePermission } from '../middleware/authorize'

export const communicationRoutes: FastifyPluginAsyncZod = async (app) => {
  app.post(
    '/communications/send',
    {
      preHandler: [authenticate, requirePermission('SEND_COMMUNICATIONS')],
      schema: {
        description: 'Dispatch a communication template',
        tags: ['communications'],
        security: [{ bearerAuth: [] }],
        body: z.object({
          type: z.enum([
            'admin_login_alert',
            'admin_role_changed',
            'admin_disabled',
            'account_suspended',
          ]),
          to: z.string().email(),
          payload: z.record(z.any()),
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
      const { type, to, payload } = request.body

      let sent = false
      switch (type) {
        case 'admin_login_alert':
          sent = await communicationService.sendAdminLoginAlert(
            to,
            payload.device || 'Unknown',
            payload.browser || 'Unknown',
            payload.location || 'Unknown',
            payload.time || new Date().toLocaleString(),
            request.id
          )
          break
        case 'admin_role_changed':
          sent = await communicationService.sendAdminRoleChanged(to, payload.systemRole, request.id)
          break
        case 'admin_disabled':
          sent = await communicationService.sendAdminDisabled(to, request.id)
          break
        case 'account_suspended':
          sent = await communicationService.sendAccountSuspended(
            to,
            payload.reason,
            payload.suspensionDate,
            payload.appealId,
            payload.appealUrl,
            payload.firstName,
            request.id
          )
          break
      }

      if (sent) {
        return { success: true, message: 'Communication sent' }
      } else {
        return reply.status(500).send({ success: false, message: 'Failed to send communication' })
      }
    }
  )
}
