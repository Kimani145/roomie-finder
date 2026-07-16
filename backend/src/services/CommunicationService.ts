import React from 'react'
import { render } from '@react-email/render'
import { SMTPProvider, EmailPayload } from '../providers/SMTPProvider'
import { logger } from '../utils/logger'

// Import templates
import AdminInvitationEmail from '../templates/admin/AdminInvitationEmail'
import AdminActivatedEmail from '../templates/admin/AdminActivatedEmail'
import AdminLoginAlertEmail from '../templates/admin/AdminLoginAlertEmail'
import AdminRoleChangedEmail from '../templates/admin/AdminRoleChangedEmail'
import AdminDisabledEmail from '../templates/admin/AdminDisabledEmail'
import AccountSuspendedEmail from '../templates/trust/AccountSuspendedEmail'

export class CommunicationService {
  private provider: SMTPProvider

  constructor() {
    this.provider = new SMTPProvider()
  }

  // --- Auth & Admin Notifications ---

  async sendAdminInvitation(to: string, systemRole: string, invitationUrl: string, requestId?: string): Promise<boolean> {
    const html = await render(
      React.createElement(AdminInvitationEmail, {
        email: to,
        systemRole,
        invitationUrl,
        supportEmail: 'security@roomiefinder.com',
        year: new Date().getFullYear(),
      })
    )
    
    return this.provider.sendEmail({
      to,
      subject: 'Roomie Finder Administrator Invitation',
      html,
    }, requestId)
  }

  async sendAdminActivated(to: string, dashboardUrl: string, requestId?: string): Promise<boolean> {
    const html = await render(
      React.createElement(AdminActivatedEmail, {
        email: to,
        dashboardUrl,
        supportEmail: 'security@roomiefinder.com',
        year: new Date().getFullYear(),
      })
    )
    
    return this.provider.sendEmail({
      to,
      subject: 'Administrator Account Activated',
      html,
    }, requestId)
  }

  async sendAdminLoginAlert(to: string, device: string, browser: string, location: string, time: string, requestId?: string): Promise<boolean> {
    const html = await render(
      React.createElement(AdminLoginAlertEmail, {
        email: to,
        device,
        browser,
        location,
        time,
        supportEmail: 'security@roomiefinder.com',
        year: new Date().getFullYear(),
      })
    )
    
    return this.provider.sendEmail({
      to,
      subject: 'Administrator Login Alert',
      html,
    }, requestId)
  }

  async sendAdminRoleChanged(to: string, systemRole: string, requestId?: string): Promise<boolean> {
    const html = await render(
      React.createElement(AdminRoleChangedEmail, {
        email: to,
        systemRole,
        supportEmail: 'security@roomiefinder.com',
        year: new Date().getFullYear(),
      })
    )
    
    return this.provider.sendEmail({
      to,
      subject: 'Administrator Role Updated',
      html,
    }, requestId)
  }

  async sendAdminDisabled(to: string, requestId?: string): Promise<boolean> {
    const html = await render(
      React.createElement(AdminDisabledEmail, {
        email: to,
        supportEmail: 'security@roomiefinder.com',
        year: new Date().getFullYear(),
      })
    )
    
    return this.provider.sendEmail({
      to,
      subject: 'Administrator Access Revoked',
      html,
    }, requestId)
  }

  // --- Trust & Safety Notifications ---

  async sendAccountSuspended(to: string, reason: string, suspensionDate: string, appealId: string, appealUrl: string, firstName?: string, requestId?: string): Promise<boolean> {
    const html = await render(
      React.createElement(AccountSuspendedEmail, {
        firstName,
        reason,
        suspensionDate,
        appealId,
        appealUrl,
        supportEmail: 'trust@roomiefinder.com',
        year: new Date().getFullYear(),
      })
    )
    
    return this.provider.sendEmail({
      to,
      subject: 'Account Suspended - Roomie Finder',
      html,
    }, requestId)
  }

  // For password resets and verification links (native Firebase templates or custom)
  // We can pass simple HTML or use a custom template if built.
  async sendCustomEmail(to: string, subject: string, html: string, requestId?: string): Promise<boolean> {
    return this.provider.sendEmail({ to, subject, html }, requestId)
  }
}

export const communicationService = new CommunicationService()
