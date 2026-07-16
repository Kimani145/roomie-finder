import React from 'react'
import { AuthenticationLayout } from '../layout/AuthenticationLayout'
import { StatusBadge } from '../partials/StatusBadge'

interface AdminDisabledEmailProps {
  email?: string
  supportEmail?: string
  year?: number
}

export const AdminDisabledEmail: React.FC<AdminDisabledEmailProps> = ({
  email,
  supportEmail = 'security@tukenya.ac.ke',
  year,
}) => {
  return (
    <AuthenticationLayout
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
        Administrator Access Revoked
      </h2>

      <div style={{ marginBottom: '16px' }}>
        <StatusBadge status="Disabled" />
      </div>

      <p
        style={{
          fontSize: '15px',
          lineHeight: '24px',
          color: '#94A3B8',
          margin: '0 0 20px 0',
          fontFamily: "Inter, system-ui, -apple-system, sans-serif",
        }}
      >
        Your administrator access to the Roomie Finder platform has been disabled by a Super Admin. 
        You can no longer access the administrative dashboard.
      </p>
    </AuthenticationLayout>
  )
}

export default AdminDisabledEmail
