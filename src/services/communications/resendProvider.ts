import { Resend } from 'resend'
import { db } from '@/firebase/config'
import { collection, addDoc, serverTimestamp } from 'firebase/firestore'
import {
  CommunicationProvider,
  CommunicationPayload,
  CommunicationLog,
  COMMUNICATION_CATEGORIES,
} from './CommunicationTypes'
import { logger } from '@/utils/logger'

const COMMUNICATION_LOGS_COLLECTION = 'communication_logs'

/**
 * Resend API key resolution — server-side only.
 *
 * SECURITY: Only non-VITE_ prefixed env vars are checked.
 * VITE_-prefixed variables are bundled into the client build by Vite,
 * which would expose the API key in the browser. Never reference
 * VITE_RESEND_API_KEY here.
 */
const RESEND_API_KEY =
  (import.meta.env?.RESEND_API_KEY) ||
  ((globalThis as any).process?.env?.RESEND_API_KEY) ||
  ''

const isPlaceholderKey = !RESEND_API_KEY || RESEND_API_KEY.includes('your_') || RESEND_API_KEY.includes('api_key')

let resendClient: Resend | null = null
if (RESEND_API_KEY && !isPlaceholderKey) {
  try {
    resendClient = new Resend(RESEND_API_KEY)
  } catch {
    logger.error('[resendProvider] Failed to initialize Resend client.')
  }
}

/**
 * Translates Resend error responses into user-safe messages.
 * Internal error details are never exposed.
 */
function handleResendError(error: any): string {
  if (!error) return 'An unknown error occurred during email delivery.'
  
  const status = error.statusCode || error.status || error.code
  const message = error.message?.toLowerCase() || ''
  
  if (
    status === 401 ||
    message.includes('api key') ||
    message.includes('unauthorized') ||
    message.includes('invalid api key')
  ) {
    return 'Email service configuration error. Please contact support.'
  }
  if (
    status === 429 ||
    message.includes('rate limit') ||
    message.includes('too many requests')
  ) {
    return 'Rate limit exceeded. Please wait a moment before trying again.'
  }
  if (
    status >= 500 ||
    message.includes('downtime') ||
    message.includes('internal server error') ||
    message.includes('service unavailable')
  ) {
    return 'The email service is temporarily unavailable. Please try again shortly.'
  }
  if (
    status === 400 ||
    message.includes('validation') ||
    message.includes('invalid') ||
    message.includes('recipient') ||
    message.includes('to address')
  ) {
    return 'Invalid recipient email address format.'
  }
  if (
    message.includes('network') ||
    message.includes('fetch') ||
    message.includes('failed to fetch') ||
    message.includes('econnrefused')
  ) {
    return 'Network error: Unable to reach email delivery servers.'
  }
  
  // Never expose raw error messages — return generic message
  return 'An unexpected error occurred during email delivery.'
}

/**
 * Persist communication audit log to Firestore and emit sanitized console output.
 *
 * SECURITY: Logs never contain OTPs, tokens, secrets, or full error objects.
 * Console output is suppressed in production builds.
 */
async function auditCommunicationLog(log: CommunicationLog) {
  // Sanitized console output — development only
  const statusEmoji = log.status === 'sent' ? '✅' : '❌'
  logger.info(
    `📧 [${statusEmoji} ${log.status.toUpperCase()}] ${log.type} → ${log.recipient} via ${log.provider}`
  )
  if (log.providerMessageId) {
    logger.debug(`  Provider Message ID: ${log.providerMessageId}`)
  }
  if (log.requestId) {
    logger.debug(`  Request ID: ${log.requestId}`)
  }
  if (log.failedReason) {
    logger.warn(`  Error: ${log.failedReason}`)
  }

  try {
    await addDoc(collection(db, COMMUNICATION_LOGS_COLLECTION), {
      type: log.type,
      category: log.category,
      recipient: log.recipient,
      provider: log.provider,
      providerMessageId: log.providerMessageId || null,
      status: log.status,
      failedReason: log.failedReason || null,
      requestId: log.requestId || null,
      reportId: log.reportId || null,
      appealId: log.appealId || null,
      createdAt: serverTimestamp(),
    })
  } catch {
    logger.error('[resendProvider] Failed to write communication audit log.')
  }
}

export const resendProvider: CommunicationProvider = {
  send: async (payload: CommunicationPayload, htmlContent: string) => {
    const category = COMMUNICATION_CATEGORIES[payload.type] || 'auth'

    // Select dynamic sender email depending on categorization
    let fromAddress = 'Roomie Finder Security <security@students.tukenya.ac.ke>'
    
    if (payload.type === 'verification') {
      fromAddress = 'Roomie Finder Verification <verify@students.tukenya.ac.ke>'
    } else if (payload.type === 'password_reset' || payload.type === 'email_change') {
      fromAddress = 'Roomie Finder Accounts <accounts@students.tukenya.ac.ke>'
    } else if (category === 'trust') {
      fromAddress = 'Roomie Finder Trust & Safety <safety@students.tukenya.ac.ke>'
    }

    if (isPlaceholderKey || !resendClient) {
      // SECURITY: Simulation log never includes OTPs, tokens, or secrets
      logger.info(
        `[SIMULATION] Sending ${payload.type} email to ${payload.to}.`
      )
      
      const logEntry: CommunicationLog = {
        type: payload.type,
        category,
        recipient: payload.to,
        provider: 'simulation',
        providerMessageId: 'simulated-resend-id',
        status: 'sent',
        requestId: payload.variables.requestId,
        reportId: payload.variables.reportId,
        appealId: payload.variables.appealId,
        createdAt: new Date().toISOString(),
      }
      
      await auditCommunicationLog(logEntry)
      return { success: true, id: 'simulated-resend-id' }
    }

    try {
      const response = await resendClient.emails.send({
        from: fromAddress,
        to: payload.to,
        subject: payload.subject,
        html: htmlContent,
      })

      if (response.error) {
        const friendlyError = handleResendError(response.error)
        const logEntry: CommunicationLog = {
          type: payload.type,
          category,
          recipient: payload.to,
          provider: 'resend',
          status: 'failed',
          failedReason: friendlyError,
          requestId: payload.variables.requestId,
          reportId: payload.variables.reportId,
          appealId: payload.variables.appealId,
          createdAt: new Date().toISOString(),
        }
        await auditCommunicationLog(logEntry)
        return { success: false, error: friendlyError }
      }

      const logEntry: CommunicationLog = {
        type: payload.type,
        category,
        recipient: payload.to,
        provider: 'resend',
        providerMessageId: response.data?.id || undefined,
        status: 'sent',
        requestId: payload.variables.requestId,
        reportId: payload.variables.reportId,
        appealId: payload.variables.appealId,
        createdAt: new Date().toISOString(),
      }
      await auditCommunicationLog(logEntry)
      return { success: true, id: response.data?.id }
    } catch (err: any) {
      const friendlyError = handleResendError(err)
      const logEntry: CommunicationLog = {
        type: payload.type,
        category,
        recipient: payload.to,
        provider: 'resend',
        status: 'failed',
        failedReason: friendlyError,
        requestId: payload.variables.requestId,
        reportId: payload.variables.reportId,
        appealId: payload.variables.appealId,
        createdAt: new Date().toISOString(),
      }
      await auditCommunicationLog(logEntry)
      return { success: false, error: friendlyError }
    }
  },
}
