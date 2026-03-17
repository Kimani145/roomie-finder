import React, { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { MailCheck, RefreshCw, LogOut, AlertCircle, CheckCircle2 } from 'lucide-react'
import { useAuth } from '@/hooks/useAuth'

const VerifyEmailPage: React.FC = () => {
  const navigate = useNavigate()
  const { user, reloadUser, resendVerification, logout } = useAuth()

  const [checking, setChecking] = useState(false)
  const [resending, setResending] = useState(false)
  const [toast, setToast] = useState<{ type: 'error' | 'success'; message: string } | null>(null)

  useEffect(() => {
    let interval: ReturnType<typeof setInterval> | null = null

    if (user && !user.emailVerified) {
      interval = setInterval(async () => {
        try {
          await user.reload()
          if (user.emailVerified) {
            if (interval) clearInterval(interval)
            navigate('/onboarding', { replace: true })
          }
        } catch (error) {
          console.error('Email verification polling failed:', error)
        }
      }, 3000)
    }

    return () => {
      if (interval) clearInterval(interval)
    }
  }, [user, navigate])

  // ── Check verification status ─────────────────────────────────────────────
  const handleContinue = async () => {
    setChecking(true)
    setToast(null)

    try {
      const verified = await reloadUser()
      if (verified) {
        navigate('/onboarding', { replace: true })
      } else {
        setToast({
          type: 'error',
          message: 'Email not verified yet. Please check your inbox.',
        })
      }
    } catch {
      setToast({
        type: 'error',
        message: 'Could not check verification status. Try again.',
      })
    } finally {
      setChecking(false)
    }
  }

  // ── Resend verification email ─────────────────────────────────────────────
  const handleResend = async () => {
    setResending(true)
    setToast(null)

    try {
      await resendVerification()
      setToast({
        type: 'success',
        message: 'Verification email resent! Check your inbox.',
      })
    } catch {
      setToast({
        type: 'error',
        message: 'Failed to resend. Please wait a moment and try again.',
      })
    } finally {
      setResending(false)
    }
  }

  // ── Sign out ──────────────────────────────────────────────────────────────
  const handleLogout = async () => {
    await logout()
    navigate('/', { replace: true })
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex flex-col items-center justify-center px-6">
      <div className="max-w-md w-full bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 p-8 text-center">
        {/* Icon */}
        <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-blue-50 dark:bg-blue-900/30">
          <MailCheck className="h-10 w-10 text-blue-500 dark:text-blue-300" />
        </div>

        {/* Heading */}
        <h1 className="font-syne text-2xl font-bold text-slate-900 dark:text-slate-50 mb-3">
          Verify your student email
        </h1>

        {/* Body text */}
        <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed mb-2">
          We&apos;ve sent a verification link to
        </p>
        <p className="text-sm font-bold text-slate-900 dark:text-slate-50 mb-4 break-all">
          {user?.email ?? 'your email'}
        </p>
        <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed mb-8">
          You must verify your institutional identity before accessing the
          compatibility engine. Check your inbox (and spam folder) for the link.
        </p>

        {/* Toast */}
        {toast && (
          <div
            className={[
              'mb-6 flex items-center gap-2.5 rounded-xl border p-3.5 text-left',
              toast.type === 'error'
                ? 'bg-red-50 dark:bg-red-950/40 border-red-200 dark:border-red-500/50'
                : 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-500/40',
            ].join(' ')}
            role="alert"
          >
            {toast.type === 'error' ? (
              <AlertCircle className="h-5 w-5 text-red-500 dark:text-red-300 flex-shrink-0" />
            ) : (
              <CheckCircle2 className="h-5 w-5 text-emerald-500 dark:text-emerald-300 flex-shrink-0" />
            )}
            <p
              className={[
                'text-sm font-medium',
                toast.type === 'error'
                  ? 'text-red-700 dark:text-red-200'
                  : 'text-emerald-700 dark:text-emerald-200',
              ].join(' ')}
            >
              {toast.message}
            </p>
          </div>
        )}

        {/* Primary CTA */}
        <button
          onClick={handleContinue}
          disabled={checking}
          className="w-full bg-blue-500 hover:bg-blue-600 disabled:bg-slate-300 dark:disabled:bg-slate-700 disabled:cursor-not-allowed text-white font-bold py-3.5 rounded-xl shadow-lg shadow-blue-500/25 transition-all active:scale-[0.98] flex items-center justify-center gap-2"
        >
          {checking ? (
            <>
              <RefreshCw className="h-4 w-4 animate-spin" />
              Checking…
            </>
          ) : (
            "I've clicked the link — Continue"
          )}
        </button>

        {/* Secondary actions */}
        <div className="mt-4 flex flex-col gap-2">
          <button
            onClick={handleResend}
            disabled={resending}
            className="w-full text-sm font-semibold text-blue-600 dark:text-blue-300 hover:text-blue-700 dark:hover:text-blue-200 disabled:text-slate-400 dark:disabled:text-slate-500 py-2 transition-colors"
          >
            {resending ? 'Resending…' : 'Resend verification email'}
          </button>

          <button
            onClick={handleLogout}
            className="w-full flex items-center justify-center gap-1.5 text-sm font-medium text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 py-2 transition-colors"
          >
            <LogOut className="h-3.5 w-3.5" />
            Sign out
          </button>
        </div>
      </div>
    </div>
  )
}

export default VerifyEmailPage
