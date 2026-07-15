import React from 'react'
import { AuthenticationLayout } from '../layout/AuthenticationLayout'

interface SecurityAlertEmailProps {
  firstName?: string
  alertMessage: string
  browser?: string
  device?: string
  ipAddress?: string
  location?: string
  requestId?: string
  supportEmail?: string
  year?: number
}

export const SecurityAlertEmail: React.FC<SecurityAlertEmailProps> = ({
  firstName,
  alertMessage,
  browser,
  device,
  ipAddress,
  location,
  requestId,
  supportEmail,
  year,
}) => {
  const greeting = firstName ? `Hello ${firstName},` : 'Hello,'
  return (
    <AuthenticationLayout
      showWarning={true}
      warningMessage="If you did not initiate this action, someone may have compromised your account. Please log in, reset your password, and secure your credentials immediately."
      supportEmail={supportEmail}
      year={year}
    >
      <h2
        style={{
          fontSize: '20px',
          fontWeight: 700,
          color: '#EF4444',
          margin: '0 0 16px 0',
          fontFamily: "Inter, system-ui, -apple-system, sans-serif",
        }}
      >
        Security Alert
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
        {alertMessage}
      </p>

      {(browser || device || ipAddress || location || requestId) && (
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
          <div style={{ fontWeight: 700, color: '#94A3B8', marginBottom: '8px' }}>Details:</div>
          {browser && <div><strong>Browser:</strong> {browser}</div>}
          {device && <div><strong>Device:</strong> {device}</div>}
          {ipAddress && <div><strong>IP Address:</strong> {ipAddress}</div>}
          {location && <div><strong>Location:</strong> {location}</div>}
          {requestId && <div><strong>Request ID:</strong> {requestId}</div>}
          <div><strong>Timestamp:</strong> {new Date().toLocaleString()}</div>
        </div>
      )}
    </AuthenticationLayout>
  )
}
