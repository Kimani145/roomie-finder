import nodemailer from 'nodemailer'
import { logger } from '../utils/logger'

export interface EmailPayload {
  to: string
  subject: string
  html: string
  text?: string
  replyTo?: string
  cc?: string | string[]
  bcc?: string | string[]
  headers?: Record<string, string>
  idempotencyKey?: string
  correlationId?: string
  tags?: Array<{name: string, value: string}>
  attachments?: Array<{
    filename: string,
    content: Buffer | string,
    contentType?: string
  }>
}

export interface IEmailProvider {
  sendEmail(payload: EmailPayload, requestId?: string): Promise<boolean>
}

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
      // Base headers
      const customHeaders = { ...payload.headers }
      
      // Resend SMTP Idiom: use idempotency key in headers
      if (payload.idempotencyKey) {
        customHeaders['Resend-Idempotency-Key'] = payload.idempotencyKey
      }
      
      if (payload.correlationId) {
        customHeaders['X-Correlation-ID'] = payload.correlationId
      }

      const info = await this.transporter.sendMail({
        from: process.env.SMTP_FROM || 'Roomie Finder <no-reply@roomiefinder.com>',
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
