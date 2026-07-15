import React from 'react'
import { AuthenticationLayout } from '../layout/AuthenticationLayout'

interface ReportReceivedEmailProps {
  firstName?: string
  reportId: string
  submissionTime: string
  expectedReviewProcess?: string
  supportEmail?: string
  year?: number
}

export const ReportReceivedEmail: React.FC<ReportReceivedEmailProps> = ({
  firstName,
  reportId,
  submissionTime,
  expectedReviewProcess = 'Our Trust & Safety team reviews all reports within 24-48 hours. If we require more information, we will contact you directly.',
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
        We've Received Your Report
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
        Thank you for helping keep the Technical University of Kenya (TUK) student community safe. We have successfully received your report and our administrators are reviewing it.
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
        <div style={{ fontWeight: 700, color: '#94A3B8', marginBottom: '8px' }}>Report Details:</div>
        <div><strong>Report ID:</strong> <span style={{ fontFamily: 'monospace' }}>{reportId}</span></div>
        <div><strong>Submission Time:</strong> {submissionTime}</div>
        <div><strong>Review Policy:</strong> {expectedReviewProcess}</div>
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
        Note: To protect user privacy, we do not disclose specific disciplinary outcomes. However, please rest assured that we take all reports seriously and act in accordance with our community guidelines.
      </p>
    </AuthenticationLayout>
  )
}
