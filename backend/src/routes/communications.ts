import { FastifyPluginAsyncZod } from 'fastify-type-provider-zod'
import z from 'zod'
import { communicationService } from '../services/CommunicationService'
import { authenticate } from '../middleware/authenticate'
import { requirePermission } from '../middleware/authorize'

export const communicationRoutes: FastifyPluginAsyncZod = async (app) => {
  app.post(
    '/communications/send',
    {
      preHandler: [
        authenticate,
        async (request, reply) => {
          const type = (request.body as any)?.type
          // Allow 2FA_CODE for any authenticated user
          if (type === '2FA_CODE') {
            return
          }
          // Otherwise, require SEND_COMMUNICATIONS permission
          const requirePerm = requirePermission('SEND_COMMUNICATIONS')
          await requirePerm(request, reply)
        }
      ],
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
            '2FA_CODE',
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

      const correlationId = request.headers['x-correlation-id'] as string || request.id

      let sent = false
      try {
        switch (type) {
          case 'admin_login_alert':
            sent = await communicationService.sendAdminLoginAlert(
              to,
              payload.device || 'Unknown',
              payload.browser || 'Unknown',
              payload.location || 'Unknown',
              payload.time || new Date().toLocaleString(),
              correlationId
            )
            break
          case 'admin_role_changed':
            sent = await communicationService.sendAdminRoleChanged(to, payload.systemRole, correlationId)
            break
          case 'admin_disabled':
            sent = await communicationService.sendAdminDisabled(to, correlationId)
            break
          case 'account_suspended':
            sent = await communicationService.sendAccountSuspended(
              to,
              payload.reason,
              payload.suspensionDate,
              payload.appealId,
              payload.appealUrl,
              payload.firstName,
              correlationId
            )
            break
          case '2FA_CODE':
            sent = await communicationService.send2FACode(
              to,
              payload.code,
              payload.device,
              payload.browser,
              correlationId
            )
            break
        }

        if (sent) {
          return { success: true, message: 'Communication sent' }
        } else {
          return reply.status(500).send({ success: false, message: 'Failed to process request' })
        }
      } catch (err) {
        request.log.error({ err, correlationId }, 'Error dispatching communication')
        return reply.status(500).send({ success: false, message: 'Failed to process request' })
      }
    }
  )
}
