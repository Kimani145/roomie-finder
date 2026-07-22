import React from 'react'
import { render } from '@react-email/render'
import { IEmailProvider } from '../providers/EmailProvider'
import { SMTPProvider } from '../providers/SMTPProvider'
import { logger } from '../utils/logger'
import { EventBus } from '../events/EventBus'
import { Events, EventPayloads } from '../events/EventCatalogue'

// Import templates
import AdminInvitationEmail from '../templates/admin/AdminInvitationEmail'
import AdminActivatedEmail from '../templates/admin/AdminActivatedEmail'
import AdminLoginAlertEmail from '../templates/admin/AdminLoginAlertEmail'
import AdminRoleChangedEmail from '../templates/admin/AdminRoleChangedEmail'
import AdminDisabledEmail from '../templates/admin/AdminDisabledEmail'
import AccountSuspendedEmail from '../templates/trust/AccountSuspendedEmail'
import { LoginOtpEmail } from '../templates/auth/LoginOtpEmail'
import { adminDb } from '../config/firebase' // Needed for looking up emails if payload only has uid

export class CommunicationService {
  private provider: IEmailProvider

  constructor(provider?: IEmailProvider) {
    this.provider = provider || new SMTPProvider()
    this.setupListeners()
  }

  private setupListeners() {
    EventBus.subscribe(Events.OTP_REQUESTED, async (payload) => {
      await this.sendOtp(payload.email, payload.otp)
    })

    EventBus.subscribe(Events.PASSWORD_RESET_REQUESTED, async (payload) => {
      await this.sendPasswordReset(payload.email, payload.token)
    })

    EventBus.subscribe(Events.ADMIN_INVITED, async (payload) => {
      await this.sendAdminInvitation(payload.email, payload.role, payload.token)
    })

    // Subscribe to more events as needed for email delivery
  }

  // Externally available generic send method if required
  async send(options: { to: string; subject: string; html: string; text?: string; correlationId?: string }): Promise<boolean> {
    try {
      return await this.provider.sendEmail(options)
    } catch (error) {
      logger.error({ msg: 'CommunicationService: send failed', to: options.to, error })
      return false
    }
  }

  // ─── Internal Specific Send Methods ──────────────────────────────────────────

  private async sendOtp(to: string, code: string, device?: string, browser?: string): Promise<boolean> {
    const html = await render(
      React.createElement(LoginOtpEmail, {
        otp: code, device, browser,
        supportEmail: 'security@roomiefinder.com',
        year: new Date().getFullYear(),
      })
    )
    return this.send({ to, subject: 'Your 2FA Login Code - Roomie Finder', html })
  }

  private async sendPasswordReset(to: string, resetLink: string): Promise<boolean> {
    const html = `
      <div style="font-family:sans-serif;max-width:600px;margin:0 auto;padding:24px">
        <h2 style="color:#1d4ed8">Reset Your Roomie Finder Password</h2>
        <p>We received a request to reset your password.</p>
        <a href="${resetLink}" style="display:inline-block;padding:12px 24px;background:#4f46e5;color:#fff;text-decoration:none;border-radius:6px;margin:16px 0;font-weight:bold">Reset Password</a>
        <p style="color:#6b7280;font-size:13px">If you didn't request this, you can safely ignore this email. This link expires in 1 hour.</p>
      </div>`
    const text = `Reset your Roomie Finder password:\n${resetLink}\n\nIf you didn't request this, ignore this email.`
    return this.send({ to, subject: 'Reset your Roomie Finder password', html, text })
  }

  public async sendAdminInvitation(to: string, systemRole: string, invitationUrl: string, correlationId?: string): Promise<boolean> {
    const html = await render(
      React.createElement(AdminInvitationEmail, {
        email: to, systemRole, invitationUrl,
        supportEmail: 'security@roomiefinder.com',
        year: new Date().getFullYear(),
      })
    )
    return this.send({ to, subject: 'Roomie Finder Administrator Invitation', html, correlationId })
  }
}

export const communicationService = new CommunicationService()
