import React from 'react'
import { cn } from './cn'

// ─── Types ─────────────────────────────────────────────────────────────────────
export interface ChipProps {
  label: string
  selected?: boolean
  disabled?: boolean
  /** Optional icon shown before the label */
  icon?: React.ReactNode
  /** Show an 'x' dismiss button when selected */
  dismissible?: boolean
  onToggle?: () => void
  onDismiss?: () => void
  className?: string
}

// ─── Close icon ────────────────────────────────────────────────────────────────
const CloseIcon: React.FC = () => (
  <svg
    className="h-3 w-3 flex-shrink-0"
    viewBox="0 0 12 12"
    fill="none"
    aria-hidden="true"
  >
    <path
      d="M9 3L3 9M3 3L9 9"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
    />
  </svg>
)

// ─── Chip ──────────────────────────────────────────────────────────────────────
export const Chip: React.FC<ChipProps> = ({
  label,
  selected = false,
  disabled = false,
  icon,
  dismissible = false,
  onToggle,
  onDismiss,
  className,
}) => {
  return (
    <button
      type="button"
      role="checkbox"
      aria-checked={selected}
      aria-label={label}
      disabled={disabled}
      onClick={onToggle}
      className={cn(
        // Base — pill shape
        'inline-flex items-center gap-1.5 rounded-full px-3 py-1.5',
        'text-xs font-semibold font-sans leading-none',
        'select-none outline-none',
        // Physics — doctrine requirement
        'transition-all duration-150',
        'active:scale-[0.98]',
        // Focus ring
        'focus-visible:ring-2 focus-visible:ring-blue-400 focus-visible:ring-offset-1',
        // ── Selected state: Blue-50 background + Blue-500 border ──────────
        selected && [
          'bg-blue-50 text-blue-700',
          'ring-1 ring-blue-500',
          'hover:bg-blue-100',
          'active:bg-blue-200',
        ],
        // ── Unselected state: Slate-100 background ─────────────────────────
        !selected && [
          'bg-slate-100 text-slate-600',
          'ring-1 ring-slate-200',
          'hover:bg-slate-200 hover:text-slate-800',
          'active:bg-slate-300',
        ],
        // Disabled
        disabled && 'pointer-events-none cursor-not-allowed opacity-40',
        className
      )}
    >
      {/* Icon */}
      {icon && (
        <span className="flex-shrink-0" aria-hidden="true">
          {icon}
        </span>
      )}

      {/* Label */}
      <span>{label}</span>

      {/* Dismiss button — only shown when selected + dismissible */}
      {selected && dismissible && (
        <span
          role="button"
          aria-label={`Remove ${label} filter`}
          tabIndex={-1}
          onClick={(e) => {
            e.stopPropagation()
            onDismiss?.()
          }}
          className={cn(
            'flex-shrink-0 rounded-full p-0.5',
            'text-blue-500 hover:bg-blue-200 hover:text-blue-700',
            'transition-colors duration-100'
          )}
        >
          <CloseIcon />
        </span>
      )}
    </button>
  )
}

// ─── ChipGroup ─────────────────────────────────────────────────────────────────
/**
 * Renders a horizontally scrollable row of chips.
 * Manages single-select or multi-select state internally
 * via the onSelect callback.
 */
export interface ChipGroupProps<T extends string> {
  options: { value: T; label: string; icon?: React.ReactNode }[]
  selected: T | T[] | null
  multiSelect?: boolean
  onSelect: (value: T) => void
  className?: string
}

export function ChipGroup<T extends string>({
  options,
  selected,
  multiSelect = false,
  onSelect,
  className,
}: ChipGroupProps<T>) {
  const isSelected = (value: T): boolean => {
    if (selected === null) return false
    if (Array.isArray(selected)) return selected.includes(value)
    return selected === value
  }

  return (
    <div
      className={cn(
        'flex items-center gap-2 overflow-x-auto',
        'scrollbar-none pb-1',
        className
      )}
      role={multiSelect ? 'group' : 'radiogroup'}
    >
      {options.map((opt) => (
        <Chip
          key={opt.value}
          label={opt.label}
          icon={opt.icon}
          selected={isSelected(opt.value)}
          onToggle={() => onSelect(opt.value)}
          dismissible={multiSelect}
          onDismiss={() => onSelect(opt.value)}
        />
      ))}
    </div>
  )
}
