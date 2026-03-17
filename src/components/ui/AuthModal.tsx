import React from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { X } from 'lucide-react'

interface AuthModalProps {
  isOpen: boolean
  onClose: () => void
}

export const AuthModal: React.FC<AuthModalProps> = ({ isOpen, onClose }) => {
  const navigate = useNavigate()

  if (!isOpen) return null

  const onEmailClick = () => {
    onClose()
    navigate('/login')
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
      <button
        type="button"
        aria-label="Close authentication modal"
        className="absolute inset-0 bg-slate-900/50 backdrop-blur-sm"
        onClick={onClose}
      />
      <div
        role="dialog"
        aria-modal="true"
        className="relative z-10 w-full max-w-md rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 p-6 shadow-xl"
      >
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2 className="text-xl font-syne font-bold text-slate-900 dark:text-slate-50">
              Sign in to continue
            </h2>
            <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
              Create an account or sign in to like, message, and save profiles.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-full border border-slate-200 dark:border-slate-700 p-2 text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:border-slate-300 dark:hover:border-slate-600 transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="mt-6 space-y-3">
          <button
            type="button"
            onClick={onEmailClick}
            className="w-full bg-blue-500 hover:bg-blue-600 text-white font-medium py-3 px-4 rounded-xl transition-colors"
          >
            Continue with Email
          </button>
        </div>

        <div className="mt-4 text-xs text-slate-500 dark:text-slate-400 text-center">
          New here?{' '}
          <Link
            to="/signup"
            onClick={onClose}
            className="text-brand-600 dark:text-brand-400 font-semibold hover:underline"
          >
            Create an account
          </Link>
        </div>
      </div>
    </div>
  )
}
