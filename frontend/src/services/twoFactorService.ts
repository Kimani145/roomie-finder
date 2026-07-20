import { db } from '@/firebase/config'
import {
  doc,
  getDoc,
  setDoc,
  deleteDoc,
  updateDoc,
  addDoc,
  collection,
  Timestamp,
} from 'firebase/firestore'
import toast from 'react-hot-toast'
import { logger } from '@/utils/logger'
import { CommunicationClient } from './CommunicationClient'
const OTPS_COLLECTION = 'otps'
const AUDIT_LOGS_COLLECTION = 'auditLogs'

export interface OtpData {
  email: string
  hashedOtp: string
  createdAt: Timestamp
  expiresAt: Timestamp
  attempts: number
}

/**
 * Cryptographically secure 6-digit numeric OTP generator.
 */
export function generateOtpCode(): string {
  const array = new Uint32Array(1)
  window.crypto.getRandomValues(array)
  const code = ((array[0] % 900000) + 100000).toString()
  return code
}

/**
 * Cryptographically secure SHA-256 hashing of OTP string.
 */
export async function hashOtp(otp: string): Promise<string> {
  const encoder = new TextEncoder()
  const data = encoder.encode(otp)
  const hashBuffer = await crypto.subtle.digest('SHA-256', data)
  const hashArray = Array.from(new Uint8Array(hashBuffer))
  return hashArray.map((b) => b.toString(16).padStart(2, '0')).join('')
}

/**
 * Write a security audit event to Firestore.
 */
export async function log2faAuditEvent(
  userId: string,
  email: string,
  action: '2fa_enabled' | '2fa_disabled' | '2fa_generated' | '2fa_success' | '2fa_failed_attempt' | '2fa_exceeded_attempts',
  metadata?: Record<string, any>
): Promise<void> {
  try {
    await addDoc(collection(db, AUDIT_LOGS_COLLECTION), {
      actorUid: userId,
      email,
      action,
      timestamp: Timestamp.now(),
      userAgent: navigator.userAgent,
      ...metadata,
    })
  } catch (error) {
    logger.error('[twoFactorService] Audit logging failed.')
  }
}

/**
 * Generates and stores a new OTP for the user, checking for a 60-second resend cooldown first.
 */
export async function generateAndSendOtp(
  userId: string,
  email: string,
  bypassCooldown = false
): Promise<void> {
  const otpRef = doc(db, OTPS_COLLECTION, email)
  const snap = await getDoc(otpRef)

  if (snap.exists() && !bypassCooldown) {
    const existing = snap.data() as OtpData
    const elapsedSeconds = Math.floor(
      (Timestamp.now().toMillis() - existing.createdAt.toMillis()) / 1000
    )

    if (elapsedSeconds < 60) {
      throw new Error(`Please wait ${60 - elapsedSeconds}s before requesting a new code.`)
    }
  }

  const plainOtp = generateOtpCode()
  const hashedOtp = await hashOtp(plainOtp)

  const createdAt = Timestamp.now()
  const expiresAt = new Timestamp(createdAt.seconds + 5 * 60, createdAt.nanoseconds) // 5 minutes

  const newOtpData: OtpData = {
    email,
    hashedOtp,
    createdAt,
    expiresAt,
    attempts: 0,
  }

  // Save to Firestore (only one active OTP document per email, overwritten on resend)
  await setDoc(otpRef, newOtpData)

  // Log the event
  await log2faAuditEvent(userId, email, '2fa_generated')

  // Send the email (unified communication system)
  await CommunicationClient.send({
    type: '2FA_CODE',
    to: email,
    payload: {
      code: plainOtp,
      browser: navigator.userAgent,
      device: navigator.platform || 'Web App'
    }
  }).catch((err) => {
    logger.error('Failed to dispatch 2FA email communication:', err)
    toast.error(err.message || 'Failed to send verification code. Please try again.')
    throw err
  })
}

/**
 * Verifies the user-inputted OTP code against the stored hash in Firestore.
 */
export async function verifyOtpCode(
  userId: string,
  email: string,
  userInputOtp: string
): Promise<{ success: boolean; message: string }> {
  const otpRef = doc(db, OTPS_COLLECTION, email)
  const snap = await getDoc(otpRef)

  if (!snap.exists()) {
    return { success: false, message: 'No active verification code found. Please request a new one.' }
  }

  const otpData = snap.data() as OtpData

  // 1. Expiration check
  if (Timestamp.now().toMillis() > otpData.expiresAt.toMillis()) {
    await deleteDoc(otpRef)
    return { success: false, message: 'Verification code has expired (5 minutes). Please request a new one.' }
  }

  // 2. Max attempts check
  if (otpData.attempts >= 5) {
    await deleteDoc(otpRef)
    await log2faAuditEvent(userId, email, '2fa_exceeded_attempts')
    return { success: false, message: 'Maximum attempts (5) exceeded. This code is now invalid. Please request a new one.' }
  }

  // Hash the user's input to compare
  const hashedInput = await hashOtp(userInputOtp)

  if (hashedInput === otpData.hashedOtp) {
    // Correct code! Delete OTP immediately to prevent reuse
    await deleteDoc(otpRef)
    await log2faAuditEvent(userId, email, '2fa_success')
    return { success: true, message: 'Identity verified successfully!' }
  } else {
    // Incorrect code. Increment attempts
    const newAttempts = otpData.attempts + 1
    if (newAttempts >= 5) {
      await deleteDoc(otpRef)
      await log2faAuditEvent(userId, email, '2fa_exceeded_attempts')
      return {
        success: false,
        message: 'Incorrect code. Maximum verification attempts (5) exceeded. Please request a new code.',
      }
    } else {
      await updateDoc(otpRef, { attempts: newAttempts })
      await log2faAuditEvent(userId, email, '2fa_failed_attempt', { attemptNumber: newAttempts })
      return {
        success: false,
        message: `Incorrect code. You have ${5 - newAttempts} attempts remaining.`,
      }
    }
  }
}

// Stub for TOTP (Authenticator App) setup, required by Admin2FASetupPage
export const twoFactorService = {
  generateSecret: async (_uid: string) => {
    logger.warn('TOTP generateSecret not implemented. Returning mock.')
    return { qrCodeUrl: 'mock-url', secret: 'MOCK_SECRET' }
  },
  verifyCode: async (_uid: string, _code: string, _secret: string) => {
    logger.warn('TOTP verifyCode not implemented. Returning true.')
    return true
  },
  enable2FA: async (_uid: string, _secret: string) => {
    logger.warn('TOTP enable2FA not implemented. Returning true.')
    return true
  }
}
