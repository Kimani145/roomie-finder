import React from 'react'

export const Header: React.FC = () => {
  return (
    <div
      style={{
        background: 'linear-gradient(135deg, #800020 0%, #4A0012 100%)',
        padding: '32px',
        textAlign: 'center',
        borderTopLeftRadius: '24px',
        borderTopRightRadius: '24px',
      }}
    >
      <h1
        style={{
          color: '#FFFFFF',
          margin: 0,
          fontSize: '26px',
          fontWeight: 800,
          letterSpacing: '-0.5px',
          fontFamily: "Outfit, Inter, system-ui, -apple-system, sans-serif",
        }}
      >
        Roomie Finder
      </h1>
      <p
        style={{
          color: 'rgba(255, 255, 255, 0.7)',
          margin: '4px 0 0 0',
          fontSize: '13px',
          letterSpacing: '1px',
          textTransform: 'uppercase',
          fontWeight: 600,
          fontFamily: "Outfit, Inter, system-ui, -apple-system, sans-serif",
        }}
      >
        TUK Student Verification
      </p>
    </div>
  )
}
