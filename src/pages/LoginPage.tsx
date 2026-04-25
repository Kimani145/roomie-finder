import React, { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Mail, Lock, AlertCircle, LogIn, Eye, EyeOff, Info } from 'lucide-react'
import { useAuth } from '@/hooks/useAuth'

const LoginPage: React.FC = () => {
  const navigate = useNavigate()
  const { login } = useAuth()

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [showPassword, setShowPassword] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    try {
      await login(email, password);
      // Wait for AuthContext to populate currentUser, but also trigger manual navigation
      navigate('/discover');
    } catch (err: any) {
      console.error("Login failed:", err);
      // STRICT: We ONLY clear the password. DO NOT clear the email.
      setPassword(''); 
      
      // Map Firebase Auth errors to human-readable strings
      if (err.code === 'auth/invalid-credential' || err.code === 'auth/wrong-password' || err.code === 'auth/user-not-found') {
        setError('Incorrect email or password. Please try again.');
      } else if (err.code === 'auth/too-many-requests') {
        setError('Too many failed attempts. Please try again later.');
      } else {
        setError(err.message || 'Failed to sign in. Please check your connection.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="app-shell-surface min-h-screen flex flex-col justify-center py-12 px-6 sm:px-8">
      <div className="card-surface card-surface-wine max-w-md w-full mx-auto rounded-2xl p-8">
        {/* Brand Header */}
        <div className="text-center mb-8">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-weaver-purple/10 dark:bg-weaver-orange/10">
            <LogIn className="h-7 w-7 text-weaver-purple dark:text-weaver-orange" />
          </div>
          <h1 className="font-syne text-2xl font-bold text-slate-900 dark:text-slate-50 mb-2">
            Welcome back
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Sign in to find your match.
          </p>
        </div>

        {/* Error Banner */}
        {error && (
          <div className="mb-6 flex items-center gap-3 rounded-xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-500/50 p-4">
            <AlertCircle className="h-5 w-5 text-red-500 dark:text-red-400 shrink-0" />
            <p className="text-sm font-medium text-red-700 dark:text-red-200">{error}</p>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Email */}
          <div>
            <label
              htmlFor="login-email"
              className="block text-sm font-bold text-slate-700 dark:text-slate-200 mb-1.5"
            >
              Email Address
            </label>
            <div className="relative">
              <input
                id="login-email"
                type="email"
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value)
                  setError(null)
                }}
                placeholder="joseph@students.tukenya.ac.ke"
                required
                autoComplete="email"
                className="w-full bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-700 rounded-nest pl-11 pr-4 py-3 text-slate-900 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 focus:border-weaver-purple focus:ring-1 focus:ring-weaver-purple outline-none transition-all"
              />
              <Mail className="absolute left-3.5 top-3.5 h-5 w-5 text-slate-400 dark:text-slate-500" />
            </div>
            <p className="mt-1.5 flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400">
              <Info className="h-3.5 w-3.5" />
              Please use your official @students.tukenya.ac.ke email.
            </p>
          </div>

          {/* Password */}
          <div>
            <label
              htmlFor="login-password"
              className="block text-sm font-bold text-slate-700 dark:text-slate-200 mb-1.5"
            >
              Password
            </label>
            <div className="relative">
              <input
                id="login-password"
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value)
                  setError(null)
                }}
                placeholder="Enter your password"
                required
                autoComplete="current-password"
                className="w-full bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-700 rounded-nest pl-11 pr-10 py-3 text-slate-900 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 focus:border-weaver-purple focus:ring-1 focus:ring-weaver-purple outline-none transition-all"
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
            <div className="flex justify-end mt-2">
              <Link to="/forgot-password" className="text-sm font-medium text-nest-blue hover:text-nest-accent dark:hover:text-nest-accent transition-colors">
                Forgot your password?
              </Link>
            </div>
          </div>

          {/* Submit */}
          <button
            type="submit"
            disabled={isLoading}
            className="w-full bg-gradient-to-r from-weaver-purple to-weaver-orange hover:opacity-90 disabled:bg-none disabled:bg-slate-300 dark:disabled:bg-slate-700 disabled:cursor-not-allowed text-white font-bold py-3.5 rounded-nest shadow-lg shadow-weaver-purple/25 transition-all mt-6 active:scale-[0.98]"
          >
            {isLoading ? 'Weaving your session…' : 'Sign In'}
          </button>
        </form>

        {/* Toggle */}
        <div className="text-sm text-slate-600 dark:text-slate-300 text-center mt-6">
          Don&apos;t have an account?{' '}
          <Link
            to="/signup"
            className="text-nest-blue dark:text-nest-accent font-bold hover:underline"
          >
            Sign Up
          </Link>
        </div>
      </div>
    </div>
  )
}

export default LoginPage
