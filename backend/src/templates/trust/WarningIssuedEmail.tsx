import React from 'react'
import { AuthenticationLayout } from '../layout/AuthenticationLayout'
import { InfoCard } from '../partials/InfoCard'
import { StatusBadge } from '../partials/StatusBadge'
import { Metadata } from '../partials/Metadata'

interface WarningIssuedEmailProps {
  firstName?: string
  reason?: string // Warning Reason
  reviewDate?: string // Date
  requestId?: string // Request ID
  dashboardUrl?: string // Return to Dashboard
  appealUrl?: string // View guidelines URL (can use appealUrl or guidelinesUrl)
  supportEmail?: string
  year?: number
}

export const WarningIssuedEmail: React.FC<WarningIssuedEmailProps> = ({
  firstName,
  reason = 'Inappropriate behavior or violation of roommate posting standards.',
  reviewDate,
  requestId,
  dashboardUrl = 'https://roomie-finder.tukenya.ac.ke/discover',
  appealUrl = 'https://roomie-finder.tukenya.ac.ke/guidelines',
  supportEmail,
  year,
}) => {
  const greeting = firstName ? `Hello ${firstName},` : 'Hello,'

  const fields = [
    requestId && { label: 'Reference ID', value: requestId },
    reviewDate && { label: 'Issue Date', value: reviewDate },
    { 
      label: 'Severity Status', 
      value: (
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <StatusBadge status="Warning" />
        </div>
      ) 
    },
    { label: 'Warning Reason', value: reason },
  ].filter(Boolean) as { label: string; value: React.ReactNode }[]

  return (
    <AuthenticationLayout
      actionButtonLabel="View Community Guidelines"
      actionButtonUrl={appealUrl}
      supportEmail={supportEmail}
      year={year}
    >
      <h2
        style={{
          fontSize: '20px',
          fontWeight: 700,
          color: '#F97316',
          margin: '0 0 16px 0',
          fontFamily: "Inter, system-ui, -apple-system, sans-serif",
        }}
      >
        Account Warning Notification
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
        This email is to notify you that an official warning has been issued on your Roomie Finder account. 
        Our administration reviewed activity associated with your profile and determined it violates our community guidelines. 
        This warning has been recorded on your safety ledger. Future violations may result in account suspension or permanent termination.
      </p>

      <InfoCard title="Warning Details" fields={fields} />

      <div style={{ textAlign: 'center', margin: '24px 0 12px 0' }}>
        <a
          href={dashboardUrl}
          style={{
            fontSize: '14px',
            color: '#64748B',
            textDecoration: 'underline',
            fontWeight: 600,
            fontFamily: "Inter, system-ui, -apple-system, sans-serif",
          }}
        >
          Return to Dashboard
        </a>
      </div>

      <Metadata requestId={requestId} timestamp={reviewDate} />
    </AuthenticationLayout>
  )
}

export default WarningIssuedEmail
