import { authenticator } from 'otplib'
import QRCode from 'qrcode'
import { logger } from '../utils/logger'

// Allow +/- 1 window (30-second time drift buffer) for TOTP verification
authenticator.options = { window: 1 }

export interface TotpSetupData {
  secret: string
  otpauthUrl: string
  qrCodeUrl: string
}

export class TotpService {
  /**
   * Generates a unique Base32 secret, an otpauth:// URI, and a Base64 QR code Data URL.
   */
  async generateSecret(email: string, issuer = 'Roomie Finder Admin'): Promise<TotpSetupData> {
    const secret = authenticator.generateSecret()
    const otpauthUrl = authenticator.keyuri(email, issuer, secret)
    const qrCodeUrl = await QRCode.toDataURL(otpauthUrl)

    logger.info({ msg: 'Generated new TOTP secret and QR code', email, issuer })

    return {
      secret,
      otpauthUrl,
      qrCodeUrl,
    }
  }

  /**
   * Verifies a 6-digit TOTP token against a Base32 secret.
   */
  verifyToken(token: string, secret: string): boolean {
    if (!token || !secret) {
      return false
    }

    try {
      // Clean input: remove spaces or non-digit characters
      const cleanToken = token.trim().replace(/\D/g, '')
      const cleanSecret = secret.trim()

      const isValid = authenticator.check(cleanToken, cleanSecret)
      return isValid
    } catch (error) {
      logger.error({ msg: 'TOTP token verification error', error })
      return false
    }
  }
}

export const totpService = new TotpService()
