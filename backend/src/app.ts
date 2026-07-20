import Fastify, { FastifyInstance } from 'fastify'
import cors from '@fastify/cors'
import swagger from '@fastify/swagger'
import swaggerUi from '@fastify/swagger-ui'
import crypto from 'crypto'
import pino from 'pino'
import {
  serializerCompiler,
  validatorCompiler,
  jsonSchemaTransform,
  ZodTypeProvider,
} from 'fastify-type-provider-zod'

import { logger } from './utils/logger'
import { authRoutes } from './routes/auth'
import { adminRoutes } from './routes/admin'
import { communicationRoutes } from './routes/communications'
import { auditRoutes } from './routes/audit'

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
    genReqId: () => crypto.randomUUID(),
  }).withTypeProvider<ZodTypeProvider>()

  // Replace default Pino logger with our wrapper to inject correlation ID safely if needed,
  // but Fastify already injects `reqId` into request logs. We'll rely on fastify's built-in req.log.

  app.setValidatorCompiler(validatorCompiler)
  app.setSerializerCompiler(serializerCompiler)

  const allowedOrigins = [
    process.env.FRONTEND_URL || 'https://roomie-finder.vercel.app',
    'http://localhost:5173',
    'http://localhost:5174',
  ].filter((origin, index, origins) => origins.indexOf(origin) === index)

  await app.register(cors, {
    origin: (origin, callback) => {
      // Allow non-browser requests (curl, health checks, server-to-server)
      if (!origin) return callback(null, true)
      
      if (allowedOrigins.includes(origin)) {
        return callback(null, true)
      }
      
      // Allow Vercel preview deployments
      if (origin.endsWith('.vercel.app')) {
        return callback(null, true)
      }

      callback(null, false)
    },
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    credentials: true,
  })

  // Rate Limiting
  await app.register(import('@fastify/rate-limit'), {
    max: 100,
    timeWindow: '1 minute'
  })

  // Swagger setup
  await app.register(swagger, {
    openapi: {
      info: {
        title: 'Roomie Finder Trusted Backend API',
        description: 'Secure endpoints for confidential operations.',
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

  // Basic routes
  app.get('/health', async (request, reply) => {
    return { status: 'ok', timestamp: new Date().toISOString() }
  })

  app.get('/version', async (request, reply) => {
    return {
      version: '1.0.0',
      buildTimestamp: new Date().toISOString(),
      nodeVersion: process.version,
      environment: process.env.NODE_ENV || 'development',
    }
  })

  // Register domain routes
  app.register(authRoutes)
  app.register(adminRoutes)
  app.register(communicationRoutes)
  app.register(auditRoutes)

  return app
}
