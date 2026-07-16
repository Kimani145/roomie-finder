import React from 'react'
import { AuthenticationLayout } from '../layout/AuthenticationLayout'

interface PasswordResetEmailProps {
  firstName?: string
  otp?: string
  actionUrl?: string
  expiresIn?: string
  supportEmail?: string
  year?: number
}

export const PasswordResetEmail: React.FC<PasswordResetEmailProps> = ({
  firstName,
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
      actionButtonLabel={actionUrl ? 'Reset Password' : undefined}
      actionButtonUrl={actionUrl}
      showWarning={true}
      warningMessage="If you did not request a password reset, you can safely ignore this email. Your password will remain unchanged."
      supportEmail={supportEmail}
      year={year}
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
        Password Reset Request
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
        We received a request to reset the password for your Roomie Finder account. Please use the verification code or click the button below to secure your account and set a new password. This reset request is valid for <strong>{expiresIn}</strong>.
      </p>
    </AuthenticationLayout>
  )
}
