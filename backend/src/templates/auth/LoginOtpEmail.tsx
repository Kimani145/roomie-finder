import React from 'react'
import { AuthenticationLayout } from '../layout/AuthenticationLayout'

interface LoginOtpEmailProps {
  firstName?: string
  otp?: string
  browser?: string
  device?: string
  ipAddress?: string
  location?: string
  requestId?: string
  expiresIn?: string
  supportEmail?: string
  year?: number
}

export const LoginOtpEmail: React.FC<LoginOtpEmailProps> = ({
  firstName,
  otp,
  browser,
  device,
  ipAddress,
  location,
  requestId,
  expiresIn = '5 minutes',
  supportEmail,
  year,
}) => {
  const greeting = firstName ? `Hello ${firstName},` : 'Hello,'
  return (
    <AuthenticationLayout
      otp={otp}
      showWarning={true}
      warningMessage="If you did not request this login verification code, someone may have access to your password. We recommend securing your account immediately."
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
        Two-Factor Login Verification
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
        A request was made to log in to your Roomie Finder account. Please use the following 6-digit verification code to complete your sign-in. This code is only valid for <strong>{expiresIn}</strong>.
      </p>
      
      <div
        style={{
          backgroundColor: '#0F172A',
          borderRadius: '12px',
          padding: '16px',
          border: '1px solid #334155',
          fontSize: '13px',
          lineHeight: '20px',
          color: '#64748B',
          fontFamily: "Inter, system-ui, -apple-system, sans-serif",
        }}
      >
        <div style={{ fontWeight: 700, color: '#94A3B8', marginBottom: '8px' }}>Request Details:</div>
        {browser && <div><strong>Browser:</strong> {browser}</div>}
        {device && <div><strong>Device:</strong> {device}</div>}
        {ipAddress && <div><strong>IP Address:</strong> {ipAddress}</div>}
        {location && <div><strong>Location:</strong> {location}</div>}
        {requestId && <div><strong>Request ID:</strong> {requestId}</div>}
        <div><strong>Timestamp:</strong> {new Date().toLocaleString()}</div>
      </div>
    </AuthenticationLayout>
  )
}
