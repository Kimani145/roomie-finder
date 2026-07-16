import { FastifyPluginAsyncZod } from 'fastify-type-provider-zod'
import z from 'zod'
import { firebaseAuthService } from '../services/FirebaseAuthService'

export const authRoutes: FastifyPluginAsyncZod = async (app) => {
  app.post(
    '/auth/password-reset',
    {
      schema: {
        description: 'Sends a password reset email using Firebase Admin SDK',
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
      await firebaseAuthService.sendPasswordResetEmail(email, request.id)
      return { success: true, message: 'Password reset email sent' }
    }
  )

  app.post(
    '/auth/email-verification',
    {
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
}
