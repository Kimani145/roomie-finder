/**
 * EmailProvider — provider-agnostic email abstraction.
 *
 * Changing the email provider only requires:
 *   1. Implementing this interface in a new file (e.g., ResendProvider.ts)
 *   2. Changing EMAIL_PROVIDER env var
 *
 * Business logic in CommunicationService and CommunicationDispatcher
 * never needs to change.
 */

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
  tags?: Array<{ name: string; value: string }>
  attachments?: Array<{
    filename: string
    content: Buffer | string
    contentType?: string
  }>
}

export interface IEmailProvider {
  sendEmail(payload: EmailPayload, requestId?: string): Promise<boolean>
}
