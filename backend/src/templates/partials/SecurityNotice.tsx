import React from 'react'

interface SecurityNoticeProps {
  message?: string
}

export const SecurityNotice: React.FC<SecurityNoticeProps> = ({
  message = 'We verify all student accounts to ensure a safe roommate matching community free of bots, scams, and external intruders. If you did not trigger this notification, please secure your credentials.',
}) => {
  return (
    <div
      style={{
        margin: '24px 0',
        padding: '16px',
        backgroundColor: '#0F172A',
        borderRadius: '12px',
        borderLeft: '3px solid #334155',
      }}
    >
      <p
        style={{
          margin: 0,
          fontSize: '13px',
          lineHeight: '20px',
          color: '#64748B',
          fontFamily: "Inter, system-ui, -apple-system, sans-serif",
        }}
      >
        <strong>Community Safety Notice:</strong><br />
        {message}
      </p>
    </div>
  )
}
