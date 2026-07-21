import nodemailer from 'nodemailer'
import { IEmailProvider, EmailPayload } from './EmailProvider'
import { logger } from '../utils/logger'

export { EmailPayload, IEmailProvider } from './EmailProvider'

/**
 * SMTPProvider — Brevo/nodemailer implementation of IEmailProvider.
 *
 * Credentials live in backend/.env only (SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASSWORD).
 * Never exposed to the frontend.
 *
 * Switching to Resend: create ResendProvider.ts that implements IEmailProvider,
 * then update CommunicationDispatcher to load it when EMAIL_PROVIDER=resend.
 */
export class SMTPProvider implements IEmailProvider {
  private transporter: nodemailer.Transporter

  constructor() {
    this.transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: parseInt(process.env.SMTP_PORT || '587', 10),
      secure: process.env.SMTP_PORT === '465',
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASSWORD,
      },
    })
  }

  async sendEmail(payload: EmailPayload, requestId?: string): Promise<boolean> {
    try {
      const customHeaders = { ...payload.headers }

      if (payload.correlationId) {
        customHeaders['X-Correlation-ID'] = payload.correlationId
      }

      const info = await this.transporter.sendMail({
        from: process.env.SMTP_FROM || 'Roomie Finder <no-reply@roomiefinder.app>',
        to: payload.to,
        subject: payload.subject,
        html: payload.html,
        text: payload.text,
        replyTo: payload.replyTo,
        cc: payload.cc,
        bcc: payload.bcc,
        attachments: payload.attachments,
        headers: customHeaders,
      })

      logger.info({
        msg: 'Email sent successfully via SMTP',
        messageId: info.messageId,
        requestId,
        correlationId: payload.correlationId,
        to: payload.to,
      })

      return true
    } catch (error) {
      logger.error({
        msg: 'Failed to send email via SMTP',
        error,
        requestId,
        correlationId: payload.correlationId,
        to: payload.to,
      })
      return false
    }
  }
}
