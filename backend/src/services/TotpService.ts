import { generateSecret, generateURI, generateSync, verifySync } from 'otplib'
import QRCode from 'qrcode'
import { logger } from '../utils/logger'

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
    const secret = generateSecret()
    const otpauthUrl = generateURI({
      secret,
      label: email,
      issuer,
    })
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
      const cleanToken = token.trim().replace(/\D/g, '')
      const cleanSecret = secret.trim()

      const result = verifySync({ token: cleanToken, secret: cleanSecret })
      return Boolean(result && result.valid)
    } catch (error) {
      logger.error({ msg: 'TOTP token verification error', error })
      return false
    }
  }

  /**
   * Utility to generate a current TOTP token (primarily for automated tests).
   */
  generateCurrentToken(secret: string): string {
    return generateSync({ secret })
  }
}

export const totpService = new TotpService()
