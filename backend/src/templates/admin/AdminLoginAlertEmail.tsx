import React from 'react'
import { AuthenticationLayout } from '../layout/AuthenticationLayout'
import { InfoCard } from '../partials/InfoCard'

interface AdminLoginAlertEmailProps {
  email?: string
  device?: string
  browser?: string
  location?: string
  time?: string
  supportEmail?: string
  year?: number
}

export const AdminLoginAlertEmail: React.FC<AdminLoginAlertEmailProps> = ({
  email,
  device = 'Unknown Device',
  browser = 'Unknown Browser',
  location = 'Unknown Location',
  time = new Date().toLocaleString(),
  supportEmail = 'security@tukenya.ac.ke',
  year,
}) => {
  const fields = [
    email && { label: 'Account', value: email },
    { label: 'Time', value: time },
    { label: 'Device', value: device },
    { label: 'Browser', value: browser },
    { label: 'Location', value: location },
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
          color: '#F59E0B',
          margin: '0 0 16px 0',
          fontFamily: "Inter, system-ui, -apple-system, sans-serif",
        }}
      >
        Administrator Login Alert
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
        A successful login was just detected for your administrator account. 
        If this was you, no further action is required. If you do not recognize this activity, 
        your account may be compromised. Please contact the Super Admin immediately.
      </p>

      <InfoCard title="Session Details" fields={fields} />
    </AuthenticationLayout>
  )
}

export default AdminLoginAlertEmail
