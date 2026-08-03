import { FastifyPluginAsyncZod } from 'fastify-type-provider-zod'
import z from 'zod'
import { firebaseAuthService } from '../services/FirebaseAuthService'
import { twoFactorService } from '../services/TwoFactorService'
import { authenticate } from '../middleware/authenticate'
import { requireActiveAccount } from '../middleware/accountState'

export const authRoutes: FastifyPluginAsyncZod = async (app) => {
  /**
   * POST /auth/password-reset (also /api/v1/auth/password-reset)
   *
   * Security guarantees:
   *   - Tight rate limit (5 per hour per IP) to prevent OTP/reset flooding.
   *   - Always returns 200 regardless of whether the email exists (prevents enumeration).
   *   - No authentication required (user can't log in if they forgot their password).
   *   - Reset link is generated server-side and emailed — never returned to client.
   */
  app.post(
    '/auth/password-reset',
    {
      config: {
        rateLimit: {
          max: 5,
          timeWindow: '1 hour',
        },
      },
      schema: {
        description: 'Request a password reset email. Always returns 200 to prevent email enumeration.',
        tags: ['auth'],
        body: z.object({
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
      const { email } = request.body
      const requestId = request.id

      // Always return the same success message regardless of the result.
      // Errors are logged server-side but never surfaced to the client.
      await firebaseAuthService.sendPasswordResetEmail(email, requestId)

      return { success: true, message: 'If that email is registered, a reset link has been sent.' }
    }
  )

  /**
   * POST /auth/email-verification (also /api/v1/auth/email-verification)
   *
   * Used on registration to trigger the verification email via Admin SDK.
   */
  app.post(
    '/auth/email-verification',
    {
      config: {
        rateLimit: {
          max: 5,
          timeWindow: '1 hour',
        },
      },
      schema: {
        description: 'Sends an email verification link using Firebase Admin SDK',
        tags: ['auth'],
        body: z.object({
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
      const { email } = request.body
      await firebaseAuthService.sendEmailVerification(email, request.id)
      return { success: true, message: 'Verification email sent' }
    }
  )

  /**
   * POST /auth/2fa/send (also /api/v1/auth/2fa/send)
   * Generates and emails an OTP code.
   */
  app.post(
    '/auth/2fa/send',
    {
      preHandler: [authenticate], // user must be signed in to request OTP for their account
      config: {
        rateLimit: {
          max: 5,
          timeWindow: '1 hour',
        },
      },
      schema: {
        description: 'Generates and sends a 2FA OTP code to the user\'s email.',
        tags: ['auth'],
        body: z.object({
          email: z.string().email(),
        }),
        response: {
          200: z.object({
            success: z.boolean(),
            message: z.string(),
          }),
          403: z.object({ error: z.string() }),
          429: z.object({ error: z.string() }),
        },
      },
    },
    async (request, reply) => {
      const { email } = request.body
      const userId = request.user.uid
      const requestId = request.id

      // Ensure the user is only requesting OTP for their own email (case-insensitive)
      if (!request.user.email || request.user.email.toLowerCase() !== email.toLowerCase()) {
        return reply.status(403).send({ error: 'Forbidden: Can only request OTP for your own email' })
      }

      try {
        await twoFactorService.generateAndSendOtp(userId, email, requestId)
        return { success: true, message: 'Verification code sent' }
      } catch (err: any) {
        if (err.message.includes('wait')) {
          return reply.status(429).send({ error: err.message })
        }
        throw err
      }
    }
  )

  /**
   * POST /otp/request (alias for /auth/2fa/send)
   */
  app.post(
    '/otp/request',
    {
      preHandler: [authenticate],
      config: {
        rateLimit: {
          max: 5,
          timeWindow: '1 hour',
        },
      },
      schema: {
        description: 'Generates and sends a 2FA OTP code to the user\'s email.',
        tags: ['auth'],
        body: z.object({
          email: z.string().email(),
        }),
      },
    },
    async (request, reply) => {
      const { email } = request.body
      const userId = request.user.uid
      const requestId = request.id

      if (!request.user.email || request.user.email.toLowerCase() !== email.toLowerCase()) {
        return reply.status(403).send({ error: 'Forbidden: Can only request OTP for your own email' })
      }

      try {
        await twoFactorService.generateAndSendOtp(userId, email, requestId)
        return { success: true, message: 'Verification code sent' }
      } catch (err: any) {
        if (err.message.includes('wait')) {
          return reply.status(429).send({ error: err.message })
        }
        throw err
      }
    }
  )

  /**
   * POST /auth/2fa/verify (also /api/v1/auth/2fa/verify)
   * Verifies the provided OTP code.
   */
  app.post(
    '/auth/2fa/verify',
    {
      preHandler: [authenticate],
      schema: {
        description: 'Verifies the provided OTP code.',
        tags: ['auth'],
        body: z.object({
          email: z.string().email(),
          code: z.string().min(6).max(6),
        }),
        response: {
          200: z.object({
            success: z.boolean(),
            message: z.string(),
          }),
          400: z.object({
            error: z.string(),
          }),
          403: z.object({ error: z.string() }),
        },
      },
    },
    async (request, reply) => {
      const { email, code } = request.body
      const userId = request.user.uid
      const requestId = request.id

      if (!request.user.email || request.user.email.toLowerCase() !== email.toLowerCase()) {
        return reply.status(403).send({ error: 'Forbidden: Can only verify OTP for your own email' })
      }

      const result = await twoFactorService.verifyOtpCode(userId, email, code, requestId)
      
      if (!result.success) {
        return reply.status(400).send({ error: result.message })
      }

      return { success: true, message: result.message }
    }
  )
}
