import React from 'react'
import { AuthenticationLayout } from '../layout/AuthenticationLayout'

interface ReportActionedEmailProps {
  firstName?: string
  reportId: string
  actionMessage: string
  supportEmail?: string
  year?: number
}

export const ReportActionedEmail: React.FC<ReportActionedEmailProps> = ({
  firstName,
  reportId,
  actionMessage,
  supportEmail,
  year,
}) => {
  const greeting = firstName ? `Hello ${firstName},` : 'Hello,'
  return (
    <AuthenticationLayout
      showSecurityNotice={true}
      supportEmail={supportEmail}
      year={year}
    >
      <h2
        style={{
          fontSize: '20px',
          fontWeight: 700,
          color: '#10B981',
          margin: '0 0 16px 0',
          fontFamily: "Inter, system-ui, -apple-system, sans-serif",
        }}
      >
        Report Review Completed
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
        {actionMessage}
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
          margin: '0 0 24px 0',
          fontFamily: "Inter, system-ui, -apple-system, sans-serif",
        }}
      >
        <div style={{ fontWeight: 700, color: '#94A3B8', marginBottom: '8px' }}>Details:</div>
        <div><strong>Report ID:</strong> <span style={{ fontFamily: 'monospace' }}>{reportId}</span></div>
        <div><strong>Status:</strong> Case Resolved & Closed</div>
      </div>

      <p
        style={{
          fontSize: '13px',
          lineHeight: '20px',
          color: '#475569',
          margin: '0',
          fontFamily: "Inter, system-ui, -apple-system, sans-serif",
        }}
      >
        Your reports help us maintain accountability and security across Roomie Finder. Thank you for your support.
      </p>
    </AuthenticationLayout>
  )
}
