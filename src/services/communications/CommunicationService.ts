import { CommunicationDispatcher } from './CommunicationDispatcher'
import type { CommunicationVariables, DispatchResult } from './CommunicationTypes'

/**
 * Centralized Communication Service — the public API for ALL
 * outbound communications in Roomie Finder.
 *
 * No feature should communicate directly with Resend or any email provider.
 * All outbound messages must route through this service.
 *
 * Architecture:
 *   Business Logic → CommunicationService (named methods)
 *                   → CommunicationDispatcher (flag checks, rate limiting, audit)
 *                     → CommunicationFactory (template compilation)
 *                       → resendProvider (delivery)
 *
 * Categories:
 *  - AUTH:   Verification, Login OTP, Password Reset, Email Change, Security Alert
 *  - TRUST:  Report Received/Reviewed, Warning, Suspension, Appeal, Reinstatement
 *  - NOTIFICATION: (Future) General platform notifications
 *  - MARKETING:    (Future) Opt-in promotional communications
 *
 * The dispatch() / enqueue() methods are also exposed for callers that
 * prefer the event-based interface directly.
 */
export const CommunicationService = {
  // ─────────────────────────────────────────────────────────
  //  EVENT-BASED API (dispatch / enqueue)
  // ─────────────────────────────────────────────────────────

  /**
   * Dispatch a communication event immediately.
   * Use this when you want the event-based abstraction directly.
   */
  dispatch: CommunicationDispatcher.dispatch,

  /**
   * Enqueue a communication event for delivery.
   * Currently dispatches immediately; queue-ready interface.
   */
  enqueue: CommunicationDispatcher.enqueue,

  // ─────────────────────────────────────────────────────────
  //  AUTH CATEGORY (Named Methods)
  // ─────────────────────────────────────────────────────────

  /**
   * [AUTH] Send account verification email.
   */
  sendVerification: async (
    to: string,
    otp?: string,
    actionUrl?: string,
    firstName?: string,
    userId?: string
  ): Promise<DispatchResult> => {
    const variables: CommunicationVariables = {
      firstName,
      email: to,
      otp,
      actionUrl,
      expiresIn: '10 minutes',
      requestId: crypto.randomUUID?.() || Math.random().toString(36).substring(2, 15),
      year: new Date().getFullYear(),
      supportEmail: 'support@students.tukenya.ac.ke',
    }

    return CommunicationDispatcher.dispatch(
      { type: 'verification', recipient: to, payload: variables },
      userId
    )
  },

  /**
   * [AUTH] Send login two-factor authentication email.
   */
  sendLogin2fa: async (
    to: string,
    otp: string,
    details?: {
      browser?: string
      device?: string
      ipAddress?: string
      location?: string
      requestId?: string
    },
    firstName?: string,
    userId?: string
  ): Promise<DispatchResult> => {
    const variables: CommunicationVariables = {
      firstName,
      otp,
      expiresIn: '5 minutes',
      browser: details?.browser || 'Unknown Browser',
      device: details?.device || 'Unknown Device',
      ipAddress: details?.ipAddress,
      location: details?.location,
      requestId: details?.requestId || crypto.randomUUID?.() || Math.random().toString(36).substring(2, 15),
      year: new Date().getFullYear(),
      supportEmail: 'support@students.tukenya.ac.ke',
    }

    return CommunicationDispatcher.dispatch(
      { type: 'login_2fa', recipient: to, payload: variables },
      userId
    )
  },

  /**
   * [AUTH] Send password reset email.
   */
  sendPasswordReset: async (
    to: string,
    otp?: string,
    actionUrl?: string,
    firstName?: string,
    userId?: string
  ): Promise<DispatchResult> => {
    const variables: CommunicationVariables = {
      firstName,
      otp,
      actionUrl,
      expiresIn: '10 minutes',
      requestId: crypto.randomUUID?.() || Math.random().toString(36).substring(2, 15),
      year: new Date().getFullYear(),
      supportEmail: 'support@students.tukenya.ac.ke',
    }

    return CommunicationDispatcher.dispatch(
      { type: 'password_reset', recipient: to, payload: variables },
      userId
    )
  },

  /**
   * [AUTH] Send email change confirmation email.
   */
  sendEmailChange: async (
    to: string,
    newEmail: string,
    otp: string,
    firstName?: string,
    userId?: string
  ): Promise<DispatchResult> => {
    const variables: CommunicationVariables = {
      firstName,
      newEmail,
      otp,
      expiresIn: '10 minutes',
      requestId: crypto.randomUUID?.() || Math.random().toString(36).substring(2, 15),
      year: new Date().getFullYear(),
      supportEmail: 'support@students.tukenya.ac.ke',
    }

    return CommunicationDispatcher.dispatch(
      { type: 'email_change', recipient: to, payload: variables },
      userId
    )
  },

  /**
   * [AUTH] Send a security alert email.
   */
  sendSecurityAlert: async (
    to: string,
    alertMessage: string,
    details?: {
      browser?: string
      device?: string
      ipAddress?: string
      location?: string
      requestId?: string
    },
    firstName?: string,
    userId?: string
  ): Promise<DispatchResult> => {
    const variables: CommunicationVariables = {
      firstName,
      alertMessage,
      browser: details?.browser || 'Unknown Browser',
      device: details?.device || 'Unknown Device',
      ipAddress: details?.ipAddress,
      location: details?.location,
      requestId: details?.requestId || crypto.randomUUID?.() || Math.random().toString(36).substring(2, 15),
      year: new Date().getFullYear(),
      supportEmail: 'support@students.tukenya.ac.ke',
    }

    return CommunicationDispatcher.dispatch(
      { type: 'security_alert', recipient: to, payload: variables },
      userId
    )
  },

  // ─────────────────────────────────────────────────────────
  //  TRUST & SAFETY CATEGORY
  // ─────────────────────────────────────────────────────────

  /**
   * [TRUST] Send Report Received confirmation email.
   */
  sendReportReceived: async (
    to: string,
    reportId: string,
    submissionTime: string,
    firstName?: string,
    estimatedReviewDays?: number | string,
    dashboardUrl?: string,
    userId?: string
  ): Promise<DispatchResult> => {
    const variables: CommunicationVariables = {
      firstName,
      reportId,
      reviewDate: submissionTime,
      estimatedReviewDays: estimatedReviewDays || '3-5',
      dashboardUrl,
      year: new Date().getFullYear(),
      supportEmail: 'support@students.tukenya.ac.ke',
    }

    return CommunicationDispatcher.dispatch(
      { type: 'report_received', recipient: to, payload: variables },
      userId
    )
  },

  /**
   * [TRUST] Send Report Reviewed status email.
   */
  sendReportReviewed: async (
    to: string,
    reportId: string,
    reviewDate: string,
    actionTaken: string,
    firstName?: string,
    dashboardUrl?: string
  ): Promise<DispatchResult> => {
    const variables: CommunicationVariables = {
      firstName,
      reportId,
      reviewDate,
      actionTaken,
      dashboardUrl,
      year: new Date().getFullYear(),
      supportEmail: 'support@students.tukenya.ac.ke',
    }

    return CommunicationDispatcher.dispatch(
      { type: 'report_reviewed', recipient: to, payload: variables }
    )
  },

  /**
   * [TRUST] Send Warning Issued notice email.
   */
  sendWarningIssued: async (
    to: string,
    reason: string,
    reviewDate: string,
    requestId: string,
    firstName?: string,
    dashboardUrl?: string,
    appealUrl?: string
  ): Promise<DispatchResult> => {
    const variables: CommunicationVariables = {
      firstName,
      reason,
      reviewDate,
      requestId,
      dashboardUrl,
      appealUrl,
      year: new Date().getFullYear(),
      supportEmail: 'support@students.tukenya.ac.ke',
    }

    return CommunicationDispatcher.dispatch(
      { type: 'warning_issued', recipient: to, payload: variables }
    )
  },

  /**
   * [TRUST] Send Account Suspension notice email.
   */
  sendAccountSuspended: async (
    to: string,
    reason: string,
    suspensionDate: string,
    appealId: string,
    appealUrl: string,
    firstName?: string
  ): Promise<DispatchResult> => {
    const variables: CommunicationVariables = {
      firstName,
      reason,
      suspensionDate,
      appealId,
      appealUrl,
      year: new Date().getFullYear(),
      supportEmail: 'support@students.tukenya.ac.ke',
    }

    return CommunicationDispatcher.dispatch(
      { type: 'account_suspended', recipient: to, payload: variables }
    )
  },

  /**
   * [TRUST] Send Appeal Received confirmation email.
   */
  sendAppealReceived: async (
    to: string,
    appealId: string,
    submissionTime: string,
    firstName?: string,
    estimatedReviewDays?: number | string,
    appealUrl?: string
  ): Promise<DispatchResult> => {
    const variables: CommunicationVariables = {
      firstName,
      appealId,
      reviewDate: submissionTime,
      estimatedReviewDays: estimatedReviewDays || '3-5',
      appealUrl,
      year: new Date().getFullYear(),
      supportEmail: 'support@students.tukenya.ac.ke',
    }

    return CommunicationDispatcher.dispatch(
      { type: 'appeal_received', recipient: to, payload: variables }
    )
  },

  /**
   * [TRUST] Send Appeal Decision notification email.
   */
  sendAppealDecision: async (
    to: string,
    decision: 'approved' | 'rejected' | string,
    explanation: string,
    firstName?: string,
    appealId?: string,
    dashboardUrl?: string
  ): Promise<DispatchResult> => {
    const variables: CommunicationVariables = {
      firstName,
      decision,
      moderatorMessage: explanation,
      appealId,
      dashboardUrl,
      year: new Date().getFullYear(),
      supportEmail: 'support@students.tukenya.ac.ke',
    }

    return CommunicationDispatcher.dispatch(
      { type: 'appeal_decision', recipient: to, payload: variables }
    )
  },

  /**
   * [TRUST] Send Account Reinstated notification email.
   */
  sendAccountReinstated: async (
    to: string,
    reviewDate: string,
    requestId: string,
    firstName?: string,
    dashboardUrl?: string
  ): Promise<DispatchResult> => {
    const variables: CommunicationVariables = {
      firstName,
      reviewDate,
      requestId,
      dashboardUrl,
      year: new Date().getFullYear(),
      supportEmail: 'support@students.tukenya.ac.ke',
    }

    return CommunicationDispatcher.dispatch(
      { type: 'account_reinstated', recipient: to, payload: variables }
    )
  },
}
