import React from 'react'

interface InfoCardField {
  label: string
  value: React.ReactNode
}

interface InfoCardProps {
  title?: string
  fields?: InfoCardField[]
  children?: React.ReactNode
}

export const InfoCard: React.FC<InfoCardProps> = ({ title, fields, children }) => {
  return (
    <div
      style={{
        backgroundColor: '#0F172A',
        borderRadius: '16px',
        padding: '20px',
        border: '1px solid #334155',
        margin: '24px 0',
        fontFamily: "Inter, system-ui, -apple-system, sans-serif",
      }}
    >
      {title && (
        <div
          style={{
            fontSize: '12px',
            fontWeight: 700,
            textTransform: 'uppercase',
            letterSpacing: '1px',
            color: '#94A3B8',
            marginBottom: '12px',
            borderBottom: '1px solid #1E293B',
            paddingBottom: '8px',
          }}
        >
          {title}
        </div>
      )}
      
      {fields && fields.length > 0 && (
        <div style={{ display: 'table', width: '100%', borderCollapse: 'collapse' }}>
          {fields.map((field, idx) => (
            <div key={idx} style={{ display: 'table-row' }}>
              <div
                style={{
                  display: 'table-cell',
                  padding: '6px 0',
                  fontSize: '13px',
                  fontWeight: 600,
                  color: '#64748B',
                  width: '35%',
                  verticalAlign: 'top',
                }}
              >
                {field.label}
              </div>
              <div
                style={{
                  display: 'table-cell',
                  padding: '6px 0',
                  fontSize: '13px',
                  color: '#E2E8F0',
                  verticalAlign: 'top',
                }}
              >
                {field.value}
              </div>
            </div>
          ))}
        </div>
      )}
      
      {children && <div style={{ marginTop: fields && fields.length > 0 ? '12px' : 0 }}>{children}</div>}
    </div>
  )
}
