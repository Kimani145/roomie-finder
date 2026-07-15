import React from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { CommunicationType, CommunicationVariables } from './CommunicationTypes'

// Auth Templates
import { VerificationEmail } from '../../templates/auth/VerificationEmail'
import { LoginOtpEmail } from '../../templates/auth/LoginOtpEmail'
import { PasswordResetEmail } from '../../templates/auth/PasswordResetEmail'
import { EmailChangeEmail } from '../../templates/auth/EmailChangeEmail'
import { SecurityAlertEmail } from '../../templates/auth/SecurityAlertEmail'

// Trust & Safety Templates
import { ReportReceivedEmail } from '../../templates/trust/ReportReceivedEmail'
import { ReportReviewedEmail } from '../../templates/trust/ReportReviewedEmail'
import { WarningIssuedEmail } from '../../templates/trust/WarningIssuedEmail'
import { AccountSuspendedEmail } from '../../templates/trust/AccountSuspendedEmail'
import { AppealReceivedEmail } from '../../templates/trust/AppealReceivedEmail'
import { AppealDecisionEmail } from '../../templates/trust/AppealDecisionEmail'
import { AccountReinstatedEmail } from '../../templates/trust/AccountReinstatedEmail'

export const CommunicationFactory = {
  compile: (type: CommunicationType, vars: CommunicationVariables): { subject: string; html: string } => {
    let element: React.ReactElement
    let subject = ''

    switch (type) {
      case 'verification':
        subject = 'Welcome to Roomie Finder - Verify Your Email'
        element = (
          <VerificationEmail
            firstName={vars.firstName}
            email={vars.email}
            otp={vars.otp}
            actionUrl={vars.actionUrl}
            expiresIn={vars.expiresIn}
            supportEmail={vars.supportEmail}
            year={vars.year}
          />
        )
        break

      case 'login_2fa':
        subject = 'Roomie Finder Security Verification Code'
        element = (
          <LoginOtpEmail
            firstName={vars.firstName}
            otp={vars.otp}
            browser={vars.browser}
            device={vars.device}
            ipAddress={vars.ipAddress}
            location={vars.location}
            requestId={vars.requestId}
            expiresIn={vars.expiresIn}
            supportEmail={vars.supportEmail}
            year={vars.year}
          />
        )
        break

      case 'password_reset':
        subject = 'Roomie Finder Password Reset Request'
        element = (
          <PasswordResetEmail
            firstName={vars.firstName}
            otp={vars.otp}
            actionUrl={vars.actionUrl}
            expiresIn={vars.expiresIn}
            supportEmail={vars.supportEmail}
            year={vars.year}
          />
        )
        break

      case 'email_change':
        subject = 'Roomie Finder Email Change Verification'
        element = (
          <EmailChangeEmail
            firstName={vars.firstName}
            newEmail={vars.newEmail || ''}
            otp={vars.otp}
            expiresIn={vars.expiresIn}
            supportEmail={vars.supportEmail}
            year={vars.year}
          />
        )
        break

      case 'security_alert':
        subject = 'Roomie Finder Security Alert'
        element = (
          <SecurityAlertEmail
            firstName={vars.firstName}
            alertMessage={vars.alertMessage || ''}
            browser={vars.browser}
            device={vars.device}
            ipAddress={vars.ipAddress}
            location={vars.location}
            requestId={vars.requestId}
            supportEmail={vars.supportEmail}
            year={vars.year}
          />
        )
        break

      case 'report_received':
        subject = "We've received your report"
        element = (
          <ReportReceivedEmail
            firstName={vars.firstName}
            reportId={vars.reportId}
            submissionTime={vars.reviewDate || new Date().toLocaleString()} // fallback
            estimatedReviewDays={vars.estimatedReviewDays}
            dashboardUrl={vars.dashboardUrl}
            supportEmail={vars.supportEmail}
            year={vars.year}
          />
        )
        break

      case 'report_reviewed':
        subject = 'Your report has been reviewed'
        element = (
          <ReportReviewedEmail
            firstName={vars.firstName}
            reportId={vars.reportId}
            reviewDate={vars.reviewDate || new Date().toLocaleString()}
            actionTaken={vars.actionTaken}
            supportEmail={vars.supportEmail}
            dashboardUrl={vars.dashboardUrl}
            year={vars.year}
          />
        )
        break

      case 'warning_issued':
        subject = 'A warning has been issued on your account'
        element = (
          <WarningIssuedEmail
            firstName={vars.firstName}
            reason={vars.reason}
            reviewDate={vars.reviewDate || new Date().toLocaleDateString()}
            requestId={vars.requestId}
            dashboardUrl={vars.dashboardUrl}
            appealUrl={vars.appealUrl} // view community guidelines
            supportEmail={vars.supportEmail}
            year={vars.year}
          />
        )
        break

      case 'account_suspended':
        subject = 'Your account has been suspended'
        element = (
          <AccountSuspendedEmail
            firstName={vars.firstName}
            reason={vars.reason}
            suspensionDate={vars.suspensionDate || new Date().toLocaleDateString()}
            appealId={vars.appealId}
            appealUrl={vars.appealUrl}
            supportEmail={vars.supportEmail}
            year={vars.year}
          />
        )
        break

      case 'appeal_received':
        subject = "We've received your appeal"
        element = (
          <AppealReceivedEmail
            firstName={vars.firstName}
            appealId={vars.appealId}
            submissionTime={vars.reviewDate || new Date().toLocaleString()}
            estimatedReviewDays={vars.estimatedReviewDays}
            appealUrl={vars.appealUrl}
            supportEmail={vars.supportEmail}
            year={vars.year}
          />
        )
        break

      case 'appeal_decision':
        subject = 'Your appeal has been reviewed'
        element = (
          <AppealDecisionEmail
            firstName={vars.firstName}
            decision={vars.decision || 'rejected'}
            reviewDate={vars.reviewDate || new Date().toLocaleString()}
            moderatorMessage={vars.moderatorMessage}
            appealId={vars.appealId}
            dashboardUrl={vars.dashboardUrl}
            supportEmail={vars.supportEmail}
            year={vars.year}
          />
        )
        break

      case 'account_reinstated':
        subject = 'Welcome back to Roomie Finder'
        element = (
          <AccountReinstatedEmail
            firstName={vars.firstName}
            reviewDate={vars.reviewDate || new Date().toLocaleDateString()}
            requestId={vars.requestId}
            dashboardUrl={vars.dashboardUrl}
            supportEmail={vars.supportEmail}
            year={vars.year}
          />
        )
        break

      default:
        throw new Error(`Unsupported communication type: ${type}`)
    }

    const html = `<!DOCTYPE html>${renderToStaticMarkup(element)}`
    return { subject, html }
  },
}
