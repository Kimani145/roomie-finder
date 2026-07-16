import React from 'react'
import { AuthenticationLayout } from '../layout/AuthenticationLayout'

interface VerificationEmailProps {
  firstName?: string
  email?: string
  otp?: string
  actionUrl?: string
  expiresIn?: string
  supportEmail?: string
  year?: number
}

export const VerificationEmail: React.FC<VerificationEmailProps> = ({
  firstName,
  email,
  otp,
  actionUrl,
  expiresIn = '10 minutes',
  supportEmail,
  year,
}) => {
  const greeting = firstName ? `Hello ${firstName},` : 'Hello,'
  return (
    <AuthenticationLayout
      otp={otp}
      actionButtonLabel={actionUrl ? 'Verify Email Address' : undefined}
      actionButtonUrl={actionUrl}
      supportEmail={supportEmail}
      year={year}
      securityNoticeMessage="We require verification of all institutional email addresses to ensure only students from the Technical University of Kenya (TUK) can join the matching community."
    >
      <h2
        style={{
          fontSize: '20px',
          fontWeight: 700,
          color: '#FFFFFF',
          margin: '0 0 16px 0',
          fontFamily: "Inter, system-ui, -apple-system, sans-serif",
        }}
      >
        Welcome to Roomie Finder!
      </h2>
      <p
        style={{
          fontSize: '15px',
          lineHeight: '24px',
          color: '#E2E8F0',
          margin: '0 0 16px 0',
          fontFamily: "Inter, system-ui, -apple-system, sans-serif",
        }}
      >
        {greeting}
      </p>
      <p
        style={{
          fontSize: '15px',
          lineHeight: '24px',
          color: '#94A3B8',
          margin: '0 0 24px 0',
          fontFamily: "Inter, system-ui, -apple-system, sans-serif",
        }}
      >
        Thank you for creating an account on Roomie Finder. To verify ownership of this email address{email ? <span> (<strong>{email}</strong>)</span> : ''}, please use the verification code or click the action button below. This verification request will expire in <strong>{expiresIn}</strong>.
      </p>
    </AuthenticationLayout>
  )
}
