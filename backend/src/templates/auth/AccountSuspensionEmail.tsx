import React from 'react'
import { AuthenticationLayout } from '../layout/AuthenticationLayout'
import { Button } from '../partials/Button'

interface AccountSuspensionEmailProps {
  firstName?: string
  suspensionReason: string
  suspensionDate: string
  appealUrl: string
  supportEmail?: string
  year?: number
}

export const AccountSuspensionEmail: React.FC<AccountSuspensionEmailProps> = ({
  firstName,
  suspensionReason,
  suspensionDate,
  appealUrl,
  supportEmail,
  year,
}) => {
  const greeting = firstName ? `Hello ${firstName},` : 'Hello,'
  return (
    <AuthenticationLayout
      showWarning={true}
      warningMessage="This account is currently restricted from accessing Roomie Finder features."
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
        Notice of Account Suspension
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
        Following an administrative review of reports associated with your profile, we have suspended your Roomie Finder account for violating our community guidelines.
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
        <div style={{ fontWeight: 700, color: '#94A3B8', marginBottom: '8px' }}>Suspension Record:</div>
        <div><strong>Reason:</strong> {suspensionReason}</div>
        <div><strong>Effective Date:</strong> {suspensionDate}</div>
      </div>

      <p
        style={{
          fontSize: '15px',
          lineHeight: '24px',
          color: '#94A3B8',
          margin: '0 0 20px 0',
          fontFamily: "Inter, system-ui, -apple-system, sans-serif",
        }}
      >
        We are committed to accountability and fairness. If you believe this decision was made in error or would like to submit additional context, you may submit a formal appeal by clicking the button below.
      </p>

      <div style={{ margin: '24px 0', textAlign: 'center' }}>
        <Button url={appealUrl} label="Submit an Appeal" />
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
        For further questions or support requests, please contact our Trust & Safety department at {supportEmail || 'support@students.tukenya.ac.ke'}.
      </p>
    </AuthenticationLayout>
  )
}
