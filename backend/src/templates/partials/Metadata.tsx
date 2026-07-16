import React from 'react'

interface MetadataProps {
  requestId?: string
  timestamp?: string
  browser?: string
  device?: string
  ipAddress?: string
  location?: string
}

export const Metadata: React.FC<MetadataProps> = ({
  requestId,
  timestamp,
  browser,
  device,
  ipAddress,
  location,
}) => {
  const items = [
    requestId && { label: 'Request ID', value: requestId },
    timestamp && { label: 'Timestamp', value: timestamp },
    browser && { label: 'Browser', value: browser },
    device && { label: 'Device', value: device },
    ipAddress && { label: 'IP Address', value: ipAddress },
    location && { label: 'Location', value: location },
  ].filter(Boolean) as { label: string; value: string }[]

  if (items.length === 0) return null

  return (
    <div
      style={{
        marginTop: '24px',
        paddingTop: '16px',
        borderTop: '1px solid #334155',
        fontFamily: "Inter, system-ui, -apple-system, sans-serif",
      }}
    >
      <div
        style={{
          fontSize: '10px',
          fontWeight: 700,
          color: '#475569',
          textTransform: 'uppercase',
          letterSpacing: '0.5px',
          marginBottom: '6px',
        }}
      >
        Security &amp; Audit Metadata
      </div>
      <div style={{ fontSize: '11px', color: '#64748B', lineHeight: '16px' }}>
        {items.map((item, idx) => (
          <div key={idx} style={{ marginBottom: '2px' }}>
            <span style={{ fontWeight: 650, color: '#475569' }}>{item.label}:</span>{' '}
            <span style={{ fontFamily: 'monospace' }}>{item.value}</span>
          </div>
        ))}
      </div>
    </div>
  )
}
