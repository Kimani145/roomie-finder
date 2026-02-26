import React from 'react'

interface FilterPillProps {
  label: string
  isActive?: boolean
  onClick: () => void
}

export const FilterPill: React.FC<FilterPillProps> = ({
  label,
  isActive = false,
  onClick,
}) => {
  return (
    <button
      onClick={onClick}
      className={[
        'rounded-full px-4 py-1.5 text-sm font-medium transition-colors whitespace-nowrap flex-shrink-0',
        'outline-none focus-visible:ring-2 focus-visible:ring-blue-400 focus-visible:ring-offset-2',
        isActive
          ? 'bg-blue-50 border border-blue-500 text-blue-700'
          : 'bg-slate-50 border border-slate-200 text-slate-700 hover:bg-slate-100',
      ].join(' ')}
    >
      {label}
    </button>
  )
}
