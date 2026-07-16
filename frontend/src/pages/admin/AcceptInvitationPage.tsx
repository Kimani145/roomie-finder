import React, { useEffect, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { doc, getDoc, setDoc, updateDoc } from 'firebase/firestore'
import { createUserWithEmailAndPassword } from 'firebase/auth'
import { db, auth } from '@/firebase/config'
import { ShieldCheck, Loader2 } from 'lucide-react'
import toast from 'react-hot-toast'
import { logger } from '@/utils/logger'

const AcceptInvitationPage: React.FC = () => {
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const token = searchParams.get('token')

  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [invitation, setInvitation] = useState<any>(null)

  const [password, setPassword] = useState('')
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    if (!token) {
      setError('Invalid or missing invitation token.')
      setLoading(false)
      return
    }

    const fetchInvitation = async () => {
      try {
        const docRef = doc(db, 'admin_invitations', token)
        const docSnap = await getDoc(docRef)

        if (!docSnap.exists()) {
          setError('Invitation not found.')
        } else if (docSnap.data().status !== 'pending') {
          setError('This invitation has already been accepted or is no longer valid.')
        } else {
          setInvitation(docSnap.data())
        }
      } catch (err) {
        logger.error('Error fetching invitation:', err)
        setError('Failed to verify invitation.')
      } finally {
        setLoading(false)
      }
    }

    fetchInvitation()
  }, [token])

  const handleAccept = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!token || !invitation || password.length < 8) return

    try {
      setSubmitting(true)
      
      // 1. Create Firebase Auth account
      const { user } = await createUserWithEmailAndPassword(auth, invitation.email, password)

      // 2. Create the admins document securely using the token
      await setDoc(doc(db, 'admins', user.uid), {
        email: invitation.email,
        systemRole: invitation.role,
        status: 'active',
        token: token, // This satisfies the security rule to allow creation
        activatedAt: new Date(),
        twoFactorEnabled: false
      })

      // 3. Mark invitation as accepted
      await updateDoc(doc(db, 'admin_invitations', token), {
        status: 'accepted'
      })

      toast.success('Account activated successfully!')
      
      // Redirect to the new admin 2FA setup flow
      navigate('/admin/setup-2fa', { replace: true })
    } catch (err: any) {
      logger.error('Failed to accept invitation:', err)
      toast.error(err.message || 'Failed to activate account.')
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-900 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-brand-500" />
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-900 flex items-center justify-center p-4">
        <div className="bg-white dark:bg-slate-800 p-8 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 max-w-md w-full text-center">
          <div className="w-16 h-16 bg-red-100 text-red-500 rounded-full flex items-center justify-center mx-auto mb-6">
            <ShieldCheck className="w-8 h-8" />
          </div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">Access Denied</h1>
          <p className="text-slate-600 dark:text-slate-400 mb-6">{error}</p>
          <button
            onClick={() => navigate('/login')}
            className="text-brand-500 font-medium hover:text-brand-600"
          >
            Return to Login
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900 flex flex-col items-center justify-center p-4">
      <div className="mb-8 text-center">
        <h1 className="text-3xl font-bold font-syne text-slate-900 dark:text-white mb-2">Roomie Finder</h1>
        <p className="text-slate-500 dark:text-slate-400">Secure Administrative Portal</p>
      </div>

      <div className="bg-white dark:bg-slate-800 p-8 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 max-w-md w-full">
        <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-6">Activate Admin Account</h2>
        <div className="bg-slate-50 dark:bg-slate-900/50 p-4 rounded-xl border border-slate-100 dark:border-slate-700/50 mb-6">
          <p className="text-sm text-slate-500 dark:text-slate-400">Email Address</p>
          <p className="font-medium text-slate-900 dark:text-white">{invitation?.email}</p>
        </div>

        <form onSubmit={handleAccept} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
              Set Password
            </label>
            <input
              type="password"
              required
              minLength={8}
              value={password}
              onChange={e => setPassword(e.target.value)}
              className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:ring-2 focus:ring-brand-500 focus:border-transparent outline-none transition-all"
              placeholder="Minimum 8 characters"
            />
          </div>
          
          <button
            type="submit"
            disabled={submitting || password.length < 8}
            className="w-full py-3 bg-brand-500 hover:bg-brand-600 text-white rounded-xl font-medium transition-colors disabled:opacity-50"
          >
            {submitting ? 'Activating...' : 'Activate & Continue to 2FA'}
          </button>
        </form>
      </div>
    </div>
  )
}

export default AcceptInvitationPage
