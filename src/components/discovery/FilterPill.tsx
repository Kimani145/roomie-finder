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
        'outline-none focus-visible:ring-2 focus-visible:ring-weaver-purple focus-visible:ring-offset-2 focus-visible:ring-offset-white dark:focus-visible:ring-offset-slate-900',
        isActive
          ? 'bg-nest-blue/10 border border-nest-blue text-nest-blue dark:text-nest-accent'
          : 'bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700/60',
      ].join(' ')}
    >
      {label}
    </button>
  )
}
