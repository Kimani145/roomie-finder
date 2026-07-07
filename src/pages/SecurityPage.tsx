import { useState } from 'react'
import { sendPasswordResetEmail } from 'firebase/auth'
import { doc, updateDoc } from 'firebase/firestore'
import { auth, db } from '@/firebase/config'
import { useAuth } from '@/hooks/useAuth'
import { useAuthStore } from '@/store/authStore'
import { log2faAuditEvent } from '@/services/twoFactorService'
import {
  Shield,
  Mail,
  Lock,
  Smartphone,
  Key,
  Laptop,
  CheckCircle,
  AlertCircle,
  Loader2,
} from 'lucide-react'
import { toast } from 'react-hot-toast'

export default function SecurityPage() {
  const { user } = useAuth()
  const { currentUser, setCurrentUser } = useAuthStore()

  const [toggling2fa, setToggling2fa] = useState(false)
  const [resettingPassword, setResettingPassword] = useState(false)
  const [pwResetSent, setPwResetSent] = useState(false)

  const userEmail = user?.email || ''
  const isEmailVerified = user?.emailVerified ?? false
  const is2faEnabled = currentUser?.twoFactorEnabled ?? false

  // Handle 2FA Toggle
  const handleToggle2fa = async () => {
    if (!currentUser || toggling2fa) return
    setToggling2fa(true)

    const newValue = !is2faEnabled

    try {
      const profileRef = doc(db, 'profiles', currentUser.uid)
      await updateDoc(profileRef, {
        twoFactorEnabled: newValue,
      })

      // Update local store state
      setCurrentUser({
        ...currentUser,
        twoFactorEnabled: newValue,
      })

      // Log audit event
      await log2faAuditEvent(
        currentUser.uid,
        userEmail,
        newValue ? '2fa_enabled' : '2fa_disabled'
      )

      toast.success(
        newValue
          ? 'Two-factor authentication enabled successfully!'
          : 'Two-factor authentication disabled.'
      )
    } catch (err: any) {
      console.error('Failed to toggle 2FA:', err)
      toast.error(err.message || 'Failed to update two-factor setting.')
    } finally {
      setToggling2fa(false)
    }
  }

  // Handle Password Reset Request
  const handlePasswordReset = async () => {
    if (!userEmail || resettingPassword) return
    setResettingPassword(true)

    try {
      await sendPasswordResetEmail(auth, userEmail)
      setPwResetSent(true)
      toast.success('Password reset email sent!')
    } catch (err: any) {
      console.error('Failed to send password reset email:', err)
      toast.error(err.message || 'Failed to request password reset.')
    } finally {
      setResettingPassword(false)
    }
  }

  return (
    <div className="max-w-4xl mx-auto py-8 px-4 sm:px-6">
      
      {/* Page Header */}
      <div className="mb-8">
        <h1 className="font-syne text-3xl font-black text-slate-900 dark:text-slate-50 mb-2">
          Security Settings
        </h1>
        <p className="text-sm text-slate-500 dark:text-slate-400">
          Manage your account protection, two-step verification, and active sessions.
        </p>
      </div>

      <div className="space-y-6">
        
        {/* Two-Factor Authentication Section */}
        <section className="bg-white dark:bg-slate-800 rounded-3xl border border-slate-200 dark:border-white/10 p-6 shadow-sm">
          <div className="flex items-start gap-4 justify-between flex-wrap sm:flex-nowrap">
            <div className="flex gap-3">
              <div className="w-12 h-12 bg-brand-50 dark:bg-brand-500/10 text-brand-600 dark:text-brand-400 rounded-2xl flex items-center justify-center shrink-0">
                <Shield className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-slate-900 dark:text-slate-50">
                  Two-Step Verification (2FA)
                </h3>
                <p className="text-sm text-slate-500 dark:text-slate-400 mt-1 max-w-xl">
                  Add an extra layer of security. Every time you log in to Roomie Finder, we will send a secure six-digit verification code to your email.
                </p>
                <div className="flex items-center gap-2 mt-3">
                  <span
                    className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold ${
                      is2faEnabled
                        ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-500/20 dark:text-emerald-400'
                        : 'bg-slate-100 text-slate-600 dark:bg-slate-700 dark:text-slate-400'
                    }`}
                  >
                    <span className={`w-1.5 h-1.5 rounded-full ${is2faEnabled ? 'bg-emerald-500' : 'bg-slate-400'}`} />
                    {is2faEnabled ? 'Enabled' : 'Disabled'}
                  </span>
                </div>
              </div>
            </div>

            {/* Toggle Switch */}
            <div className="flex items-center shrink-0 self-center sm:self-start">
              <button
                onClick={handleToggle2fa}
                disabled={toggling2fa}
                className={`relative inline-flex h-7 w-14 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-brand-600/25 ${
                  is2faEnabled ? 'bg-brand-600' : 'bg-slate-200 dark:bg-slate-700'
                }`}
                aria-label="Toggle Two Factor Authentication"
              >
                {toggling2fa ? (
                  <span className="absolute left-1 top-1 text-slate-500 dark:text-slate-400 animate-spin">
                    <Loader2 className="w-4 h-4" />
                  </span>
                ) : (
                  <span
                    className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                      is2faEnabled ? 'translate-x-7' : 'translate-x-0'
                    }`}
                  />
                )}
              </button>
            </div>
          </div>
        </section>

        {/* Account Authentication & Status */}
        <section className="bg-white dark:bg-slate-800 rounded-3xl border border-slate-200 dark:border-white/10 p-6 shadow-sm space-y-6">
          <h3 className="text-lg font-bold text-slate-900 dark:text-slate-50 border-b border-slate-100 dark:border-white/5 pb-3">
            Account Status & Credentials
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Email Verification Status */}
            <div className="flex items-start gap-4">
              <div className="w-10 h-10 bg-slate-100 dark:bg-slate-700/50 text-slate-600 dark:text-slate-400 rounded-xl flex items-center justify-center shrink-0">
                <Mail className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-sm font-bold text-slate-900 dark:text-slate-50">Email Address</h4>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">{userEmail}</p>
                <div className="flex items-center gap-1.5 mt-2">
                  {isEmailVerified ? (
                    <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-600 dark:text-emerald-400">
                      <CheckCircle className="w-3.5 h-3.5" />
                      Verified student email
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 text-[11px] font-bold text-amber-600 dark:text-amber-400">
                      <AlertCircle className="w-3.5 h-3.5" />
                      Pending verification
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* Change Password */}
            <div className="flex items-start gap-4">
              <div className="w-10 h-10 bg-slate-100 dark:bg-slate-700/50 text-slate-600 dark:text-slate-400 rounded-xl flex items-center justify-center shrink-0">
                <Lock className="w-5 h-5" />
              </div>
              <div className="flex-1">
                <h4 className="text-sm font-bold text-slate-900 dark:text-slate-50">Change Password</h4>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  Update your credentials by requesting a secure verification link.
                </p>
                <button
                  onClick={handlePasswordReset}
                  disabled={resettingPassword || pwResetSent}
                  className="mt-3 px-4 py-2 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700/50 text-slate-700 dark:text-slate-300 text-xs font-bold rounded-xl transition-all disabled:opacity-50"
                >
                  {resettingPassword ? (
                    <span className="flex items-center gap-1">
                      <Loader2 className="w-3 h-3 animate-spin" />
                      Sending...
                    </span>
                  ) : pwResetSent ? (
                    'Check your Email!'
                  ) : (
                    'Request Reset Link'
                  )}
                </button>
              </div>
            </div>
          </div>
        </section>

        {/* Future Extensible Authentication Methods (Authenticator App & Passkeys) */}
        <section className="bg-white dark:bg-slate-800 rounded-3xl border border-slate-200 dark:border-white/10 p-6 shadow-sm space-y-6">
          <div>
            <h3 className="text-lg font-bold text-slate-900 dark:text-slate-50">
              Additional Authentication Options
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              Add hardware or app-based keys to streamline sign-ins and increase account security.
            </p>
          </div>

          <div className="space-y-4">
            {/* TOTP Authenticator App */}
            <div className="flex items-center justify-between p-4 rounded-2xl border border-dashed border-slate-200 dark:border-white/10 bg-slate-50/50 dark:bg-slate-900/30">
              <div className="flex gap-3">
                <div className="w-10 h-10 bg-slate-100 dark:bg-slate-700/40 text-slate-500 dark:text-slate-400 rounded-xl flex items-center justify-center shrink-0">
                  <Smartphone className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-slate-900 dark:text-slate-50 flex items-center gap-2">
                    Authenticator App
                    <span className="bg-brand-100 text-brand-800 dark:bg-brand-500/10 dark:text-brand-400 text-[9px] font-black uppercase px-2 py-0.5 rounded">
                      Coming Soon
                    </span>
                  </h4>
                  <p className="text-xs text-slate-400 dark:text-slate-500 mt-0.5">
                    Generate verification codes via Authy, Google Authenticator, or Microsoft Authenticator.
                  </p>
                </div>
              </div>
              <button
                disabled
                className="px-4 py-2 bg-slate-100 dark:bg-slate-800 text-slate-400 dark:text-slate-600 text-xs font-bold rounded-xl cursor-not-allowed"
              >
                Set Up
              </button>
            </div>

            {/* Passkeys */}
            <div className="flex items-center justify-between p-4 rounded-2xl border border-dashed border-slate-200 dark:border-white/10 bg-slate-50/50 dark:bg-slate-900/30">
              <div className="flex gap-3">
                <div className="w-10 h-10 bg-slate-100 dark:bg-slate-700/40 text-slate-500 dark:text-slate-400 rounded-xl flex items-center justify-center shrink-0">
                  <Key className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-slate-900 dark:text-slate-50 flex items-center gap-2">
                    Passkeys & Security Keys
                    <span className="bg-brand-100 text-brand-800 dark:bg-brand-500/10 dark:text-brand-400 text-[9px] font-black uppercase px-2 py-0.5 rounded">
                      Coming Soon
                    </span>
                  </h4>
                  <p className="text-xs text-slate-400 dark:text-slate-500 mt-0.5">
                    Use biometric authentication (Touch ID, Face ID, Windows Hello) or physical YubiKeys.
                  </p>
                </div>
              </div>
              <button
                disabled
                className="px-4 py-2 bg-slate-100 dark:bg-slate-800 text-slate-400 dark:text-slate-600 text-xs font-bold rounded-xl cursor-not-allowed"
              >
                Configure
              </button>
            </div>
          </div>
        </section>

        {/* Active Sessions */}
        <section className="bg-white dark:bg-slate-800 rounded-3xl border border-slate-200 dark:border-white/10 p-6 shadow-sm space-y-4">
          <div>
            <h3 className="text-lg font-bold text-slate-900 dark:text-slate-50">
              Active Sessions
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              Devices currently signed in to your Roomie Finder account.
            </p>
          </div>

          <div className="space-y-3">
            <div className="flex items-center justify-between p-4 rounded-2xl border border-slate-100 dark:border-white/5 bg-slate-50/50 dark:bg-slate-900/30">
              <div className="flex gap-3">
                <div className="w-10 h-10 bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 rounded-xl flex items-center justify-center shrink-0">
                  <Laptop className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-slate-900 dark:text-slate-50">
                    Chrome on Linux (Ubuntu)
                    <span className="ml-2 bg-emerald-100 text-emerald-800 dark:bg-emerald-500/20 dark:text-emerald-400 text-[9px] font-extrabold uppercase px-1.5 py-0.5 rounded-full">
                      Current Session
                    </span>
                  </h4>
                  <p className="text-xs text-slate-400 dark:text-slate-500 mt-0.5">
                    Nairobi, Kenya &bull; IP: 197.248.88.*
                  </p>
                </div>
              </div>
              <span className="text-xs font-semibold text-slate-400 dark:text-slate-500">
                Active now
              </span>
            </div>

            <div className="flex items-center justify-between p-4 rounded-2xl border border-slate-100 dark:border-white/5 bg-slate-50/30 dark:bg-slate-900/10 opacity-70">
              <div className="flex gap-3">
                <div className="w-10 h-10 bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 rounded-xl flex items-center justify-center shrink-0">
                  <Laptop className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-slate-900 dark:text-slate-50">
                    Firefox on Windows 11
                  </h4>
                  <p className="text-xs text-slate-400 dark:text-slate-500 mt-0.5">
                    Nairobi, Kenya &bull; IP: 197.248.88.*
                  </p>
                </div>
              </div>
              <span className="text-xs font-semibold text-slate-400 dark:text-slate-500">
                Logged out &bull; 2 hours ago
              </span>
            </div>
          </div>
        </section>

      </div>
    </div>
  )
}
