import React from 'react'

interface WarningCardProps {
  message?: string
}

export const WarningCard: React.FC<WarningCardProps> = ({
  message = 'If you did not initiate this request, please change your password immediately and contact Roomie Finder support.',
}) => {
  return (
    <div
      style={{
        margin: '24px 0',
        padding: '16px',
        backgroundColor: 'rgba(239, 68, 68, 0.1)',
        borderRadius: '12px',
        borderLeft: '4px solid #EF4444',
      }}
    >
      <p
        style={{
          margin: 0,
          fontSize: '13px',
          lineHeight: '20px',
          color: '#FCA5A5',
          fontFamily: "Inter, system-ui, -apple-system, sans-serif",
          fontWeight: 500,
        }}
      >
        <strong>Security Warning:</strong> {message}
      </p>
    </div>
  )
}
