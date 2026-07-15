import { Timestamp } from 'firebase/firestore'

/**
 * Communication Categories — groups email types by purpose.
 *
 * auth          — Account verification, login OTPs, password resets, email changes, security alerts
 * trust         — Reports, warnings, suspensions, appeals, reinstatements
 * notification  — Future: general platform notifications
 * marketing     — Future: opt-in promotional communications
 */
export type CommunicationCategory = 'auth' | 'trust' | 'notification' | 'marketing'

export type CommunicationType =
  | 'verification'
  | 'login_2fa'
  | 'password_reset'
  | 'email_change'
  | 'security_alert'
  | 'report_received'
  | 'report_reviewed'
  | 'warning_issued'
  | 'account_suspended'
  | 'appeal_received'
  | 'appeal_decision'
  | 'account_reinstated'

/**
 * Maps each communication type to its category.
 */
export const COMMUNICATION_CATEGORIES: Record<CommunicationType, CommunicationCategory> = {
  verification: 'auth',
  login_2fa: 'auth',
  password_reset: 'auth',
  email_change: 'auth',
  security_alert: 'auth',
  report_received: 'trust',
  report_reviewed: 'trust',
  warning_issued: 'trust',
  account_suspended: 'trust',
  appeal_received: 'trust',
  appeal_decision: 'trust',
  account_reinstated: 'trust',
}

export interface CommunicationVariables {
  firstName?: string
  email?: string
  otp?: string
  requestId?: string
  expiresIn?: string
  device?: string
  browser?: string
  ipAddress?: string
  location?: string
  actionButton?: string
  actionUrl?: string
  supportEmail?: string
  year?: number

  // Trust & Safety variables
  reportId?: string
  appealId?: string
  reason?: string
  actionTaken?: string
  reviewDate?: string
  suspensionDate?: string
  estimatedReviewDays?: number | string
  moderatorMessage?: string
  appealUrl?: string
  dashboardUrl?: string
  
  [key: string]: any // allow flexibility
}

export interface CommunicationPayload {
  to: string
  type: CommunicationType
  subject: string
  variables: CommunicationVariables
}

// ─── Communication Audit Log ─────────────────────────────────────────────────
// Formalized audit model for diagnostics and compliance.
//
// SECURITY: This log NEVER stores:
//   - OTP values
//   - Passwords
//   - Tokens (JWT, refresh, session, verification, reset)
//   - API keys or secrets
// ─────────────────────────────────────────────────────────────────────────────

export interface CommunicationLog {
  /** Firestore document ID (auto-generated) */
  id?: string

  /** Communication type identifier */
  type: CommunicationType

  /** Category grouping (auth, trust, notification, marketing) */
  category: CommunicationCategory

  /** Recipient email address */
  recipient: string

  /** Delivery provider used */
  provider: 'resend' | 'simulation' | 'disabled'

  /** Provider-assigned message ID for delivery tracking */
  providerMessageId?: string

  /** Delivery status */
  status: 'sent' | 'failed' | 'rate_limited' | 'feature_disabled'

  /** Timestamp of creation */
  createdAt: Timestamp | string

  /** Timestamp of confirmed delivery (future: webhook callback) */
  deliveredAt?: Timestamp | string

  /** Human-readable failure reason (never raw error objects) */
  failedReason?: string

  /** Correlation IDs for tracing */
  requestId?: string
  reportId?: string
  appealId?: string
}

// ─── Communication Event (Dispatch Layer) ────────────────────────────────────

/**
 * Event-based communication payload for the dispatch layer.
 * Business logic creates events; the dispatcher handles routing,
 * rate limiting, and delivery.
 */
export interface CommunicationEvent {
  type: CommunicationType
  recipient: string
  payload: CommunicationVariables
}

/**
 * Result returned from dispatch/enqueue operations.
 */
export interface DispatchResult {
  success: boolean
  id?: string
  error?: string
  /** True when the communication was skipped due to a feature flag being disabled */
  skipped?: boolean
  /** True when the communication was rejected by rate limiting */
  rateLimited?: boolean
  /** Milliseconds until the rate limit window resets */
  retryAfterMs?: number
}

// ─── Provider Interface ──────────────────────────────────────────────────────

export interface CommunicationProvider {
  send(payload: CommunicationPayload, htmlContent: string): Promise<{ success: boolean; id?: string; error?: string }>
}
