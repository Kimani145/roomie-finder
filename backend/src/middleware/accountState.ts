import { FastifyRequest, FastifyReply } from 'fastify'
import { adminDb } from '../config/firebase'

export async function requireActiveAccount(request: FastifyRequest, reply: FastifyReply) {
  if (!request.user || !request.user.uid) {
    return reply.status(401).send({ error: 'Unauthorized: User not authenticated' })
  }

  try {
    const profileSnap = await adminDb.collection('profiles').doc(request.user.uid).get()
    
    if (!profileSnap.exists) {
      return reply.status(403).send({ error: 'Forbidden: Profile does not exist' })
    }

    const status = profileSnap.data()?.status

    // The user must be explicitly active.
    // Suspended, banned, warning, paused, inactive, under_appeal are not allowed
    // to perform privileged actions like messaging, liking, reporting, or appealing 
    // (except appealing a suspension, which is a specific endpoint that might bypass this).
    if (status !== 'active') {
      request.log.warn({ msg: 'Blocked request due to inactive account state', uid: request.user.uid, status })
      
      // Provide a consistent error structure that the frontend can parse
      return reply.status(403).send({ 
        error: 'Forbidden: Account is not active',
        code: 'account_inactive',
        status
      })
    }
  } catch (err) {
    request.log.error({ msg: 'Account state verification failed', err })
    return reply.status(500).send({ error: 'Internal server error verifying account state' })
  }
}
