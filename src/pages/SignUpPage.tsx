import React, { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import {
  Mail,
  Lock,
  ShieldCheck,
  AlertCircle,
  Eye,
  EyeOff,
  XCircle,
  CheckCircle2,
} from 'lucide-react'
import { useAuth } from '@/hooks/useAuth'
import type { AuthServiceError } from '@/services/authService'

const SignUpPage: React.FC = () => {
  const navigate = useNavigate()
  const { register } = useAuth()

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)

  const hasValidTukDomain =
    email.toLowerCase().endsWith('@students.tukenya.ac.ke') ||
    email.toLowerCase().endsWith('@tukenya.ac.ke')

  // ── Live domain validation ────────────────────────────────────────────────
  const handleEmailChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value
    setEmail(value)
    setError(null)
  }

  // ── Submit ────────────────────────────────────────────────────────────────
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    // Guard: TUK domain
    if (!hasValidTukDomain) {
      setError('⚠️ Must be a TUK institutional email.')
      return
    }

    // Guard: password match
    if (password !== confirmPassword) {
      setError('Passwords do not match.')
      return
    }

    setIsLoading(true)
    try {
      await register(email, password)
      // Redirect to verification holding page — NOT into the app
      navigate('/verify-email', { replace: true })
    } catch (err) {
      const authErr = err as AuthServiceError
      switch (authErr.code) {
        case 'auth/email-already-in-use':
          setError('An account with this email already exists. Try signing in.')
          break
        case 'auth/weak-password':
          setError('Password is too weak. Use at least 6 characters.')
          break
        default:
          setError(authErr.message || 'Something went wrong. Please try again.')
      }
    } finally {
      setIsLoading(false)
    }
  }

  const hasEmailError = !hasValidTukDomain
  const hasFormError = !!error

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex flex-col justify-center py-12 px-6 sm:px-8">
      <div className="max-w-md w-full mx-auto bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 p-8">
        {/* Brand Header */}
        <div className="text-center mb-8">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-blue-50 dark:bg-blue-900/30">
            <ShieldCheck className="h-7 w-7 text-blue-500 dark:text-blue-300" />
          </div>
          <h1 className="font-syne text-2xl font-bold text-slate-900 dark:text-slate-50 mb-2">
            Create your account
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Use your TUK student email to get verified access to the
            compatibility engine.
          </p>
        </div>

        {/* Global Error Banner */}
        {hasFormError && (
          <div className="mb-6 flex items-start gap-3 rounded-xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-500/50 p-4">
            <AlertCircle className="h-5 w-5 text-red-500 dark:text-red-300 flex-shrink-0 mt-0.5" />
            <p className="text-sm text-red-700 dark:text-red-200 font-medium">{error}</p>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Email */}
          <div>
            <label
              htmlFor="signup-email"
              className="block text-sm font-bold text-slate-700 dark:text-slate-200 mb-1.5"
            >
              Student Email
            </label>
            <div className="relative">
              <input
                id="signup-email"
                type="email"
                value={email}
                onChange={handleEmailChange}
                placeholder="matilda.tukenya.ac.ke or matilda@students.tukenya.ac.ke"
                required
                autoComplete="email"
                aria-invalid={hasEmailError}
                aria-describedby={hasEmailError ? 'email-error' : undefined}
                className={[
                  'w-full bg-slate-50 dark:bg-slate-900/60 border rounded-xl pl-11 pr-4 py-3 text-slate-900 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 outline-none transition-all',
                  hasEmailError
                    ? 'border-red-400 focus:border-red-500 focus:ring-1 focus:ring-red-500'
                    : 'border-slate-200 dark:border-slate-700 focus:border-blue-500 focus:ring-1 focus:ring-blue-500',
                ].join(' ')}
              />
              <Mail className="absolute left-3.5 top-3.5 h-5 w-5 text-slate-400 dark:text-slate-500" />
            </div>

            <p
              id="email-error"
              className={[
                'mt-1.5 flex items-center gap-1.5 text-xs font-medium',
                hasEmailError
                  ? 'text-red-600 dark:text-red-300'
                  : 'text-emerald-600 dark:text-emerald-300',
              ].join(' ')}
              role="alert"
            >
              {hasEmailError ? (
                <XCircle className="h-3.5 w-3.5" />
              ) : (
                <CheckCircle2 className="h-3.5 w-3.5" />
              )}
              {hasEmailError
                ? '⚠️ Must be a TUK institutional email.'
                : '✅ Valid TUK domain.'}
            </p>
          </div>

          {/* Password */}
          <div>
            <label
              htmlFor="signup-password"
              className="block text-sm font-bold text-slate-700 dark:text-slate-200 mb-1.5"
            >
              Password
            </label>
            <div className="relative">
              <input
                id="signup-password"
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value)
                  setError(null)
                }}
                placeholder="Create a strong password"
                required
                minLength={6}
                autoComplete="new-password"
                className="w-full bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-700 rounded-xl pl-11 pr-10 py-3 text-slate-900 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none transition-all"
              />
              <Lock className="absolute left-3.5 top-3.5 h-5 w-5 text-slate-400 dark:text-slate-500" />
              <button
                type="button"
                onClick={() => setShowPassword((v) => !v)}
                className="absolute right-3 top-3 p-0.5 text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-300"
                tabIndex={-1}
                aria-label={showPassword ? 'Hide password' : 'Show password'}
              >
                {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
              </button>
            </div>
            <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-1">
              At least 6 characters
            </p>
          </div>

          {/* Confirm Password */}
          <div>
            <label
              htmlFor="signup-confirm"
              className="block text-sm font-bold text-slate-700 dark:text-slate-200 mb-1.5"
            >
              Confirm Password
            </label>
            <div className="relative">
              <input
                id="signup-confirm"
                type={showConfirmPassword ? 'text' : 'password'}
                value={confirmPassword}
                onChange={(e) => {
                  setConfirmPassword(e.target.value)
                  setError(null)
                }}
                placeholder="Re-enter your password"
                required
                minLength={6}
                autoComplete="new-password"
                className="w-full bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-700 rounded-xl pl-11 pr-10 py-3 text-slate-900 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none transition-all"
              />
              <Lock className="absolute left-3.5 top-3.5 h-5 w-5 text-slate-400 dark:text-slate-500" />
              <button
                type="button"
                onClick={() => setShowConfirmPassword((v) => !v)}
                className="absolute right-3 top-3 p-0.5 text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-300"
                tabIndex={-1}
                aria-label={showConfirmPassword ? 'Hide password' : 'Show password'}
              >
                {showConfirmPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
              </button>
            </div>
          </div>

          {/* Submit */}
          <button
            type="submit"
            disabled={isLoading || hasEmailError}
            className="w-full bg-blue-500 hover:bg-blue-600 disabled:bg-slate-300 dark:disabled:bg-slate-700 disabled:cursor-not-allowed text-white font-bold py-3.5 rounded-xl shadow-lg shadow-blue-500/25 transition-all mt-6 active:scale-[0.98]"
          >
            {isLoading ? 'Creating account…' : 'Create Account'}
          </button>
        </form>

        {/* Toggle */}
        <div className="text-sm text-slate-600 dark:text-slate-300 text-center mt-6">
          Already have an account?{' '}
          <Link
            to="/login"
            className="text-blue-600 dark:text-blue-300 font-bold hover:underline"
          >
            Sign In
          </Link>
        </div>

        {/* Terms */}
        <p className="text-[10px] text-slate-400 dark:text-slate-500 text-center mt-4">
          By signing up, you agree to our Terms of Service and Privacy Policy
        </p>
      </div>
    </div>
  )
}

export default SignUpPage
