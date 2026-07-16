import { FastifyRequest, FastifyReply } from 'fastify'
import { adminDb } from '../config/firebase'
import { Permission, RolePermissions } from '../policies/permissions'

// Add systemRole to user
declare module 'fastify' {
  interface FastifyRequest {
    systemRole?: string
  }
}

export function requirePermission(requiredPermission: Permission) {
  return async (request: FastifyRequest, reply: FastifyReply) => {
    if (!request.user || !request.user.uid) {
      return reply.status(401).send({ error: 'Unauthorized: User not authenticated' })
    }

    try {
      // Fetch admin doc to determine systemRole
      const adminDoc = await adminDb.collection('admins').doc(request.user.uid).get()
      
      let role = 'STUDENT'
      if (adminDoc.exists) {
        const data = adminDoc.data()
        if (data?.status === 'active') {
          role = data.systemRole || 'ADMIN'
        } else {
          // Admin account disabled
          return reply.status(403).send({ error: 'Forbidden: Admin access revoked' })
        }
      }

      request.systemRole = role

      const permissions = RolePermissions[role] || []
      
      if (!permissions.includes(requiredPermission)) {
        request.log.warn({ msg: 'Permission denied', requiredPermission, uid: request.user.uid, role })
        return reply.status(403).send({ error: `Forbidden: Requires permission ${requiredPermission}` })
      }
      
    } catch (error) {
      request.log.error({ msg: 'Authorization check failed', error })
      return reply.status(500).send({ error: 'Internal server error during authorization' })
    }
  }
}
