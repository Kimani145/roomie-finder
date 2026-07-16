import React from 'react'
import { Header } from '../partials/Header'
import { Footer } from '../partials/Footer'
import { OTPCard } from '../partials/OTPCard'
import { Button } from '../partials/Button'
import { SecurityNotice } from '../partials/SecurityNotice'
import { WarningCard } from '../partials/WarningCard'

interface AuthenticationLayoutProps {
  children: React.ReactNode
  otp?: string
  actionButtonLabel?: string
  actionButtonUrl?: string
  showWarning?: boolean
  warningMessage?: string
  showSecurityNotice?: boolean
  securityNoticeMessage?: string
  supportEmail?: string
  year?: number
}

export const AuthenticationLayout: React.FC<AuthenticationLayoutProps> = ({
  children,
  otp,
  actionButtonLabel,
  actionButtonUrl,
  showWarning = false,
  warningMessage,
  showSecurityNotice = true,
  securityNoticeMessage,
  supportEmail,
  year,
}) => {
  return (
    <div
      style={{
        width: '100%',
        backgroundColor: '#0F172A',
        padding: '40px 20px',
        boxSizing: 'border-box',
      }}
    >
      <div
        style={{
          maxWidth: '580px',
          margin: '0 auto',
          backgroundColor: '#1E293B',
          border: '1px solid #334155',
          borderRadius: '24px',
          overflow: 'hidden',
          boxShadow: '0 10px 30px -10px rgba(0, 0, 0, 0.5)',
        }}
      >
        {/* Header */}
        <Header />

        {/* Content Body */}
        <div style={{ padding: '40px 32px' }}>
          {children}

          {/* Conditional OTP Block */}
          {otp && <OTPCard otp={otp} />}

          {/* Conditional Action Button */}
          {actionButtonLabel && actionButtonUrl && (
            <Button label={actionButtonLabel} url={actionButtonUrl} />
          )}

          {/* Conditional Warning Card */}
          {showWarning && <WarningCard message={warningMessage} />}

          {/* Conditional Security Notice */}
          {showSecurityNotice && (
            <SecurityNotice message={securityNoticeMessage} />
          )}
        </div>

        {/* Footer */}
        <Footer supportEmail={supportEmail} year={year} />
      </div>
    </div>
  )
}
