import React from 'react'
import { AuthenticationLayout } from '../layout/AuthenticationLayout'
import { InfoCard } from '../partials/InfoCard'
import { StatusBadge } from '../partials/StatusBadge'
import { Metadata } from '../partials/Metadata'

interface AppealDecisionEmailProps {
  firstName?: string
  decision?: 'approved' | 'rejected' | string
  reviewDate?: string
  moderatorMessage?: string // Moderator Notes
  appealId?: string
  dashboardUrl?: string
  supportEmail?: string
  year?: number
}

export const AppealDecisionEmail: React.FC<AppealDecisionEmailProps> = ({
  firstName,
  decision = 'rejected',
  reviewDate,
  moderatorMessage,
  appealId,
  dashboardUrl = 'https://roomie-finder.tukenya.ac.ke/discover',
  supportEmail = 'support@students.tukenya.ac.ke',
  year,
}) => {
  const greeting = firstName ? `Hello ${firstName},` : 'Hello,'
  const isApproved = decision.trim().toLowerCase() === 'approved'

  const titleText = isApproved ? 'Appeal Approved - Account Restored' : 'Appeal Decision - Suspension Upheld'
  const explanation = isApproved
    ? 'We have completed our administrative review of your appeal. Your appeal has been approved and full access to your Roomie Finder account has been restored.'
    : 'We have completed our administrative review of your appeal. Regrettably, your appeal has been rejected, and the suspension remains active in order to protect the safety of our student community.'

  const badgeStatus = isApproved ? 'Approved' : 'Rejected'
  const badgeLabel = isApproved ? 'Approved & Restored' : 'Appeal Rejected'

  const fields = [
    appealId && { label: 'Appeal ID', value: appealId },
    reviewDate && { label: 'Review Date', value: reviewDate },
    { 
      label: 'Decision Outcome', 
      value: (
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <StatusBadge status={badgeStatus} />
          <span style={{ marginLeft: '8px', fontSize: '13px', verticalAlign: 'middle' }}>{badgeLabel}</span>
        </div>
      ) 
    },
    moderatorMessage && { label: 'Moderator Notes', value: moderatorMessage },
  ].filter(Boolean) as { label: string; value: React.ReactNode }[]

  const buttonLabel = isApproved ? 'Return to Roomie Finder' : 'Contact Support'
  const buttonUrl = isApproved ? dashboardUrl : `mailto:${supportEmail}`

  return (
    <AuthenticationLayout
      actionButtonLabel={buttonLabel}
      actionButtonUrl={buttonUrl}
      supportEmail={supportEmail}
      year={year}
    >
      <h2
        style={{
          fontSize: '20px',
          fontWeight: 700,
          color: isApproved ? '#34D399' : '#EF4444',
          margin: '0 0 16px 0',
          fontFamily: "Inter, system-ui, -apple-system, sans-serif",
        }}
      >
        {titleText}
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
        {explanation}
      </p>

      <InfoCard title="Review Decision" fields={fields} />

      {!isApproved && (
        <p
          style={{
            fontSize: '13px',
            lineHeight: '20px',
            color: '#64748B',
            margin: '20px 0 0 0',
            fontFamily: "Inter, system-ui, -apple-system, sans-serif",
          }}
        >
          Decisions made by the Trust &amp; Safety Committee are final. If you have additional policy questions or require documentation regarding this decision, you may contact our support department.
        </p>
      )}

      <Metadata requestId={appealId} timestamp={reviewDate} />
    </AuthenticationLayout>
  )
}

export default AppealDecisionEmail
