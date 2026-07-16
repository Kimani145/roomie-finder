import React from 'react'
import { AuthenticationLayout } from '../layout/AuthenticationLayout'
import { StatusBadge } from '../partials/StatusBadge'

interface AdminActivatedEmailProps {
  email?: string
  dashboardUrl?: string
  supportEmail?: string
  year?: number
}

export const AdminActivatedEmail: React.FC<AdminActivatedEmailProps> = ({
  email,
  dashboardUrl = 'https://roomie-finder.tukenya.ac.ke/admin',
  supportEmail = 'security@tukenya.ac.ke',
  year,
}) => {
  return (
    <AuthenticationLayout
      actionButtonLabel="Go to Dashboard"
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
        Account Activated
      </h2>

      <div style={{ marginBottom: '16px' }}>
        <StatusBadge status="Active" />
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
        Your administrator account ({email}) has been successfully activated and secured with Two-Factor Authentication. 
        You may now access the administrative dashboard.
      </p>
    </AuthenticationLayout>
  )
}

export default AdminActivatedEmail
