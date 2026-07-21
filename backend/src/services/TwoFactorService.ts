import crypto from 'crypto'
import { adminDb } from '../config/firebase'
import { EventBus } from '../events/EventBus'
import { Events } from '../events/EventCatalogue'
import { auditService } from './AuditService'

const OTPS_COLLECTION = 'otps'

export class TwoFactorService {
  /**
   * Cryptographically secure 6-digit numeric OTP generator.
   */
  private generateOtpCode(): string {
    const min = 100000
    const max = 999999
    return crypto.randomInt(min, max + 1).toString()
  }

  /**
   * Cryptographically secure SHA-256 hashing of OTP string.
   */
  private hashOtp(otp: string): string {
    return crypto.createHash('sha256').update(otp).digest('hex')
  }

  /**
   * Generates and stores a new OTP for the user, checking for a 60-second resend cooldown first.
   */
  async generateAndSendOtp(
    userId: string,
    email: string,
    requestId: string,
    bypassCooldown = false
  ): Promise<void> {
    const otpRef = adminDb.collection(OTPS_COLLECTION).doc(email)
    const snap = await otpRef.get()

    if (snap.exists && !bypassCooldown) {
      const existing = snap.data()
      if (existing?.createdAt) {
        const elapsedSeconds = Math.floor(
          (Date.now() - existing.createdAt.toDate().getTime()) / 1000
        )

        if (elapsedSeconds < 60) {
          throw new Error(`Please wait ${60 - elapsedSeconds}s before requesting a new code.`)
        }
      }
    }

    const plainOtp = this.generateOtpCode()
    const hashedOtp = this.hashOtp(plainOtp)

    const now = new Date()
    const expiresAt = new Date(now.getTime() + 5 * 60 * 1000) // 5 minutes

    const newOtpData = {
      email,
      hashedOtp,
      createdAt: now,
      expiresAt,
      attempts: 0,
    }

    // Save to Firestore (only one active OTP document per email, overwritten on resend)
    await otpRef.set(newOtpData)

    // Log the event
    await auditService.log({
      actorUid: userId,
      action: '2fa_generated',
      resource: `otps/${email}`,
      requestId,
      metadata: { email }
    })

    // Send the email (unified communication system)
    EventBus.publish(Events.OTP_REQUESTED, {
      email,
      otp: plainOtp,
      purpose: 'LOGIN_2FA'
    })
  }

  /**
   * Verifies the user-inputted OTP code against the stored hash in Firestore.
   */
  async verifyOtpCode(
    userId: string,
    email: string,
    userInputOtp: string,
    requestId: string
  ): Promise<{ success: boolean; message: string }> {
    const otpRef = adminDb.collection(OTPS_COLLECTION).doc(email)
    const snap = await otpRef.get()

    if (!snap.exists) {
      return { success: false, message: 'No active verification code found. Please request a new one.' }
    }

    const otpData = snap.data()!

    // 1. Expiration check
    if (Date.now() > otpData.expiresAt.toDate().getTime()) {
      await otpRef.delete()
      return { success: false, message: 'Verification code has expired (5 minutes). Please request a new one.' }
    }

    // 2. Max attempts check
    if (otpData.attempts >= 5) {
      await otpRef.delete()
      await auditService.log({
        actorUid: userId,
        action: '2fa_exceeded_attempts',
        resource: `otps/${email}`,
        requestId,
        metadata: { email }
      })
      return { success: false, message: 'Maximum attempts (5) exceeded. This code is now invalid. Please request a new one.' }
    }

    // Hash the user's input to compare
    const hashedInput = this.hashOtp(userInputOtp)

    if (hashedInput === otpData.hashedOtp) {
      // Correct code! Delete OTP immediately to prevent reuse
      await otpRef.delete()
      await auditService.log({
        actorUid: userId,
        action: '2fa_success',
        resource: `otps/${email}`,
        requestId,
        metadata: { email }
      })
      return { success: true, message: 'Identity verified successfully!' }
    } else {
      // Incorrect code. Increment attempts
      const newAttempts = otpData.attempts + 1
      if (newAttempts >= 5) {
        await otpRef.delete()
        await auditService.log({
          actorUid: userId,
          action: '2fa_exceeded_attempts',
          resource: `otps/${email}`,
          requestId,
          metadata: { email }
        })
        return {
          success: false,
          message: 'Incorrect code. Maximum verification attempts (5) exceeded. Please request a new code.',
        }
      } else {
        await otpRef.update({ attempts: newAttempts })
        await auditService.log({
          actorUid: userId,
          action: '2fa_failed_attempt',
          resource: `otps/${email}`,
          requestId,
          metadata: { attemptNumber: newAttempts, email }
        })
        return {
          success: false,
          message: `Incorrect code. You have ${5 - newAttempts} attempts remaining.`,
        }
      }
    }
  }
}

export const twoFactorService = new TwoFactorService()
