import React from 'react'
import { AuthenticationLayout } from '../layout/AuthenticationLayout'
import { InfoCard } from '../partials/InfoCard'
import { StatusBadge } from '../partials/StatusBadge'
import { Metadata } from '../partials/Metadata'

interface AccountSuspendedEmailProps {
  firstName?: string
  reason?: string // Suspension Reason
  suspensionDate?: string // Date
  appealId?: string // Appeal ID (if generated)
  appealUrl?: string // Submit Appeal CTA url
  supportEmail?: string
  year?: number
}

export const AccountSuspendedEmail: React.FC<AccountSuspendedEmailProps> = ({
  firstName,
  reason = 'Violation of community safety and roommate integrity guidelines.',
  suspensionDate,
  appealId,
  appealUrl = 'https://roomie-finder.tukenya.ac.ke/appeal',
  supportEmail = 'support@students.tukenya.ac.ke',
  year,
}) => {
  const greeting = firstName ? `Hello ${firstName},` : 'Hello,'

  const fields = [
    appealId && { label: 'Appeal Code', value: appealId },
    suspensionDate && { label: 'Effective Date', value: suspensionDate },
    { 
      label: 'Account Status', 
      value: (
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <StatusBadge status="Suspended" />
        </div>
      ) 
    },
    { label: 'Reason', value: reason },
    { label: 'Appeal Window', value: '14 Days from notice' },
  ].filter(Boolean) as { label: string; value: React.ReactNode }[]

  return (
    <AuthenticationLayout
      actionButtonLabel="Submit Appeal"
      actionButtonUrl={appealUrl}
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
        Your Account Has Been Suspended
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
        This notification is to inform you that following a thorough administrative review of report records related to your account activities, 
        your Roomie Finder profile has been suspended. This action was taken after human investigation confirmed behaviors that violate our safety policies.
      </p>

      <InfoCard title="Suspension Details" fields={fields} />

      <p
        style={{
          fontSize: '14px',
          lineHeight: '22px',
          color: '#94A3B8',
          margin: '20px 0',
          fontFamily: "Inter, system-ui, -apple-system, sans-serif",
        }}
      >
        We value fairness and accountability. If you believe this action was taken in error or want to provide additional context, 
        you are entitled to file a formal appeal. Please submit your appeal details within the designated window.
      </p>

      <div style={{ textAlign: 'center', margin: '24px 0 12px 0' }}>
        <span style={{ fontSize: '13px', color: '#64748B' }}>
          Need assistance?{' '}
          <a
            href={`mailto:${supportEmail}`}
            style={{
              color: '#F43F5E',
              textDecoration: 'none',
              fontWeight: 600,
            }}
          >
            Contact Support
          </a>
        </span>
      </div>

      <Metadata requestId={appealId} timestamp={suspensionDate} />
    </AuthenticationLayout>
  )
}

export default AccountSuspendedEmail
