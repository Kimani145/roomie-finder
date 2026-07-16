import React from 'react'
import { AuthenticationLayout } from '../layout/AuthenticationLayout'
import { InfoCard } from '../partials/InfoCard'
import { StatusBadge } from '../partials/StatusBadge'
import { Metadata } from '../partials/Metadata'

interface AppealReceivedEmailProps {
  firstName?: string
  appealId?: string
  submissionTime?: string // Date
  estimatedReviewDays?: number | string
  appealUrl?: string // Track Appeal CTA url
  supportEmail?: string
  year?: number
}

export const AppealReceivedEmail: React.FC<AppealReceivedEmailProps> = ({
  firstName,
  appealId,
  submissionTime,
  estimatedReviewDays = '3-5',
  appealUrl = 'https://roomie-finder.tukenya.ac.ke/appeal-status',
  supportEmail,
  year,
}) => {
  const greeting = firstName ? `Hello ${firstName},` : 'Hello,'
  const reviewTimeMessage = `${estimatedReviewDays} business days`

  const fields = [
    appealId && { label: 'Appeal ID', value: appealId },
    submissionTime && { label: 'Submission Date', value: submissionTime },
    { label: 'Expected Review', value: reviewTimeMessage },
    { 
      label: 'Appeal Status', 
      value: (
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <StatusBadge status="Pending" />
          <span style={{ marginLeft: '8px', fontSize: '13px', verticalAlign: 'middle' }}>Under Review</span>
        </div>
      ) 
    },
  ].filter(Boolean) as { label: string; value: React.ReactNode }[]

  return (
    <AuthenticationLayout
      actionButtonLabel="Track Appeal"
      actionButtonUrl={appealUrl}
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
          margin: '0 0 20px 0',
          fontFamily: "Inter, system-ui, -apple-system, sans-serif",
        }}
      >
        This email confirms that we have successfully received your request to appeal your account suspension. 
        Our Trust &amp; Safety team will review your case file, the original report logs, and any evidence you provided.
      </p>

      <InfoCard title="Appeal Submission" fields={fields} />

      <p
        style={{
          fontSize: '13px',
          lineHeight: '20px',
          color: '#64748B',
          margin: '0 0 20px 0',
          fontFamily: "Inter, system-ui, -apple-system, sans-serif",
        }}
      >
        You can track the progress of your appeal at any time using your safety dashboard inside Roomie Finder. 
        We will send another email notification as soon as a final decision is reached.
      </p>

      <Metadata requestId={appealId} timestamp={submissionTime} />
    </AuthenticationLayout>
  )
}

export default AppealReceivedEmail
