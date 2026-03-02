import React, { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Mail, Lock, ShieldCheck, AlertCircle } from 'lucide-react'
import { useAuth } from '@/hooks/useAuth'
import { isValidTukEmail, type AuthServiceError } from '@/services/authService'

const SignUpPage: React.FC = () => {
  const navigate = useNavigate()
  const { register } = useAuth()

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [domainError, setDomainError] = useState<string | null>(null)

  // ── Live domain validation ────────────────────────────────────────────────
  const handleEmailChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value
    setEmail(value)
    setError(null)

    // Only validate domain once user has typed an @
    if (value.includes('@')) {
      if (!isValidTukEmail(value)) {
        setDomainError(
          'Access restricted to valid TUK institutional emails only.'
        )
      } else {
        setDomainError(null)
      }
    } else {
      setDomainError(null)
    }
  }

  // ── Submit ────────────────────────────────────────────────────────────────
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    // Guard: TUK domain
    if (!isValidTukEmail(email)) {
      setDomainError(
        'Access restricted to valid TUK institutional emails only.'
      )
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

  const hasEmailError = !!domainError
  const hasFormError = !!error

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-center py-12 px-6 sm:px-8">
      <div className="max-w-md w-full mx-auto bg-white rounded-2xl shadow-sm border border-slate-200 p-8">
        {/* Brand Header */}
        <div className="text-center mb-8">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-blue-50">
            <ShieldCheck className="h-7 w-7 text-blue-500" />
          </div>
          <h1 className="font-syne text-2xl font-bold text-slate-900 mb-2">
            Create your account
          </h1>
          <p className="text-sm text-slate-500">
            Use your TUK student email to get verified access to the
            compatibility engine.
          </p>
        </div>

        {/* Global Error Banner */}
        {hasFormError && (
          <div className="mb-6 flex items-start gap-3 rounded-xl bg-red-50 border border-red-200 p-4">
            <AlertCircle className="h-5 w-5 text-red-500 flex-shrink-0 mt-0.5" />
            <p className="text-sm text-red-700 font-medium">{error}</p>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Email */}
          <div>
            <label
              htmlFor="signup-email"
              className="block text-sm font-bold text-slate-700 mb-1.5"
            >
              Student Email
            </label>
            <div className="relative">
              <input
                id="signup-email"
                type="email"
                value={email}
                onChange={handleEmailChange}
                placeholder="joseph@students.tukenya.ac.ke"
                required
                autoComplete="email"
                aria-invalid={hasEmailError}
                aria-describedby={hasEmailError ? 'email-error' : undefined}
                className={[
                  'w-full bg-slate-50 border rounded-xl pl-11 pr-4 py-3 text-slate-900 outline-none transition-all',
                  hasEmailError
                    ? 'border-red-400 focus:border-red-500 focus:ring-1 focus:ring-red-500'
                    : 'border-slate-200 focus:border-blue-500 focus:ring-1 focus:ring-blue-500',
                ].join(' ')}
              />
              <Mail className="absolute left-3.5 top-3.5 h-5 w-5 text-slate-400" />
            </div>

            {/* Domain Error */}
            {hasEmailError && (
              <p
                id="email-error"
                className="mt-1.5 flex items-center gap-1.5 text-xs font-medium text-red-600"
                role="alert"
              >
                <AlertCircle className="h-3.5 w-3.5" />
                {domainError}
              </p>
            )}

            {/* Hint */}
            {!hasEmailError && (
              <p className="text-[10px] text-slate-500 mt-1">
                Only @students.tukenya.ac.ke and @tukenya.ac.ke domains are
                accepted.
              </p>
            )}
          </div>

          {/* Password */}
          <div>
            <label
              htmlFor="signup-password"
              className="block text-sm font-bold text-slate-700 mb-1.5"
            >
              Password
            </label>
            <div className="relative">
              <input
                id="signup-password"
                type="password"
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value)
                  setError(null)
                }}
                placeholder="Create a strong password"
                required
                minLength={6}
                autoComplete="new-password"
                className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-11 pr-4 py-3 text-slate-900 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none transition-all"
              />
              <Lock className="absolute left-3.5 top-3.5 h-5 w-5 text-slate-400" />
            </div>
            <p className="text-[10px] text-slate-500 mt-1">
              At least 6 characters
            </p>
          </div>

          {/* Confirm Password */}
          <div>
            <label
              htmlFor="signup-confirm"
              className="block text-sm font-bold text-slate-700 mb-1.5"
            >
              Confirm Password
            </label>
            <div className="relative">
              <input
                id="signup-confirm"
                type="password"
                value={confirmPassword}
                onChange={(e) => {
                  setConfirmPassword(e.target.value)
                  setError(null)
                }}
                placeholder="Re-enter your password"
                required
                minLength={6}
                autoComplete="new-password"
                className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-11 pr-4 py-3 text-slate-900 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none transition-all"
              />
              <Lock className="absolute left-3.5 top-3.5 h-5 w-5 text-slate-400" />
            </div>
          </div>

          {/* Submit */}
          <button
            type="submit"
            disabled={isLoading || hasEmailError}
            className="w-full bg-blue-500 hover:bg-blue-600 disabled:bg-slate-300 disabled:cursor-not-allowed text-white font-bold py-3.5 rounded-xl shadow-lg shadow-blue-500/25 transition-all mt-6 active:scale-[0.98]"
          >
            {isLoading ? 'Creating account…' : 'Create Account'}
          </button>
        </form>

        {/* Toggle */}
        <div className="text-sm text-slate-600 text-center mt-6">
          Already have an account?{' '}
          <Link
            to="/login"
            className="text-blue-600 font-bold hover:underline"
          >
            Sign In
          </Link>
        </div>

        {/* Terms */}
        <p className="text-[10px] text-slate-400 text-center mt-4">
          By signing up, you agree to our Terms of Service and Privacy Policy
        </p>
      </div>
    </div>
  )
}

export default SignUpPage
