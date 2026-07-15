import React, { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { ShieldAlert, ArrowLeft, RefreshCw, ShieldCheck } from 'lucide-react'
import { useAuth } from '@/hooks/useAuth'
import { useAuthStore } from '@/store/authStore'
import { generateAndSendOtp, verifyOtpCode } from '@/services/twoFactorService'
import { toast } from 'react-hot-toast'
import { doc, getDoc } from 'firebase/firestore'
import { db } from '@/firebase/config'
import { logger } from '@/utils/logger'

export default function Verify2faPage() {
  const navigate = useNavigate()
  const { user, logout } = useAuth()
  const set2faPending = useAuthStore((state) => state.set2faPending)

  const [otp, setOtp] = useState<string[]>(new Array(6).fill(''))
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [resending, setResending] = useState(false)
  const [success, setSuccess] = useState(false)
  const [cooldown, setCooldown] = useState(0)

  const inputRefs = useRef<(HTMLInputElement | null)[]>([])

  const userEmail = user?.email || ''
  
  // Mask email helper (e.g. jo***@students.tukenya.ac.ke)
  const maskedEmail = React.useMemo(() => {
    if (!userEmail) return ''
    const [local, domain] = userEmail.split('@')
    if (!local || !domain) return userEmail
    if (local.length <= 2) return `${local[0]}***@${domain}`
    return `${local.slice(0, 2)}***${local.slice(-1)}@${domain}`
  }, [userEmail])

  // Cooldown countdown timer
  useEffect(() => {
    if (cooldown <= 0) return
    const timer = setInterval(() => {
      setCooldown((prev) => prev - 1)
    }, 1000)
    return () => clearInterval(timer)
  }, [cooldown])

  // Initialize: generate OTP if there is no active unexpired one in Firestore
  useEffect(() => {
    if (!user || !user.email) return

    let isMounted = true

    const checkAndInitOtp = async () => {
      try {
        const otpRef = doc(db, 'otps', user.email!)
        const snap = await getDoc(otpRef)
        
        let needsNew = true
        if (snap.exists()) {
          const existing = snap.data()
          const expiresAt = existing.expiresAt?.toMillis() || 0
          if (Date.now() < expiresAt) {
            needsNew = false
          }
        }

        if (needsNew && isMounted) {
          setResending(true)
          await generateAndSendOtp(user.uid, user.email!, true)
          toast.success('Verification code sent to your email.')
          setCooldown(60)
        } else {
          toast.success('A valid code is already in your inbox. Please enter it below.')
        }
      } catch (err: any) {
        logger.error('2FA initialization failed.')
        if (isMounted) setError(err.message || 'Failed to initialize verification code.')
      } finally {
        if (isMounted) setResending(false)
      }
    }

    checkAndInitOtp()
    
    // Auto-focus first input
    setTimeout(() => {
      inputRefs.current[0]?.focus()
    }, 150)

    return () => {
      isMounted = false
    }
  }, [user])

  // Handle individual box typing
  const handleChange = (element: HTMLInputElement, index: number) => {
    const val = element.value
    if (isNaN(Number(val))) return // Only allow numbers

    const newOtp = [...otp]
    newOtp[index] = val.slice(-1) // Take the last character
    setOtp(newOtp)
    setError(null)

    // Shift focus forward
    if (val && index < 5) {
      inputRefs.current[index + 1]?.focus()
    }
  }

  // Handle backspace navigation
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>, index: number) => {
    if (e.key === 'Backspace') {
      if (!otp[index] && index > 0) {
        const newOtp = [...otp]
        newOtp[index - 1] = ''
        setOtp(newOtp)
        inputRefs.current[index - 1]?.focus()
      } else {
        const newOtp = [...otp]
        newOtp[index] = ''
        setOtp(newOtp)
      }
      setError(null)
    }
  }

  // Handle pasting the code
  const handlePaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault()
    const pastedData = e.clipboardData.getData('text').trim()
    if (!/^\d{6}$/.test(pastedData)) return // Ensure exactly 6 digits

    const digits = pastedData.split('')
    setOtp(digits)
    inputRefs.current[5]?.focus()
    setError(null)
  }

  // Handle verification
  const handleVerify = async (e?: React.FormEvent) => {
    if (e) e.preventDefault()
    const code = otp.join('')
    if (code.length < 6) {
      setError('Please enter all 6 digits of the code.')
      return
    }

    setError(null)
    setLoading(true)

    try {
      const res = await verifyOtpCode(user!.uid, user!.email!, code)
      if (res.success) {
        setSuccess(true)
        sessionStorage.setItem(`rf_2fa_verified_${user!.uid}`, 'true')
        
        toast.success(res.message)
        setTimeout(() => {
          set2faPending(false)
          navigate('/discover')
        }, 1500)
      } else {
        setError(res.message)
        setOtp(new Array(6).fill(''))
        inputRefs.current[0]?.focus()
      }
    } catch (err: any) {
      logger.error('Verification error occurred.')
      setError(err.message || 'An error occurred during verification. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  // Handle resending code
  const handleResend = async () => {
    if (cooldown > 0 || resending) return
    setError(null)
    setResending(true)

    try {
      await generateAndSendOtp(user!.uid, user!.email!, false)
      toast.success('A new verification code has been sent!')
      setCooldown(60)
      setOtp(new Array(6).fill(''))
      inputRefs.current[0]?.focus()
    } catch (err: any) {
      logger.error('Failed to resend verification code.')
      setError(err.message || 'Failed to resend code. Please try again.')
    } finally {
      setResending(false)
    }
  }

  const handleCancel = async () => {
    try {
      await logout()
      navigate('/login')
    } catch (err) {
      logger.error('Logout failed.')
    }
  }

  if (success) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-900 flex flex-col justify-center items-center p-6 text-center">
        <div className="bg-white dark:bg-slate-800 p-8 rounded-3xl border border-slate-200 dark:border-white/10 shadow-2xl max-w-md w-full flex flex-col items-center gap-6">
          <div className="w-20 h-20 bg-emerald-500/10 dark:bg-emerald-500/20 text-emerald-500 dark:text-emerald-400 rounded-full flex items-center justify-center animate-bounce">
            <ShieldCheck className="w-12 h-12" />
          </div>
          <div>
            <h1 className="font-syne text-2xl font-black text-slate-900 dark:text-slate-50 mb-2">
              Identity Verified
            </h1>
            <p className="text-sm text-slate-500 dark:text-slate-400">
              Welcome back to Roomie Finder. Redirecting you to matching dashboard...
            </p>
          </div>
          <div className="w-12 h-1.5 bg-slate-100 dark:bg-slate-700 rounded-full overflow-hidden relative">
            <div className="absolute top-0 left-0 bottom-0 bg-emerald-500 w-1/2 animate-[loading-bar_1.5s_ease-in-out_infinite]" style={{ width: '40%' }} />
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900 flex flex-col justify-center py-12 px-6 sm:px-8">
      <div className="max-w-md w-full mx-auto">
        <div className="bg-white dark:bg-slate-800 rounded-3xl border border-slate-200 dark:border-white/10 p-8 shadow-2xl flex flex-col gap-6 relative">
          
          {/* Header */}
          <div className="text-center">
            <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-brand-600/10 dark:bg-accent-dark/10">
              <ShieldAlert className="h-7 w-7 text-brand-600 dark:text-accent-dark animate-pulse" />
            </div>
            <h1 className="font-syne text-2xl font-bold text-slate-900 dark:text-slate-50 mb-2">
              Verify Your Identity
            </h1>
            <p className="text-sm text-slate-500 dark:text-slate-400 px-2">
              A verification code was sent to <strong className="text-slate-700 dark:text-slate-300 font-semibold">{maskedEmail}</strong>. Please enter the six-digit code to continue.
            </p>
          </div>

          {/* Error Banner */}
          {error && (
            <div className="flex items-center gap-3 rounded-xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-500/50 p-4 text-left">
              <span className="text-red-600 dark:text-red-400 font-semibold shrink-0">⚠️</span>
              <p className="text-xs font-semibold text-red-700 dark:text-red-200">{error}</p>
            </div>
          )}

          {/* Verification Code Input */}
          <form onSubmit={handleVerify} className="space-y-6">
            <div className="flex justify-between gap-2.5 sm:gap-3 justify-items-center">
              {otp.map((digit, idx) => (
                <input
                  key={idx}
                  type="text"
                  inputMode="numeric"
                  pattern="[0-9]*"
                  maxLength={1}
                  value={digit}
                  ref={(el) => {
                    inputRefs.current[idx] = el
                  }}
                  onChange={(e) => handleChange(e.target, idx)}
                  onKeyDown={(e) => handleKeyDown(e, idx)}
                  onPaste={idx === 0 ? handlePaste : undefined}
                  className="w-12 h-14 text-center text-2xl font-extrabold bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-slate-50 focus:border-brand-600 focus:ring-2 focus:ring-brand-600/20 outline-none transition-all"
                  disabled={loading || resending}
                  autoComplete="off"
                />
              ))}
            </div>

            {/* Buttons */}
            <div className="flex flex-col gap-3">
              <button
                type="submit"
                disabled={loading || resending || otp.some(d => !d)}
                className="w-full h-12 bg-brand-600 hover:bg-brand-700 dark:bg-accent-dark dark:hover:bg-accent-light text-white font-bold rounded-xl transition-colors flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed shadow-md"
              >
                {loading ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>Verifying...</span>
                  </>
                ) : (
                  <span>Verify Identity</span>
                )}
              </button>

              <button
                type="button"
                onClick={handleResend}
                disabled={cooldown > 0 || resending || loading}
                className="w-full h-12 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700/50 text-slate-700 dark:text-slate-300 font-bold rounded-xl transition-colors flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {resending ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>Sending code...</span>
                  </>
                ) : cooldown > 0 ? (
                  <span>Resend Code ({cooldown}s)</span>
                ) : (
                  <span>Resend Code</span>
                )}
              </button>
            </div>
          </form>

          {/* Footer controls */}
          <div className="border-t border-slate-100 dark:border-slate-700/60 pt-4 flex justify-center">
            <button
              onClick={handleCancel}
              className="text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200 text-xs font-bold flex items-center gap-1.5 transition-colors"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Back to Login / Sign Out</span>
            </button>
          </div>

        </div>
      </div>
    </div>
  )
}
