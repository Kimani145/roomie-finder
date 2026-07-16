import React from 'react'

interface ButtonProps {
  label?: string
  url?: string
}

export const Button: React.FC<ButtonProps> = ({ label, url }) => {
  if (!label || !url) return null

  return (
    <div
      style={{
        textAlign: 'center',
        margin: '32px 0',
      }}
    >
      <a
        href={url}
        target="_blank"
        rel="noopener noreferrer"
        style={{
          display: 'inline-block',
          backgroundColor: '#800020',
          color: '#FFFFFF',
          textDecoration: 'none',
          fontWeight: 700,
          fontSize: '15px',
          padding: '14px 32px',
          borderRadius: '12px',
          boxShadow: '0 4px 12px rgba(128, 0, 32, 0.3)',
          fontFamily: "Inter, system-ui, -apple-system, sans-serif",
        }}
      >
        {label}
      </a>
    </div>
  )
}
