import React from 'react'
import { cn } from './cn'

// ─── Types ─────────────────────────────────────────────────────────────────────
export type ButtonVariant = 'primary' | 'secondary' | 'outline' | 'ghost'
export type ButtonSize = 'sm' | 'md' | 'lg'

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant
  size?: ButtonSize
  fullWidth?: boolean
  loading?: boolean
  leftIcon?: React.ReactNode
  rightIcon?: React.ReactNode
}

// ─── Variant styles ────────────────────────────────────────────────────────────
const variantStyles: Record<ButtonVariant, string> = {
  primary: [
    'bg-blue-500 text-white',
    'hover:bg-blue-600',
    'active:bg-blue-700',
    'disabled:bg-blue-300 disabled:text-blue-100',
    'shadow-sm shadow-blue-500/20',
    'ring-offset-slate-900 focus-visible:ring-2 focus-visible:ring-blue-400',
  ].join(' '),

  secondary: [
    'bg-slate-100 text-slate-900',
    'hover:bg-slate-200',
    'active:bg-slate-300',
    'disabled:bg-slate-100 disabled:text-slate-400',
    'focus-visible:ring-2 focus-visible:ring-slate-400 ring-offset-white',
  ].join(' '),

  outline: [
    'bg-transparent text-slate-700 border border-slate-200',
    'hover:bg-slate-50 hover:border-slate-300',
    'active:bg-slate-100',
    'disabled:border-slate-200 disabled:text-slate-400',
    'focus-visible:ring-2 focus-visible:ring-blue-400 ring-offset-white',
  ].join(' '),

  ghost: [
    'bg-transparent text-slate-600',
    'hover:bg-slate-100 hover:text-slate-900',
    'active:bg-slate-200',
    'disabled:text-slate-400',
    'focus-visible:ring-2 focus-visible:ring-slate-400 ring-offset-white',
  ].join(' '),
}

// ─── Size styles ───────────────────────────────────────────────────────────────
const sizeStyles: Record<ButtonSize, string> = {
  sm: 'h-8 px-3 text-xs gap-1.5 rounded-lg',
  md: 'h-10 px-4 text-sm gap-2 rounded-xl',
  lg: 'h-12 px-6 text-base gap-2.5 rounded-xl',
}

// ─── Spinner ───────────────────────────────────────────────────────────────────
const Spinner: React.FC<{ className?: string }> = ({ className }) => (
  <svg
    className={cn('animate-spin', className)}
    xmlns="http://www.w3.org/2000/svg"
    fill="none"
    viewBox="0 0 24 24"
    aria-hidden="true"
  >
    <circle
      className="opacity-25"
      cx="12"
      cy="12"
      r="10"
      stroke="currentColor"
      strokeWidth="4"
    />
    <path
      className="opacity-75"
      fill="currentColor"
      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
    />
  </svg>
)

// ─── Button ────────────────────────────────────────────────────────────────────
export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      variant = 'primary',
      size = 'md',
      fullWidth = false,
      loading = false,
      disabled,
      leftIcon,
      rightIcon,
      children,
      className,
      ...props
    },
    ref
  ) => {
    const isDisabled = disabled || loading

    return (
      <button
        ref={ref}
        disabled={isDisabled}
        className={cn(
          // Base
          'inline-flex items-center justify-center',
          'font-semibold font-sans',
          'select-none outline-none',
          'transition-all duration-150',
          // Physics — doctrine requirement
          'active:scale-[0.98]',
          // Disabled base
          'disabled:pointer-events-none disabled:cursor-not-allowed',
          // Variant
          variantStyles[variant],
          // Size
          sizeStyles[size],
          // Full width
          fullWidth && 'w-full',
          className
        )}
        {...props}
      >
        {loading ? (
          <>
            <Spinner
              className={cn(
                size === 'sm' ? 'h-3 w-3' : size === 'lg' ? 'h-5 w-5' : 'h-4 w-4'
              )}
            />
            <span className="opacity-70">{children}</span>
          </>
        ) : (
          <>
            {leftIcon && (
              <span className="flex-shrink-0" aria-hidden="true">
                {leftIcon}
              </span>
            )}
            {children}
            {rightIcon && (
              <span className="flex-shrink-0" aria-hidden="true">
                {rightIcon}
              </span>
            )}
          </>
        )}
      </button>
    )
  }
)

Button.displayName = 'Button'
