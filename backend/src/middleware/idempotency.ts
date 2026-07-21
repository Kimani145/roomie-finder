import { FastifyRequest, FastifyReply } from 'fastify'
import { adminDb } from '../config/firebase'
import { logger } from '../utils/logger'

export async function checkIdempotency(request: FastifyRequest, reply: FastifyReply) {
  // Only apply to POST, PUT, PATCH, DELETE
  if (['GET', 'HEAD', 'OPTIONS'].includes(request.method)) return

  const idempotencyKey = request.headers['x-idempotency-key']
  if (!idempotencyKey) return

  const keyStr = Array.isArray(idempotencyKey) ? idempotencyKey[0] : idempotencyKey
  
  try {
    const docRef = adminDb.collection('idempotencyKeys').doc(keyStr)
    
    // We use a transaction to ensure no concurrent identical requests race to process
    await adminDb.runTransaction(async (transaction) => {
      const docSnap = await transaction.get(docRef)

      if (docSnap.exists) {
        const data = docSnap.data()
        if (data?.status === 'COMPLETED') {
          reply.status(data.statusCode || 200).send(JSON.parse(data.responseBody))
          // By throwing a special error we can abort the request pipeline in Fastify preHandler
          // However, fastify allows us to just send the reply. If we send it, we must return reply to stop preHandler.
        } else if (data?.status === 'PROCESSING') {
          reply.status(409).send({ error: 'Conflict: Duplicate request currently processing' })
        }
      } else {
        // Mark as processing
        transaction.set(docRef, {
          createdAt: new Date(),
          status: 'PROCESSING',
          path: request.routerPath || request.url,
        })
      }
    })

    // If a reply was sent in the transaction, it means we handled it via cache
    if (reply.sent) {
      return reply
    }

  } catch (err) {
    logger.error('Error checking idempotency', err)
  }
}

// Hook to save the response payload
export async function saveIdempotencyResponse(
  request: FastifyRequest,
  reply: FastifyReply,
  payload: string | Buffer | null
) {
  if (['GET', 'HEAD', 'OPTIONS'].includes(request.method)) return payload

  const idempotencyKey = request.headers['x-idempotency-key']
  if (!idempotencyKey) return payload

  const keyStr = Array.isArray(idempotencyKey) ? idempotencyKey[0] : idempotencyKey

  // Only cache successful or acceptable status codes (e.g. 2xx, 4xx client errors like 400 that are deterministic)
  // We'll just cache < 500
  if (reply.statusCode < 500 && payload) {
    try {
      const payloadStr = Buffer.isBuffer(payload) ? payload.toString('utf8') : payload
      await adminDb.collection('idempotencyKeys').doc(keyStr).update({
        status: 'COMPLETED',
        statusCode: reply.statusCode,
        responseBody: payloadStr,
        completedAt: new Date()
      })
    } catch (err) {
      logger.error('Failed to save idempotency response', err)
    }
  } else {
    // If it's a 500 error, we probably want to delete the key so it can be retried safely
    try {
      await adminDb.collection('idempotencyKeys').doc(keyStr).delete()
    } catch (err) {}
  }

  return payload
}
