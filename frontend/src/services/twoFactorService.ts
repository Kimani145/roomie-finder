// BACKEND AUTHORITY: Audit logs and OTP generation are now handled exclusively by the backend.
// Frontend no longer writes to 'otps' or 'auditLogs' directly.

import { logger } from '@/utils/logger'
import { fetchWithAuth } from './apiClient'
import toast from 'react-hot-toast'

/**
 * Requests the backend to generate and send a new OTP for the user.
 */
export async function generateAndSendOtp(
  _userId: string,
  email: string,
  _bypassCooldown = false
): Promise<void> {
  try {
    const res = await fetchWithAuth('/api/v1/auth/2fa/send', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ email }),
    })
    
    if (!res.ok) {
      const errorData = await res.json()
      if (res.status === 429) {
        throw new Error(errorData.error || 'Please wait before requesting a new code.')
      }
      throw new Error(errorData.error || 'Failed to send verification code.')
    }
  } catch (err: any) {
    logger.error('Failed to request 2FA OTP:', err)
    toast.error(err.message || 'Failed to send verification code. Please try again.')
    throw err
  }
}

/**
 * Verifies the user-inputted OTP code against the backend.
 */
export async function verifyOtpCode(
  _userId: string,
  email: string,
  userInputOtp: string
): Promise<{ success: boolean; message: string }> {
  try {
    const res = await fetchWithAuth('/api/v1/auth/2fa/verify', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ email, code: userInputOtp }),
    })
    
    const data = await res.json()
    if (!res.ok) {
      return { success: false, message: data.error || 'Verification failed.' }
    }
    return { success: true, message: data.message || 'Identity verified successfully!' }
  } catch (err: any) {
    logger.error('Error verifying OTP:', err)
    return { success: false, message: 'An unexpected error occurred during verification.' }
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
