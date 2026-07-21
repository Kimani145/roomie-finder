import Fastify, { FastifyInstance } from 'fastify'
import cors from '@fastify/cors'
import swagger from '@fastify/swagger'
import swaggerUi from '@fastify/swagger-ui'
import crypto from 'crypto'
import {
  serializerCompiler,
  validatorCompiler,
  jsonSchemaTransform,
  ZodTypeProvider,
} from 'fastify-type-provider-zod'

import { logger } from './utils/logger'
import { AppError } from './domain/errors'
import { authRoutes } from './routes/auth'
import { adminRoutes } from './routes/admin'
import { auditRoutes } from './routes/audit'
import { profileRoutes } from './routes/profiles'
import { listingRoutes } from './routes/listings'
import { matchRoutes } from './routes/matches'
import { chatRoutes } from './routes/chats'
import { appealRoutes } from './routes/appeals'
import { reportRoutes } from './routes/reports'

export async function buildApp() {
  const app = Fastify({
    logger: {
      level: process.env.LOG_LEVEL || 'info',
      ...(process.env.NODE_ENV === 'development' && {
        transport: {
          target: 'pino-pretty',
          options: { translateTime: 'HH:MM:ss Z', ignore: 'pid,hostname' },
        },
      }),
    },
    genReqId: (req) => {
      const headerId = req.headers['x-correlation-id']
      return (Array.isArray(headerId) ? headerId[0] : headerId) || crypto.randomUUID()
    },
    trustProxy: true, // Required for accurate req.ip behind Fly.io / Vercel
  }).withTypeProvider<ZodTypeProvider>()

  app.setValidatorCompiler(validatorCompiler)
  app.setSerializerCompiler(serializerCompiler)

  // ─── CORS ──────────────────────────────────────────────────────────────────
  const allowedOrigins = [
    process.env.FRONTEND_URL || 'https://tuk-roomie-finder.vercel.app',
    'http://localhost:5173',
    'http://localhost:5174',
  ].filter((origin, index, origins) => origins.indexOf(origin) === index)

  await app.register(cors, {
    origin: (origin, callback) => {
      // Allow non-browser requests (curl, health checks, server-to-server)
      if (!origin) return callback(null, true)
      if (allowedOrigins.includes(origin)) return callback(null, true)
      // Allow Vercel preview deployments
      if (origin.endsWith('.vercel.app')) return callback(null, true)
      callback(null, false)
    },
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    credentials: true,
  })

  // ─── Global Rate Limiting ──────────────────────────────────────────────────
  // Per-route overrides are defined in each route's `config.rateLimit`.
  await app.register(import('@fastify/rate-limit'), {
    max: 100,
    timeWindow: '1 minute',
    // Tighter limit for mutation endpoints — applied globally
    // Individual routes can override via config.rateLimit
    keyGenerator: (request) => {
      // Rate limit by authenticated UID when available, else by IP
      return (request.user?.uid ?? request.ip) as string
    },
  })

  // ─── Global Hooks ──────────────────────────────────────────────────────────
  app.addHook('onSend', async (request, reply, payload) => {
    reply.header('x-correlation-id', request.id)
    
    // Process idempotency storage if it was triggered
    const { saveIdempotencyResponse } = await import('./middleware/idempotency')
    return saveIdempotencyResponse(request, reply, payload as string | Buffer | null)
  })

  // ─── Swagger ───────────────────────────────────────────────────────────────
  await app.register(swagger, {
    openapi: {
      info: {
        title: 'Roomie Finder Trusted Backend API',
        description: 'Secure endpoints for confidential operations. All sensitive writes originate here.',
        version: '1.0.0',
      },
      components: {
        securitySchemes: {
          bearerAuth: {
            type: 'http',
            scheme: 'bearer',
            bearerFormat: 'JWT', // Firebase ID Token
          },
        },
      },
    },
    transform: jsonSchemaTransform,
  })

  await app.register(swaggerUi, {
    routePrefix: '/documentation',
  })

  // ─── Global Error Handling ──────────────────────────────────────────────────
  app.setErrorHandler((error, request, reply) => {
    // Handle our Domain AppErrors
    if (error instanceof AppError) {
      if (!error.isOperational) {
        // Log critical infrastructure failures but don't leak stack traces
        logger.error({ msg: 'Infrastructure Error', err: error, correlationId: request.id })
        return reply.status(error.statusCode).send({
          error: 'Internal Server Error',
          message: 'An unexpected infrastructure error occurred.'
        })
      }
      return reply.status(error.statusCode).send({
        error: error.name,
        message: error.message
      })
    }

    // Handle Zod Validation Errors
    if (error.validation) {
      return reply.status(400).send({
        error: 'ValidationError',
        message: 'Invalid request payload',
        details: error.validation
      })
    }

    // Fallback for uncaught exceptions
    logger.error({ msg: 'Unhandled Exception', err: error, correlationId: request.id })
    return reply.status(500).send({
      error: 'Internal Server Error',
      message: 'An unexpected error occurred.'
    })
  })

  // ─── Health & Version ──────────────────────────────────────────────────────
  app.get('/health', async () => ({ status: 'ok', timestamp: new Date().toISOString() }))

  app.get('/version', async () => ({
    version: '1.0.0',
    buildTimestamp: new Date().toISOString(),
    nodeVersion: process.version,
    environment: process.env.NODE_ENV || 'development',
  }))

  // ─── API v1 Routes ────────────────────────────────────────────────────────
  // All domain routes are mounted under /api/v1 for versioning.
  await app.register(async (v1) => {
    v1.register(authRoutes)
    v1.register(adminRoutes)
    v1.register(auditRoutes)
    v1.register(profileRoutes, { prefix: '/profiles' })
    v1.register(listingRoutes, { prefix: '/listings' })
    v1.register(matchRoutes)
    v1.register(chatRoutes)
    v1.register(appealRoutes)
    v1.register(reportRoutes)
  }, { prefix: '/api/v1' })

  // ─── Legacy unversioned routes ─────────────────────────────────────────────
  // Kept for backward compatibility while frontend migrates to /api/v1.
  // TODO: Remove once frontend is fully migrated.
  app.register(authRoutes)
  app.register(adminRoutes)
  app.register(auditRoutes)
  app.register(chatRoutes)
  app.register(appealRoutes)
  app.register(reportRoutes)

  return app
}
