import React from 'react'
import { AuthenticationLayout } from '../layout/AuthenticationLayout'
import { InfoCard } from '../partials/InfoCard'

interface AdminInvitationEmailProps {
  email?: string
  systemRole?: string
  invitationUrl?: string
  supportEmail?: string
  year?: number
}

export const AdminInvitationEmail: React.FC<AdminInvitationEmailProps> = ({
  email,
  systemRole = 'Administrator',
  invitationUrl = 'https://roomie-finder.tukenya.ac.ke/admin/accept-invitation',
  supportEmail = 'security@tukenya.ac.ke',
  year,
}) => {
  const fields = [
    email && { label: 'Invited Account', value: email },
    { label: 'Role Provisioned', value: systemRole },
    { label: 'Expiration', value: '48 Hours' },
  ].filter(Boolean) as { label: string; value: React.ReactNode }[]

  return (
    <AuthenticationLayout
      actionButtonLabel="Accept Invitation"
      actionButtonUrl={invitationUrl}
      supportEmail={supportEmail}
      year={year}
    >
      <h2
        style={{
          fontSize: '20px',
          fontWeight: 700,
          color: '#E2E8F0',
          margin: '0 0 16px 0',
          fontFamily: "Inter, system-ui, -apple-system, sans-serif",
        }}
      >
        Administrator Invitation
      </h2>

      <p
        style={{
          fontSize: '15px',
          lineHeight: '24px',
          color: '#94A3B8',
          margin: '0 0 20px 0',
          fontFamily: "Inter, system-ui, -apple-system, sans-serif",
        }}
      >
        You have been provisioned as an administrative user on the Roomie Finder platform. 
        This is a highly privileged account subject to strict security protocols. 
        Please accept this invitation to activate your access and setup Two-Factor Authentication.
      </p>

      <InfoCard title="Provisioning Details" fields={fields} />
    </AuthenticationLayout>
  )
}

export default AdminInvitationEmail
