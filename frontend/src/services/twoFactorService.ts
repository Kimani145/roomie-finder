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

export const twoFactorService = {
  generateSecret: async (_uid: string): Promise<{ qrCodeUrl: string; secret: string; otpauthUrl?: string }> => {
    try {
      const data = await fetchWithAuth('/api/v1/admin/2fa/setup', {
        method: 'POST',
        body: JSON.stringify({}),
      })
      if (!data.success) {
        throw new Error(data.error || 'Failed to generate 2FA secret')
      }
      return {
        qrCodeUrl: data.qrCodeUrl,
        secret: data.secret,
        otpauthUrl: data.otpauthUrl,
      }
    } catch (err: any) {
      logger.error('Failed to generate 2FA secret from backend:', err)
      throw err
    }
  },

  verifyCode: async (_uid: string, code: string, secret: string): Promise<boolean> => {
    try {
      const data = await fetchWithAuth('/api/v1/admin/2fa/verify', {
        method: 'POST',
        body: JSON.stringify({ code, secret }),
      })
      return Boolean(data.success)
    } catch (err: any) {
      logger.error('Failed to verify 2FA code via backend:', err)
      return false
    }
  },

  enable2FA: async (_uid: string, secret: string): Promise<boolean> => {
    try {
      const data = await fetchWithAuth('/api/v1/admin/2fa/enable', {
        method: 'POST',
        body: JSON.stringify({ secret }),
      })
      return Boolean(data.success)
    } catch (err: any) {
      logger.error('Failed to enable 2FA via backend:', err)
      return false
    }
  },
}
