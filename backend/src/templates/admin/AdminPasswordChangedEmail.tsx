import React from 'react'
import { AuthenticationLayout } from '../layout/AuthenticationLayout'

interface AdminPasswordChangedEmailProps {
  email?: string
  supportEmail?: string
  year?: number
}

export const AdminPasswordChangedEmail: React.FC<AdminPasswordChangedEmailProps> = ({
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
          color: '#3B82F6',
          margin: '0 0 16px 0',
          fontFamily: "Inter, system-ui, -apple-system, sans-serif",
        }}
      >
        Password Changed
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
        The password for your administrator account ({email}) has been changed successfully. 
        If you did not make this change, please contact the Super Admin or Security immediately to lock your account.
      </p>
    </AuthenticationLayout>
  )
}

export default AdminPasswordChangedEmail
