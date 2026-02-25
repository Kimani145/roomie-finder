import React, { useId, useState } from 'react'
import { cn } from './cn'

// ─── Types ─────────────────────────────────────────────────────────────────────
export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label: string
  error?: string
  hint?: string
  leftIcon?: React.ReactNode
  rightIcon?: React.ReactNode
  /** When true, shows the floating label behaviour. Default: true */
  floatingLabel?: boolean
}

// ─── Input ─────────────────────────────────────────────────────────────────────
export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  (
    {
      label,
      error,
      hint,
      leftIcon,
      rightIcon,
      floatingLabel = true,
      disabled,
      className,
      id: externalId,
      value,
      defaultValue,
      onFocus,
      onBlur,
      onChange,
      ...props
    },
    ref
  ) => {
    const autoId = useId()
    const id = externalId ?? autoId

    const [isFocused, setIsFocused] = useState(false)
    const [internalValue, setInternalValue] = useState(defaultValue ?? '')

    // Determine whether label should be "floated" (shrunk to top)
    const controlledValue = value !== undefined ? value : internalValue
    const hasValue = String(controlledValue).length > 0
    const isFloated = floatingLabel && (isFocused || hasValue)

    const handleFocus = (e: React.FocusEvent<HTMLInputElement>) => {
      setIsFocused(true)
      onFocus?.(e)
    }

    const handleBlur = (e: React.FocusEvent<HTMLInputElement>) => {
      setIsFocused(false)
      onBlur?.(e)
    }

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      if (value === undefined) setInternalValue(e.target.value)
      onChange?.(e)
    }

    return (
      <div className={cn('flex flex-col gap-1', className)}>
        {/* ── Input wrapper ──────────────────────────────────────────────── */}
        <div className="relative">
          {/* Left icon */}
          {leftIcon && (
            <span
              className={cn(
                'absolute left-3 top-1/2 -translate-y-1/2 flex-shrink-0',
                'pointer-events-none text-slate-400',
                isFocused && 'text-blue-500',
                error && 'text-red-400'
              )}
              aria-hidden="true"
            >
              {leftIcon}
            </span>
          )}

          {/* The actual input */}
          <input
            ref={ref}
            id={id}
            disabled={disabled}
            value={value}
            defaultValue={defaultValue}
            onFocus={handleFocus}
            onBlur={handleBlur}
            onChange={handleChange}
            aria-describedby={
              error ? `${id}-error` : hint ? `${id}-hint` : undefined
            }
            aria-invalid={!!error}
            placeholder={floatingLabel ? ' ' : props.placeholder}
            className={cn(
              // Base
              'peer w-full rounded-xl border bg-white font-sans text-sm text-slate-900',
              'outline-none',
              // Padding — account for icons and floating label
              floatingLabel ? 'pb-2 pt-5' : 'py-3',
              leftIcon ? 'pl-10' : 'pl-4',
              rightIcon ? 'pr-10' : 'pr-4',
              // Border + transition
              'border-slate-200 transition-all duration-150',
              // Focus
              'focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20',
              // Error
              error && 'border-red-400 focus:border-red-500 focus:ring-red-500/20',
              // Disabled
              'disabled:cursor-not-allowed disabled:bg-slate-50 disabled:text-slate-400'
            )}
            {...props}
          />

          {/* Floating label */}
          {floatingLabel && (
            <label
              htmlFor={id}
              className={cn(
                'pointer-events-none absolute left-0 font-sans font-medium',
                'transition-all duration-150',
                // Horizontal position — account for left icon
                leftIcon ? 'left-10' : 'left-4',
                // ── Floated (shrunk to top) ─────────────────────────────
                isFloated
                  ? [
                      'top-2 text-[10px] uppercase tracking-wider',
                      error ? 'text-red-500' : 'text-blue-500',
                    ]
                  : // ── Resting (center of input) ──────────────────────
                    'top-1/2 -translate-y-1/2 text-sm text-slate-400'
              )}
            >
              {label}
            </label>
          )}

          {/* Static label (non-floating mode) */}
          {!floatingLabel && (
            <label
              htmlFor={id}
              className="mb-1 block text-xs font-semibold uppercase tracking-wider text-slate-500"
            >
              {label}
            </label>
          )}

          {/* Right icon */}
          {rightIcon && (
            <span
              className={cn(
                'absolute right-3 top-1/2 -translate-y-1/2 flex-shrink-0',
                'pointer-events-none text-slate-400',
                isFocused && 'text-blue-500'
              )}
              aria-hidden="true"
            >
              {rightIcon}
            </span>
          )}
        </div>

        {/* ── Hint / Error ───────────────────────────────────────────────── */}
        {error && (
          <p
            id={`${id}-error`}
            role="alert"
            className="flex items-center gap-1 text-xs font-medium text-red-500"
          >
            <svg className="h-3 w-3 flex-shrink-0" viewBox="0 0 12 12" fill="currentColor" aria-hidden="true">
              <path d="M6 1a5 5 0 100 10A5 5 0 006 1zm0 3a.75.75 0 01.75.75v2a.75.75 0 01-1.5 0v-2A.75.75 0 016 4zm0 5.25a.75.75 0 110-1.5.75.75 0 010 1.5z" />
            </svg>
            {error}
          </p>
        )}
        {!error && hint && (
          <p id={`${id}-hint`} className="text-xs text-slate-400">
            {hint}
          </p>
        )}
      </div>
    )
  }
)

Input.displayName = 'Input'

// ─── TextArea ─────────────────────────────────────────────────────────────────
export interface TextAreaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label: string
  error?: string
  hint?: string
}

export const TextArea = React.forwardRef<HTMLTextAreaElement, TextAreaProps>(
  ({ label, error, hint, disabled, className, id: externalId, ...props }, ref) => {
    const autoId = useId()
    const id = externalId ?? autoId

    return (
      <div className={cn('flex flex-col gap-1', className)}>
        <label
          htmlFor={id}
          className="text-xs font-semibold uppercase tracking-wider text-slate-500"
        >
          {label}
        </label>
        <textarea
          ref={ref}
          id={id}
          disabled={disabled}
          aria-describedby={
            error ? `${id}-error` : hint ? `${id}-hint` : undefined
          }
          aria-invalid={!!error}
          className={cn(
            'min-h-[100px] w-full resize-y rounded-xl border px-4 py-3',
            'font-sans text-sm text-slate-900',
            'outline-none transition-all duration-150',
            'border-slate-200',
            'focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20',
            error && 'border-red-400 focus:border-red-500 focus:ring-red-500/20',
            'disabled:cursor-not-allowed disabled:bg-slate-50 disabled:text-slate-400'
          )}
          {...props}
        />
        {error && (
          <p id={`${id}-error`} role="alert" className="text-xs font-medium text-red-500">
            {error}
          </p>
        )}
        {!error && hint && (
          <p id={`${id}-hint`} className="text-xs text-slate-400">
            {hint}
          </p>
        )}
      </div>
    )
  }
)

TextArea.displayName = 'TextArea'
