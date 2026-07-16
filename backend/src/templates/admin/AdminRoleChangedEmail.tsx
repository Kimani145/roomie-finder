import React from 'react'
import { AuthenticationLayout } from '../layout/AuthenticationLayout'
import { InfoCard } from '../partials/InfoCard'

interface AdminRoleChangedEmailProps {
  email?: string
  systemRole?: string
  supportEmail?: string
  year?: number
}

export const AdminRoleChangedEmail: React.FC<AdminRoleChangedEmailProps> = ({
  email,
  systemRole = 'Administrator',
  supportEmail = 'security@tukenya.ac.ke',
  year,
}) => {
  const fields = [
    email && { label: 'Account', value: email },
    { label: 'New Role', value: systemRole },
  ].filter(Boolean) as { label: string; value: React.ReactNode }[]

  return (
    <AuthenticationLayout
      supportEmail={supportEmail}
      year={year}
    >
      <h2
        style={{
          fontSize: '20px',
          fontWeight: 700,
          color: '#8B5CF6',
          margin: '0 0 16px 0',
          fontFamily: "Inter, system-ui, -apple-system, sans-serif",
        }}
      >
        Administrator Role Updated
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
        Your privileges on the Roomie Finder platform have been updated by a Super Admin. 
        Your new effective role is listed below. If this change reduces your access, certain dashboard features will no longer be available.
      </p>

      <InfoCard title="Update Details" fields={fields} />
    </AuthenticationLayout>
  )
}

export default AdminRoleChangedEmail
