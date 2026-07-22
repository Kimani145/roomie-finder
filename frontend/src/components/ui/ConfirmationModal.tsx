import React from 'react'
import { AlertTriangle, X, Loader2 } from 'lucide-react'

export interface ConfirmationModalProps {
  isOpen: boolean
  title: string
  displayName?: string
  avatarUrl?: string
  actionSummary: string
  confirmText?: string
  cancelText?: string
  variant?: 'danger' | 'warning' | 'success' | 'info'
  loading?: boolean
  onConfirm: () => void
  onCancel: () => void
}

export const ConfirmationModal: React.FC<ConfirmationModalProps> = ({
  isOpen,
  title,
  displayName,
  avatarUrl,
  actionSummary,
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  variant = 'danger',
  loading = false,
  onConfirm,
  onCancel,
}) => {
  if (!isOpen) return null

  const getVariantStyles = () => {
    switch (variant) {
      case 'danger':
        return {
          iconBg: 'bg-red-500/10 text-red-500',
          confirmBtn: 'bg-red-600 hover:bg-red-700 text-white',
        }
      case 'warning':
        return {
          iconBg: 'bg-amber-500/10 text-amber-500',
          confirmBtn: 'bg-amber-600 hover:bg-amber-700 text-white',
        }
      case 'success':
        return {
          iconBg: 'bg-emerald-500/10 text-emerald-500',
          confirmBtn: 'bg-emerald-600 hover:bg-emerald-700 text-white',
        }
      default:
        return {
          iconBg: 'bg-brand-500/10 text-brand-400',
          confirmBtn: 'bg-brand-600 hover:bg-brand-700 text-white',
        }
    }
  }

  const styles = getVariantStyles()
  const initial = displayName ? displayName.charAt(0).toUpperCase() : 'U'

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fadeIn">
      <div className="relative w-full max-w-md bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-2xl space-y-5">
        <button
          onClick={onCancel}
          disabled={loading}
          className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center space-x-3">
          <div className={`p-3 rounded-xl ${styles.iconBg}`}>
            <AlertTriangle className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-slate-900 dark:text-slate-50 font-syne">{title}</h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">Administrative Governance Action</p>
          </div>
        </div>

        {displayName && (
          <div className="flex items-center space-x-3 p-3 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-100 dark:border-slate-800">
            {avatarUrl ? (
              <img src={avatarUrl} alt={displayName} className="w-10 h-10 rounded-full object-cover" />
            ) : (
              <div className="w-10 h-10 rounded-full bg-brand-600/20 text-brand-400 flex items-center justify-center font-bold text-sm">
                {initial}
              </div>
            )}
            <div>
              <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">{displayName}</p>
              <p className="text-xs text-slate-500 dark:text-slate-400">Target User</p>
            </div>
          </div>
        )}

        <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed whitespace-pre-wrap">
          {actionSummary}
        </p>

        <div className="flex items-center justify-end space-x-3 pt-2">
          <button
            type="button"
            onClick={onCancel}
            disabled={loading}
            className="px-4 py-2.5 rounded-xl text-sm font-medium text-slate-600 dark:text-slate-300 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 transition-colors disabled:opacity-50"
          >
            {cancelText}
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={loading}
            className={`px-5 py-2.5 rounded-xl text-sm font-semibold transition-colors flex items-center space-x-2 disabled:opacity-50 ${styles.confirmBtn}`}
          >
            {loading && <Loader2 className="w-4 h-4 animate-spin" />}
            <span>{confirmText}</span>
          </button>
        </div>
      </div>
    </div>
  )
}
