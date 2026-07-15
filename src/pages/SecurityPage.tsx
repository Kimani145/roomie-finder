import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { sendPasswordResetEmail } from 'firebase/auth'
import { doc, updateDoc, deleteDoc } from 'firebase/firestore'
import { auth, db } from '@/firebase/config'
import { useAuth } from '@/hooks/useAuth'
import { useAuthStore } from '@/store/authStore'
import { log2faAuditEvent } from '@/services/twoFactorService'
import { CommunicationService } from '@/services/communications/CommunicationService'
import { logger } from '@/utils/logger'

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
  const navigate = useNavigate()

  const [toggling2fa, setToggling2fa] = useState(false)
  const [resettingPassword, setResettingPassword] = useState(false)
  const [pwResetSent, setPwResetSent] = useState(false)

  // Account Deletion States
  const [deletingAccount, setDeletingAccount] = useState(false)
  const [deleteConfirmation, setDeleteConfirmation] = useState('')
  const [showDeleteModal, setShowDeleteModal] = useState(false)

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

      // Send Security Alert Email
      await CommunicationService.sendSecurityAlert(
        userEmail,
        `Two-Step Verification (2FA) has been successfully ${newValue ? 'enabled' : 'disabled'} on your Roomie Finder account.`,
        {
          browser: navigator.userAgent,
          device: navigator.platform || 'Web App',
        },
        currentUser.displayName?.split(' ')[0]
      )

      toast.success(
        newValue
          ? 'Two-factor authentication enabled successfully!'
          : 'Two-factor authentication disabled.'
      )
    } catch (err: any) {
      logger.error('Failed to toggle 2FA.')
      toast.error('Failed to update two-factor setting. Please try again.')
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

      const isEmulator = import.meta.env.VITE_USE_EMULATOR === 'true'
      const projectId = import.meta.env.VITE_FIREBASE_PROJECT_ID

      if (isEmulator && projectId) {
        try {
          await new Promise((resolve) => setTimeout(resolve, 800))
          const response = await fetch(`http://127.0.0.1:9099/emulator/v1/projects/${projectId}/oobCodes`)
          if (response.ok) {
            const data = await response.json()
            const latestCode = data.oobCodes
              ?.filter((c: any) => c.email === userEmail && c.requestType === 'PASSWORD_RESET')
              ?.sort((a: any, b: any) => (b.timestamp || 0) - (a.timestamp || 0))[0]

            if (latestCode?.oobLink) {
              const res = await CommunicationService.sendPasswordReset(
                userEmail,
                undefined,
                latestCode.oobLink,
                currentUser?.displayName?.split(' ')[0]
              )
              if (!res.success) {
                throw new Error(res.error)
              }
              setPwResetSent(true)
              toast.success('Password reset email sent (Resend Delivery)!')
              return
            }
          }
        } catch (err: any) {
          logger.warn('Failed to intercept reset link from emulator.')
        }
      }

      // Production / Fallback: trigger custom log / security alert
      await CommunicationService.sendSecurityAlert(
        userEmail,
        'A password reset request was initiated for your Roomie Finder account. If you did not request this, please secure your account credentials immediately.',
        {
          browser: navigator.userAgent,
          device: navigator.platform || 'Web App',
        },
        currentUser?.displayName?.split(' ')[0]
      )

      setPwResetSent(true)
      toast.success('Password reset email sent!')
    } catch (err: any) {
      logger.error('Failed to send password reset email.')
      toast.error('Unable to send password reset email. Please try again shortly.')
    } finally {
      setResettingPassword(false)
    }
  }

  // Handle Account Deletion
  const handleDeleteAccount = async () => {
    if (!user || deleteConfirmation.toLowerCase() !== 'delete my account') {
      toast.error("Please type 'DELETE MY ACCOUNT' to confirm.")
      return
    }
    setDeletingAccount(true)
    try {
      // 1. Delete Firestore profile document
      await deleteDoc(doc(db, 'profiles', user.uid))
      // 2. Delete Auth user account
      await user.delete()
      
      toast.success('Your account has been deleted successfully.')
      // 3. Clear local state and redirect to landing
      setCurrentUser(null)
      navigate('/')
    } catch (err: any) {
      logger.error('Failed to delete account.')
      if (err.code === 'auth/requires-recent-login') {
        toast.error('For security reasons, you must re-authenticate (log out and log back in) before deleting your account.')
      } else {
        toast.error('Failed to delete account. Please try again.')
      }
    } finally {
      setDeletingAccount(false)
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

        {/* Danger Zone: Account Deletion */}
        <section className="bg-red-50 dark:bg-red-950/10 rounded-3xl border border-red-200 dark:border-red-500/20 p-6 shadow-sm">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 bg-red-100 dark:bg-red-500/10 text-red-600 dark:text-red-400 rounded-2xl flex items-center justify-center shrink-0">
              <AlertCircle className="w-6 h-6" />
            </div>
            <div className="flex-1">
              <h3 className="text-lg font-bold text-red-900 dark:text-red-200">
                Danger Zone: Delete Account
              </h3>
              <p className="text-sm text-red-700/80 dark:text-red-400/80 mt-1 max-w-xl">
                Permanently delete your profile, listings, matches, and chats. This action is irreversible.
              </p>
              
              {!showDeleteModal ? (
                <button
                  onClick={() => setShowDeleteModal(true)}
                  className="mt-4 px-4 py-2 bg-red-600 hover:bg-red-700 text-white text-xs font-bold rounded-xl transition-all"
                >
                  Delete My Account
                </button>
              ) : (
                <div className="mt-4 p-4 border border-red-200 dark:border-red-500/20 rounded-2xl bg-white dark:bg-slate-900/60 max-w-md">
                  <p className="text-xs text-slate-600 dark:text-slate-400 font-medium mb-3">
                    To confirm deletion, please type <span className="font-bold text-red-600 dark:text-red-400">DELETE MY ACCOUNT</span> below:
                  </p>
                  <input
                    type="text"
                    value={deleteConfirmation}
                    onChange={(e) => setDeleteConfirmation(e.target.value)}
                    placeholder="DELETE MY ACCOUNT"
                    className="w-full px-3 py-2 text-sm border border-red-300 dark:border-red-500/30 rounded-xl bg-transparent dark:text-slate-100 mb-3 focus:outline-none focus:ring-1 focus:ring-red-500"
                  />
                  <div className="flex gap-2">
                    <button
                      onClick={handleDeleteAccount}
                      disabled={deletingAccount || deleteConfirmation.toLowerCase() !== 'delete my account'}
                      className="px-4 py-2 bg-red-600 hover:bg-red-700 disabled:opacity-50 text-white text-xs font-bold rounded-xl transition-all inline-flex items-center gap-1.5"
                    >
                      {deletingAccount && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                      Permanently Delete
                    </button>
                    <button
                      onClick={() => {
                        setShowDeleteModal(false)
                        setDeleteConfirmation('')
                      }}
                      className="px-4 py-2 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 text-xs font-bold rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800 transition-all"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </section>

      </div>
    </div>
  )
}
