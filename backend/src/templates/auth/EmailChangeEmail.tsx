import React from 'react'
import { AuthenticationLayout } from '../layout/AuthenticationLayout'

interface EmailChangeEmailProps {
  firstName?: string
  newEmail: string
  otp?: string
  expiresIn?: string
  supportEmail?: string
  year?: number
}

export const EmailChangeEmail: React.FC<EmailChangeEmailProps> = ({
  firstName,
  newEmail,
  otp,
  expiresIn = '10 minutes',
  supportEmail,
  year,
}) => {
  const greeting = firstName ? `Hello ${firstName},` : 'Hello,'
  return (
    <AuthenticationLayout
      otp={otp}
      showWarning={true}
      warningMessage="If you did not request this email change, please secure your account credentials immediately."
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
        Email Change Verification
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
        We received a request to change the primary email address of your Roomie Finder account to <strong>{newEmail}</strong>. To complete this request, please enter the verification code below in your account settings. This code is valid for <strong>{expiresIn}</strong>.
      </p>
    </AuthenticationLayout>
  )
}
