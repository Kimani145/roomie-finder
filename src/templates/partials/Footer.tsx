import React from 'react'

interface FooterProps {
  supportEmail?: string
  year?: number
}

export const Footer: React.FC<FooterProps> = ({ supportEmail = 'support@students.tukenya.ac.ke', year }) => {
  const currentYear = year || new Date().getFullYear()
  return (
    <div
      style={{
        backgroundColor: '#0F172A',
        borderTop: '1px solid #334155',
        padding: '32px',
        textAlign: 'center',
        fontSize: '12px',
        color: '#64748B',
        lineHeight: '20px',
        fontFamily: "Inter, system-ui, -apple-system, sans-serif",
        borderBottomLeftRadius: '24px',
        borderBottomRightRadius: '24px',
      }}
    >
      <p style={{ margin: '0 0 8px 0' }}>
        This is an automated security notification from Roomie Finder.
      </p>
      <p style={{ margin: '0 0 8px 0' }}>
        Technical University of Kenya &bull; Haile Selassie Avenue, Nairobi, Kenya
      </p>
      <p style={{ margin: '0 0 12px 0' }}>
        &copy; {currentYear} Roomie Finder. All rights reserved.
      </p>
      <a
        href={`mailto:${supportEmail}`}
        style={{
          color: '#F43F5E',
          textDecoration: 'none',
          fontWeight: 600,
        }}
      >
        {supportEmail}
      </a>
    </div>
  )
}
