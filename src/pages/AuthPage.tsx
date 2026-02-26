import React, { useEffect, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { Mail, Lock, CheckCircle2 } from 'lucide-react'
import { useAuth } from '@/hooks/useAuth'

type AuthMode = 'signin' | 'signup'

const AuthPage: React.FC = () => {
  const navigate = useNavigate()
  const location = useLocation()
  const { register, login } = useAuth()
  const [mode, setMode] = useState<AuthMode>('signup')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [isLoading, setIsLoading] = useState(false)

  useEffect(() => {
    if (location.pathname === '/login') {
      setMode('signin')
    }
    if (location.pathname === '/signup') {
      setMode('signup')
    }
  }, [location.pathname])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    try {
      if (mode === 'signup') {
        await register(email, password)
        navigate('/onboarding')
      } else {
        await login(email, password)
        navigate('/discover')
      }
    } catch (error) {
      console.error('Authentication failed:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleGoogleAuth = () => {
    console.log('Google Auth clicked')
  }

  const isSignUp = mode === 'signup'

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-center py-12 px-6 sm:px-8">
      <div className="max-w-md w-full mx-auto bg-white rounded-2xl shadow-sm border border-slate-200 p-8">
        {/* Brand Header */}
        <div className="text-center mb-8">
          <h1 className="font-syne text-brand-600 text-2xl font-bold mb-2">
            Roomie Finder
          </h1>
          <p className="text-sm text-slate-500">
            {isSignUp
              ? 'Create your compatibility profile. Use your student email for verified status.'
              : 'Welcome back. Find your match.'}
          </p>
        </div>

        {/* Auth Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Email Field */}
          <div>
            <label
              htmlFor="email"
              className="block text-sm font-bold text-slate-700 mb-1.5"
            >
              Email Address
            </label>
            <div className="relative">
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="joseph@students.tukenya.ac.ke"
                required
                className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-11 pr-4 py-3 text-slate-900 focus:border-brand-500 focus:ring-1 focus:ring-brand-500 outline-none transition-all"
              />
              <Mail className="absolute left-3.5 top-3.5 h-5 w-5 text-slate-400" />
            </div>
            {isSignUp && (
              <p className="text-[10px] text-emerald-600 font-medium mt-1 flex items-center gap-1">
                <CheckCircle2 className="h-3 w-3" />
                We recommend using your @students.tukenya.ac.ke email.
              </p>
            )}
          </div>

          {/* Password Field */}
          <div>
            <label
              htmlFor="password"
              className="block text-sm font-bold text-slate-700 mb-1.5"
            >
              Password
            </label>
            <div className="relative">
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter your password"
                required
                minLength={6}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-11 pr-4 py-3 text-slate-900 focus:border-brand-500 focus:ring-1 focus:ring-brand-500 outline-none transition-all"
              />
              <Lock className="absolute left-3.5 top-3.5 h-5 w-5 text-slate-400" />
            </div>
            {isSignUp && (
              <p className="text-[10px] text-slate-500 mt-1">
                At least 6 characters
              </p>
            )}
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={isLoading}
            className="w-full bg-brand-500 hover:bg-brand-600 disabled:bg-slate-300 disabled:cursor-not-allowed text-white font-bold py-3.5 rounded-xl shadow-lg shadow-brand-500/25 transition-all mt-6"
          >
            {isLoading
              ? 'Please wait...'
              : isSignUp
              ? 'Create Account'
              : 'Sign In'}
          </button>
        </form>

        {/* Divider */}
        <div className="flex items-center gap-4 my-6">
          <div className="flex-1 h-px bg-slate-200" />
          <span className="text-xs text-slate-400 uppercase tracking-widest">
            or
          </span>
          <div className="flex-1 h-px bg-slate-200" />
        </div>

        {/* Google Auth Button */}
        <button
          onClick={handleGoogleAuth}
          className="w-full bg-white border border-slate-200 text-slate-700 font-bold py-3.5 rounded-xl hover:bg-slate-50 transition-all flex items-center justify-center gap-2"
        >
          <svg className="h-5 w-5" viewBox="0 0 24 24">
            <path
              fill="#4285F4"
              d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
            />
            <path
              fill="#34A853"
              d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
            />
            <path
              fill="#FBBC05"
              d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
            />
            <path
              fill="#EA4335"
              d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
            />
          </svg>
          Continue with Google
        </button>

        {/* Toggle Link */}
        <div className="text-sm text-slate-600 text-center mt-6">
          {isSignUp ? (
            <>
              Already have an account?{' '}
              <button
                type="button"
                onClick={() => setMode('signin')}
                className="text-brand-600 font-bold hover:underline"
              >
                Sign In
              </button>
            </>
          ) : (
            <>
              Don't have an account?{' '}
              <button
                type="button"
                onClick={() => setMode('signup')}
                className="text-brand-600 font-bold hover:underline"
              >
                Sign Up
              </button>
            </>
          )}
        </div>

        {/* Terms/Privacy (Optional micro-copy) */}
        {isSignUp && (
          <p className="text-[10px] text-slate-400 text-center mt-4">
            By signing up, you agree to our Terms of Service and Privacy Policy
          </p>
        )}
      </div>
    </div>
  )
}

export default AuthPage
