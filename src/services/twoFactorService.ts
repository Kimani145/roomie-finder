// BACKEND AUTHORITY: Audit logs and OTP generation are handled exclusively by the backend.

import { logger } from '@/utils/logger'
import { fetchWithAuth } from './apiClient'
import toast from 'react-hot-toast'

export async function log2faAuditEvent(
  _userId: string,
  _email: string,
  _action: string,
  _metadata?: Record<string, any>
): Promise<void> {
  // Audit logging is handled server-side by backend endpoints
}

export async function generateAndSendOtp(
  _userId: string,
  email: string,
  _bypassCooldown = false
): Promise<void> {
  try {
    await fetchWithAuth('/api/v1/auth/2fa/send', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ email }),
    })
  } catch (err: any) {
    logger.error('Failed to request 2FA OTP:', err)
    toast.error(err.message || 'Failed to send verification code.')
    throw err
  }
}

export async function verifyOtpCode(
  _userId: string,
  email: string,
  userInputOtp: string
): Promise<{ success: boolean; message: string }> {
  try {
    const data = await fetchWithAuth('/api/v1/auth/2fa/verify', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email,
        code: userInputOtp,
      }),
    })

    return {
      success: Boolean(data.success),
      message:
        data.message ??
        (data.success
          ? 'Identity verified successfully!'
          : data.error ?? 'Verification failed.'),
    }
  } catch (err: any) {
    logger.error('Error verifying OTP:', err)

    return {
      success: false,
      message: err.message || 'Verification failed.',
    }
  }
}

export const twoFactorService = {
  generateSecret: async (
    _uid: string
  ): Promise<{
    qrCodeUrl: string
    secret: string
    otpauthUrl?: string
  }> => {
    try {
      const data = await fetchWithAuth('/api/v1/admin/2fa/setup', {
        method: 'POST',
        body: JSON.stringify({}),
      })

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

  verifyCode: async (
    _uid: string,
    code: string,
    secret: string
  ): Promise<boolean> => {
    try {
      const data = await fetchWithAuth('/api/v1/admin/2fa/verify', {
        method: 'POST',
        body: JSON.stringify({
          code,
          secret,
        }),
      })

      return Boolean(data.success)
    } catch (err: any) {
      logger.error('Failed to verify 2FA code via backend:', err)
      return false
    }
  },

  enable2FA: async (
    _uid: string,
    secret: string
  ): Promise<boolean> => {
    try {
      const data = await fetchWithAuth('/api/v1/admin/2fa/enable', {
        method: 'POST',
        body: JSON.stringify({
          secret,
        }),
      })

      return Boolean(data.success)
    } catch (err: any) {
      logger.error('Failed to enable 2FA via backend:', err)
      return false
    }
  },
}
