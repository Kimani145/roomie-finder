import React from 'react'
import { AuthenticationLayout } from '../layout/AuthenticationLayout'

interface AppealReceivedEmailProps {
  firstName?: string
  appealId: string
  submissionTime: string
  expectedReviewTime?: string
  supportEmail?: string
  year?: number
}

export const AppealReceivedEmail: React.FC<AppealReceivedEmailProps> = ({
  firstName,
  appealId,
  submissionTime,
  expectedReviewTime = 'Our Trust & Safety Committee reviews appeals weekly. You can expect a response within 3-5 business days.',
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
          color: '#3B82F6',
          margin: '0 0 16px 0',
          fontFamily: "Inter, system-ui, -apple-system, sans-serif",
        }}
      >
        We've Received Your Appeal
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
        This email confirms that we have successfully received your appeal request. A safety administrator will review your submission and the associated account records.
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
        <div style={{ fontWeight: 700, color: '#94A3B8', marginBottom: '8px' }}>Appeal Records:</div>
        <div><strong>Appeal ID:</strong> <span style={{ fontFamily: 'monospace' }}>{appealId}</span></div>
        <div><strong>Submission Time:</strong> {submissionTime}</div>
        <div><strong>Estimated Review:</strong> {expectedReviewTime}</div>
        <div><strong>Status:</strong> Under Administrative Review</div>
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
        You can check the status of your appeal at any time in the Roomie Finder app on your profile safety dashboard.
      </p>
    </AuthenticationLayout>
  )
}
