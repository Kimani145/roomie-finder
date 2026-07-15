import React from 'react'
import { AuthenticationLayout } from '../layout/AuthenticationLayout'
import { InfoCard } from '../partials/InfoCard'
import { StatusBadge } from '../partials/StatusBadge'
import { Metadata } from '../partials/Metadata'

interface AccountReinstatedEmailProps {
  firstName?: string
  reviewDate?: string // Reinstatement Date
  requestId?: string
  dashboardUrl?: string
  supportEmail?: string
  year?: number
}

export const AccountReinstatedEmail: React.FC<AccountReinstatedEmailProps> = ({
  firstName,
  reviewDate,
  requestId,
  dashboardUrl = 'https://roomie-finder.tukenya.ac.ke/discover',
  supportEmail,
  year,
}) => {
  const greeting = firstName ? `Hello ${firstName},` : 'Hello,'

  const fields = [
    requestId && { label: 'Reinstatement Code', value: requestId },
    reviewDate && { label: 'Restoration Date', value: reviewDate },
    { 
      label: 'Profile Status', 
      value: (
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <StatusBadge status="Reinstated" />
        </div>
      ) 
    },
  ].filter(Boolean) as { label: string; value: React.ReactNode }[]

  return (
    <AuthenticationLayout
      actionButtonLabel="Continue to Dashboard"
      actionButtonUrl={dashboardUrl}
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
        Welcome Back to Roomie Finder
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
        We are pleased to inform you that your Roomie Finder account has been fully reinstated. 
        Your suspension has been lifted, and all platform features, including room matching and messaging, are once again active.
      </p>

      <InfoCard title="Reinstatement Info" fields={fields} />

      <p
        style={{
          fontSize: '14px',
          lineHeight: '22px',
          color: '#94A3B8',
          margin: '20px 0 0 0',
          fontFamily: "Inter, system-ui, -apple-system, sans-serif",
        }}
      >
        We appreciate your cooperation during the administrative review process. 
        As a reminder, all students are expected to comply with our community guidelines to maintain a respectful and safe matching environment.
      </p>

      <Metadata requestId={requestId} timestamp={reviewDate} />
    </AuthenticationLayout>
  )
}

export default AccountReinstatedEmail
