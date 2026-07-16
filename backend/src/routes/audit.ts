import { FastifyPluginAsyncZod } from 'fastify-type-provider-zod'
import z from 'zod'
import { auditService } from '../services/AuditService'
import { authenticate } from '../middleware/authenticate'
import { requirePermission } from '../middleware/authorize'

export const auditRoutes: FastifyPluginAsyncZod = async (app) => {
  app.get(
    '/audit',
    {
      preHandler: [authenticate, requirePermission('VIEW_AUDIT_LOGS')],
      schema: {
        description: 'Retrieve immutable audit logs',
        tags: ['audit'],
        security: [{ bearerAuth: [] }],
        querystring: z.object({
          limit: z.coerce.number().min(1).max(100).default(50),
        }),
        response: {
          200: z.object({
            success: z.boolean(),
            logs: z.array(z.any()),
          }),
        },
      },
    },
    async (request, reply) => {
      const { limit } = request.query
      const logs = await auditService.getLogs(limit)
      return { success: true, logs }
    }
  )
}
