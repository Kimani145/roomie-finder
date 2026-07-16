import React from 'react'

interface StatusBadgeProps {
  status: 'Pending' | 'Warning' | 'Suspended' | 'Approved' | 'Rejected' | 'Reinstated' | string
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({ status }) => {
  const normalized = status.trim().toLowerCase()
  
  let bg = 'rgba(100, 116, 139, 0.1)'
  let color = '#94A3B8'
  let border = '1px solid rgba(100, 116, 139, 0.2)'

  if (normalized === 'pending') {
    bg = 'rgba(245, 158, 11, 0.1)'
    color = '#F59E0B'
    border = '1px solid rgba(245, 158, 11, 0.2)'
  } else if (normalized === 'warning') {
    bg = 'rgba(249, 115, 22, 0.1)'
    color = '#FB923C'
    border = '1px solid rgba(249, 115, 22, 0.2)'
  } else if (normalized === 'suspended' || normalized === 'rejected') {
    bg = 'rgba(239, 68, 68, 0.1)'
    color = '#FCA5A5'
    border = '1px solid rgba(239, 68, 68, 0.2)'
  } else if (normalized === 'approved' || normalized === 'reinstated') {
    bg = 'rgba(16, 185, 129, 0.1)'
    color = '#34D399'
    border = '1px solid rgba(16, 185, 129, 0.2)'
  }

  return (
    <span
      style={{
        display: 'inline-block',
        padding: '4px 12px',
        borderRadius: '20px',
        fontSize: '11px',
        fontWeight: 700,
        textTransform: 'uppercase',
        letterSpacing: '0.5px',
        backgroundColor: bg,
        color: color,
        border: border,
        fontFamily: "Inter, system-ui, -apple-system, sans-serif",
      }}
    >
      {status}
    </span>
  )
}
