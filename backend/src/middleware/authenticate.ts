import { FastifyRequest, FastifyReply } from 'fastify'
import { adminAuth } from '../config/firebase'

// Add user to FastifyRequest type
declare module 'fastify' {
  interface FastifyRequest {
    user?: any
  }
}

export async function authenticate(request: FastifyRequest, reply: FastifyReply) {
  const authHeader = request.headers.authorization
  
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return reply.status(401).send({ error: 'Unauthorized: Missing or invalid token' })
  }
  
  const token = authHeader.split('Bearer ')[1]
  
  try {
    const decodedToken = await adminAuth.verifyIdToken(token)
    request.user = decodedToken
  } catch (error) {
    request.log.warn({ msg: 'Token verification failed', error })
    return reply.status(401).send({ error: 'Unauthorized: Invalid token' })
  }
}
