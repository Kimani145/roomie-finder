import React from 'react'
import { AuthenticationLayout } from '../layout/AuthenticationLayout'
import { InfoCard } from '../partials/InfoCard'
import { StatusBadge } from '../partials/StatusBadge'
import { Metadata } from '../partials/Metadata'

interface ReportReviewedEmailProps {
  firstName?: string
  reportId?: string
  reviewDate?: string
  actionTaken?: 'Action Taken' | 'No Action Taken' | string
  supportEmail?: string
  dashboardUrl?: string
  year?: number
}

export const ReportReviewedEmail: React.FC<ReportReviewedEmailProps> = ({
  firstName,
  reportId,
  reviewDate,
  actionTaken = 'Action Taken',
  supportEmail,
  dashboardUrl = 'https://roomie-finder.tukenya.ac.ke/notifications',
  year,
}) => {
  const greeting = firstName ? `Hello ${firstName},` : 'Hello,'
  
  const isActionTaken = actionTaken.toLowerCase().includes('action taken') && !actionTaken.toLowerCase().includes('no action')
  const explanation = isActionTaken
    ? 'We reviewed your report and appropriate action has been taken in accordance with our community safety policies.'
    : 'After reviewing the available evidence, the report did not meet the threshold for moderation. No further action is required at this time.'

  const badgeStatus = isActionTaken ? 'Approved' : 'Rejected'
  const displayStatusLabel = isActionTaken ? 'Action Taken' : 'No Action Taken'

  const fields = [
    reportId && { label: 'Report ID', value: reportId },
    reviewDate && { label: 'Review Date', value: reviewDate },
    { 
      label: 'Outcome', 
      value: (
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <StatusBadge status={badgeStatus} />
          <span style={{ marginLeft: '8px', fontSize: '13px', verticalAlign: 'middle' }}>{displayStatusLabel}</span>
        </div>
      ) 
    },
  ].filter(Boolean) as { label: string; value: React.ReactNode }[]

  return (
    <AuthenticationLayout
      actionButtonLabel="View Notifications"
      actionButtonUrl={dashboardUrl}
      supportEmail={supportEmail}
      year={year}
    >
      <h2
        style={{
          fontSize: '20px',
          fontWeight: 700,
          color: '#34D399',
          margin: '0 0 16px 0',
          fontFamily: "Inter, system-ui, -apple-system, sans-serif",
        }}
      >
        Your Report Has Been Reviewed
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

      <InfoCard title="Moderation Summary" fields={fields} />

      <p
        style={{
          fontSize: '13px',
          lineHeight: '20px',
          color: '#64748B',
          margin: '0 0 20px 0',
          fontFamily: "Inter, system-ui, -apple-system, sans-serif",
        }}
      >
        To maintain user confidentiality and security, we do not disclose specific disciplinary details or actions taken against individual profiles. We appreciate your vigilance in keeping our student matching community safe and trustworthy.
      </p>

      <Metadata requestId={reportId} timestamp={reviewDate} />
    </AuthenticationLayout>
  )
}

export default ReportReviewedEmail
