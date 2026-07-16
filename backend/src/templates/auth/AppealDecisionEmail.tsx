import React from 'react'
import { AuthenticationLayout } from '../layout/AuthenticationLayout'
import { Button } from '../partials/Button'

interface AppealDecisionEmailProps {
  firstName?: string
  decision: 'approved' | 'rejected'
  explanation: string
  supportEmail?: string
  year?: number
}

export const AppealDecisionEmail: React.FC<AppealDecisionEmailProps> = ({
  firstName,
  decision,
  explanation,
  supportEmail,
  year,
}) => {
  const greeting = firstName ? `Hello ${firstName},` : 'Hello,'
  const isApproved = decision === 'approved'
  const title = isApproved ? 'Appeal Approved - Account Restored' : 'Appeal Decision'
  const color = isApproved ? '#10B981' : '#EF4444'

  return (
    <AuthenticationLayout
      showWarning={!isApproved}
      warningMessage={!isApproved ? "Your account suspension remains active." : undefined}
      supportEmail={supportEmail}
      year={year}
    >
      <h2
        style={{
          fontSize: '20px',
          fontWeight: 700,
          color: color,
          margin: '0 0 16px 0',
          fontFamily: "Inter, system-ui, -apple-system, sans-serif",
        }}
      >
        {title}
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
          margin: '0 0 20px 0',
          fontFamily: "Inter, system-ui, -apple-system, sans-serif",
        }}
      >
        {isApproved
          ? 'We have completed our review of your appeal submission. We are pleased to inform you that your appeal has been approved and your full access to Roomie Finder has been restored immediately.'
          : 'We have completed our review of your appeal submission. Unfortunately, we are unable to approve your request at this time. Consequently, your account suspension remains active.'}
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
        <div style={{ fontWeight: 700, color: '#94A3B8', marginBottom: '8px' }}>Decision Notes & Explanation:</div>
        <div style={{ color: '#E2E8F0', whiteSpace: 'pre-wrap' }}>{explanation}</div>
      </div>

      {isApproved && (
        <div style={{ margin: '24px 0', textAlign: 'center' }}>
          <Button url="/discover" label="Back to Roomie Finder" />
        </div>
      )}

      <p
        style={{
          fontSize: '13px',
          lineHeight: '20px',
          color: '#475569',
          margin: '0',
          fontFamily: "Inter, system-ui, -apple-system, sans-serif",
        }}
      >
        Please review our community guidelines to ensure future safety and compatibility across our matching network.
      </p>
    </AuthenticationLayout>
  )
}
