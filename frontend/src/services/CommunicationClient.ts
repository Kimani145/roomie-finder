import { fetchWithAuth } from './apiClient'
import { logger } from '@/utils/logger'

export interface CommunicationPayload {
  type: string
  to: string
  payload: Record<string, any>
}

export class CommunicationError extends Error {
  constructor(message: string, public readonly originalError?: Error) {
    super(message)
    this.name = 'CommunicationError'
  }
}

export const CommunicationClient = {
  /**
   * Dispatch a communication with exponential backoff retry, timeout, and correlation ID.
   */
  async send(payload: CommunicationPayload): Promise<{ success: boolean; message: string }> {
    const maxRetries = 2
    const timeoutMs = 8000
    const correlationId = crypto.randomUUID()

    let attempt = 0
    let lastError: Error | null = null

    while (attempt <= maxRetries) {
      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), timeoutMs)

      try {
        if (!navigator.onLine) {
          throw new Error('No internet connection')
        }

        logger.info(`[CommunicationClient] Dispatching ${payload.type} (attempt ${attempt + 1}, correlation: ${correlationId})`)

        const response = await fetchWithAuth('/communications/send', {
          method: 'POST',
          body: JSON.stringify(payload),
          signal: controller.signal,
          headers: {
            'X-Correlation-ID': correlationId,
          }
        })
        
        clearTimeout(timeoutId)
        return response as { success: boolean; message: string }
        
      } catch (error: any) {
        clearTimeout(timeoutId)
        lastError = error
        
        const isAbort = error.name === 'AbortError'
        const isNetworkOrTimeout = isAbort || error.message === 'No internet connection' || error.message.includes('fetch')
        
        // Don't retry validation or auth errors (e.g. 400, 401, 403, which apiClient throws as normal Errors but not AbortErrors)
        // If it's not a network/timeout error, we break and throw immediately.
        if (!isNetworkOrTimeout) {
          logger.error(`[CommunicationClient] Non-retriable error: ${error.message} (correlation: ${correlationId})`)
          break
        }

        logger.warn(`[CommunicationClient] Attempt ${attempt + 1} failed: ${error.message} (correlation: ${correlationId})`)
        
        if (attempt < maxRetries) {
          // Exponential backoff: 1s, then 2s
          const backoffDelay = Math.pow(2, attempt) * 1000
          await new Promise(resolve => setTimeout(resolve, backoffDelay))
        }
        
        attempt++
      }
    }

    // Map errors to friendly user-facing messages
    let friendlyMessage = 'We could not complete your request. Please try again.'
    
    if (lastError) {
      if (lastError.name === 'AbortError') {
        friendlyMessage = 'The request took too long. Please check your connection and try again.'
      } else if (lastError.message === 'No internet connection') {
        friendlyMessage = 'You appear to be offline. Please check your internet connection.'
      } else if (lastError.message.includes('fetch')) {
        friendlyMessage = 'A network issue occurred. Please check your connection and try again.'
      } else {
        friendlyMessage = lastError.message // Validation errors returned from backend
      }
    }

    throw new CommunicationError(friendlyMessage, lastError || undefined)
  }
}
