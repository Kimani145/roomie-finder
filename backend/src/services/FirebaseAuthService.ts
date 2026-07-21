import { adminAuth } from '../config/firebase'
import { EventBus } from '../events/EventBus'
import { Events } from '../events/EventCatalogue'
import { auditService } from './AuditService'
import { logger } from '../utils/logger'

export class FirebaseAuthService {
  async sendPasswordResetEmail(email: string, requestId?: string): Promise<boolean> {
    try {
      // Generate link using Admin SDK — the link itself stays server-side only
      const resetLink = await adminAuth.generatePasswordResetLink(email)

      EventBus.publish(Events.PASSWORD_RESET_REQUESTED, {
        email,
        token: resetLink
      })

      await auditService.log({
        action: 'password_reset_request',
        targetEmail: email,
        requestId,
        status: 'success',
      })

      return true
    } catch (error: any) {
      // Swallow user-not-found — prevents email enumeration attacks.
      // Log internally, but return true so the caller shows the same message.
      if (error?.code === 'auth/user-not-found' || error?.errorInfo?.code === 'auth/user-not-found') {
        logger.info({ msg: 'Password reset requested for non-existent email (suppressed)', requestId })
        return true
      }

      logger.error({ msg: 'Failed to generate password reset link', email, error, requestId })
      throw new Error('Failed to process password reset request')
    }
  }

  async sendEmailVerification(email: string, requestId?: string): Promise<boolean> {
    try {
      const verificationLink = await adminAuth.generateEmailVerificationLink(email)

      EventBus.publish(Events.EMAIL_VERIFICATION_REQUESTED, {
        email,
        token: verificationLink
      })

      return true
    } catch (error) {
      logger.error({ msg: 'Failed to generate email verification link', email, error, requestId })
      throw new Error('Failed to process email verification request')
    }
  }
}

export const firebaseAuthService = new FirebaseAuthService()
