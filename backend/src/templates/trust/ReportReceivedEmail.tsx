import React from 'react'
import { AuthenticationLayout } from '../layout/AuthenticationLayout'
import { InfoCard } from '../partials/InfoCard'
import { Metadata } from '../partials/Metadata'

interface ReportReceivedEmailProps {
  firstName?: string
  reportId?: string
  submissionTime?: string // mapped from reviewDate or custom
  estimatedReviewDays?: number | string
  dashboardUrl?: string // tracking URL
  supportEmail?: string
  year?: number
}

export const ReportReceivedEmail: React.FC<ReportReceivedEmailProps> = ({
  firstName,
  reportId,
  submissionTime,
  estimatedReviewDays = '3-5',
  dashboardUrl = 'https://roomie-finder.tukenya.ac.ke/discover',
  supportEmail,
  year,
}) => {
  const greeting = firstName ? `Hello ${firstName},` : 'Hello,'
  const reviewTimeMessage = `Within ${estimatedReviewDays} business days`

  const fields = [
    reportId && { label: 'Report ID', value: reportId },
    submissionTime && { label: 'Submitted On', value: submissionTime },
    { label: 'Expected Review', value: reviewTimeMessage },
    { label: 'Status', value: 'Pending Review' },
  ].filter(Boolean) as { label: string; value: string }[]

  return (
    <AuthenticationLayout
      actionButtonLabel="View Report Status"
      actionButtonUrl={dashboardUrl}
      supportEmail={supportEmail}
      year={year}
    >
      <h2
        style={{
          fontSize: '20px',
          fontWeight: 700,
          color: '#F59E0B',
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
          margin: '0 0 20px 0',
          fontFamily: "Inter, system-ui, -apple-system, sans-serif",
        }}
      >
        Thank you for helping keep Roomie Finder safe. We have successfully received your report. 
        Please note that every report undergoes human administrative review by our Trust &amp; Safety team. 
        Submitting a report does not automatically suspend another user's account; we investigate all claims to ensure fairness.
      </p>

      <InfoCard title="Report Summary" fields={fields} />

      <p
        style={{
          fontSize: '13px',
          lineHeight: '20px',
          color: '#64748B',
          margin: '0 0 20px 0',
          fontFamily: "Inter, system-ui, -apple-system, sans-serif",
        }}
      >
        Our moderation team will review the submitted details. You will be notified via email once our investigation has concluded.
      </p>

      <Metadata requestId={reportId} timestamp={submissionTime} />
    </AuthenticationLayout>
  )
}

export default ReportReceivedEmail
