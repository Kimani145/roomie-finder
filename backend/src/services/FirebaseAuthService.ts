import { adminAuth } from '../config/firebase'
import { communicationService } from './CommunicationService'
import { logger } from '../utils/logger'

export class FirebaseAuthService {
  async sendPasswordResetEmail(email: string, requestId?: string): Promise<boolean> {
    try {
      // 1. Generate link using Admin SDK
      const link = await adminAuth.generatePasswordResetLink(email)
      
      // 2. Send via our SMTP abstraction
      const html = `
        <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
          <h2>Reset Your Roomie Finder Password</h2>
          <p>Hello,</p>
          <p>We received a request to reset your password. Click the button below to choose a new one:</p>
          <a href="${link}" style="display: inline-block; padding: 12px 24px; background-color: #4f46e5; color: white; text-decoration: none; border-radius: 6px; margin: 16px 0;">Reset Password</a>
          <p>If you didn't request this, you can safely ignore this email.</p>
        </div>
      `
      
      await communicationService.sendCustomEmail(email, 'Reset your password', html, requestId)
      return true
    } catch (error) {
      logger.error({ msg: 'Failed to generate password reset link', email, error, requestId })
      throw new Error('Failed to process password reset request')
    }
  }

  async sendEmailVerification(email: string, requestId?: string): Promise<boolean> {
    try {
      const link = await adminAuth.generateEmailVerificationLink(email)
      
      const html = `
        <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
          <h2>Verify your Roomie Finder Email</h2>
          <p>Welcome to Roomie Finder!</p>
          <p>Please verify your email address by clicking the link below:</p>
          <a href="${link}" style="display: inline-block; padding: 12px 24px; background-color: #4f46e5; color: white; text-decoration: none; border-radius: 6px; margin: 16px 0;">Verify Email</a>
        </div>
      `
      
      await communicationService.sendCustomEmail(email, 'Verify your email address', html, requestId)
      return true
    } catch (error) {
      logger.error({ msg: 'Failed to generate email verification link', email, error, requestId })
      throw new Error('Failed to process email verification request')
    }
  }
}

export const firebaseAuthService = new FirebaseAuthService()
