import React from 'react'

interface OTPCardProps {
  otp?: string
}

export const OTPCard: React.FC<OTPCardProps> = ({ otp }) => {
  if (!otp) return null

  // Support splitting digits for copy-friendly layout or keep it single string
  return (
    <div
      style={{
        margin: '32px 0',
        padding: '24px',
        backgroundColor: '#0F172A',
        borderRadius: '16px',
        border: '1px solid #334155',
        textAlign: 'center',
      }}
    >
      <p
        style={{
          margin: '0 0 12px 0',
          fontSize: '13px',
          color: '#94A3B8',
          textTransform: 'uppercase',
          letterSpacing: '1px',
          fontWeight: 600,
          fontFamily: "Inter, system-ui, -apple-system, sans-serif",
        }}
      >
        Your Security Verification Code
      </p>
      
      <div
        style={{
          display: 'inline-block',
          fontSize: '36px',
          fontWeight: 800,
          color: '#FFFFFF',
          letterSpacing: '8px',
          fontFamily: "Courier New, Courier, monospace",
          padding: '12px 24px',
          backgroundColor: '#1E293B',
          borderRadius: '12px',
          border: '1px dashed #475569',
        }}
        aria-label={`Verification code is ${otp.split('').join(' ')}`}
      >
        {otp}
      </div>
      
      <p
        style={{
          margin: '12px 0 0 0',
          fontSize: '12px',
          color: '#64748B',
          fontFamily: "Inter, system-ui, -apple-system, sans-serif",
        }}
      >
        Do not share this code with anyone. Roomie Finder support will never ask for it.
      </p>
    </div>
  )
}
