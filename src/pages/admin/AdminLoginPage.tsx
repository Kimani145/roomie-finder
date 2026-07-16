import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { doc, getDoc } from 'firebase/firestore'
import { signInWithEmailAndPassword, signOut } from 'firebase/auth'
import { auth, db } from '@/firebase/config'
import { logger } from '@/utils/logger'
import { fetchWithAuth } from '@/services/apiClient'
import { auditService } from '@/services/auditService'
import { ShieldAlert, Loader2, ArrowRight } from 'lucide-react'

const AdminLoginPage: React.FC = () => {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const navigate = useNavigate()

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setLoading(true)

    try {
      // 1. Authenticate with Firebase Auth
      const { user } = await signInWithEmailAndPassword(auth, email, password)

      // 2. Validate Administrator Identity
      const adminDocRef = doc(db, 'admins', user.uid)
      const adminDocSnap = await getDoc(adminDocRef)

      if (!adminDocSnap.exists()) {
        // Not an administrator
        await auditService.log({
          action: 'failed_login',
          actorUid: user.uid,
          targetEmail: email,
          details: { reason: 'not_an_administrator' },
        })
        await signOut(auth)
        throw new Error('Access denied. This portal is for authorized administrators only.')
      }

      const adminData = adminDocSnap.data()

      if (adminData.status === 'disabled') {
        await auditService.log({
          action: 'failed_login',
          actorUid: user.uid,
          targetEmail: email,
          details: { reason: 'account_disabled' },
        })
        await signOut(auth)
        throw new Error('Administrator access has been revoked.')
      }

      // 3. Success -> Log Audit Trail & Send Alert
      await auditService.log({
        action: 'login',
        actorUid: user.uid,
        targetEmail: email,
      })

      // Send a login alert (fail-safe logic so we don't crash the login flow if it fails)
      fetchWithAuth('/communications/send', {
        method: 'POST',
        body: JSON.stringify({
          type: 'admin_login_alert',
          to: email,
          payload: {
            browser: navigator.userAgent,
            time: new Date().toLocaleString()
          }
        })
      }).catch(err => logger.error('Failed to send admin login alert', err))

      // 4. Redirect to 2FA or Dashboard (handled by AdminRoute)
      navigate('/admin', { replace: true })
    } catch (err: any) {
      logger.error('Admin Login Error:', err)
      setError(err.message || 'Invalid email or password.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-slate-900 flex flex-col items-center justify-center p-4">
      <div className="mb-8 text-center">
        <h1 className="text-3xl font-bold font-syne text-white mb-2">Roomie Finder</h1>
        <p className="text-slate-400 font-medium tracking-widest uppercase text-sm">Restricted Portal</p>
      </div>

      <div className="bg-slate-800 p-8 rounded-2xl shadow-xl border border-slate-700 max-w-md w-full">
        <div className="flex items-center justify-center w-12 h-12 rounded-full bg-slate-700/50 mb-6 border border-slate-600">
          <ShieldAlert className="w-6 h-6 text-brand-400" />
        </div>

        <h2 className="text-xl font-bold text-white mb-6">Administrator Sign In</h2>

        {error && (
          <div className="bg-red-500/10 border border-red-500/20 text-red-400 p-4 rounded-xl mb-6 text-sm">
            {error}
          </div>
        )}

        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">
              Administrator Email
            </label>
            <input
              type="email"
              required
              value={email}
              onChange={e => setEmail(e.target.value)}
              className="w-full px-4 py-3 rounded-xl border border-slate-600 bg-slate-900 text-white focus:ring-2 focus:ring-brand-500 focus:border-transparent outline-none transition-all placeholder:text-slate-500"
              placeholder="admin@tukenya.ac.ke"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">
              Password
            </label>
            <input
              type="password"
              required
              value={password}
              onChange={e => setPassword(e.target.value)}
              className="w-full px-4 py-3 rounded-xl border border-slate-600 bg-slate-900 text-white focus:ring-2 focus:ring-brand-500 focus:border-transparent outline-none transition-all"
              placeholder="••••••••"
            />
          </div>
          
          <button
            type="submit"
            disabled={loading || !email || !password}
            className="w-full py-3 bg-brand-500 hover:bg-brand-600 text-white rounded-xl font-medium transition-colors disabled:opacity-50 flex justify-center items-center mt-6"
          >
            {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : (
              <>Sign In <ArrowRight className="w-4 h-4 ml-2" /></>
            )}
          </button>
        </form>
      </div>
      
      <div className="mt-8 text-center text-sm text-slate-500">
        <p>This system is for authorized personnel only.</p>
        <p>All activities are monitored and logged.</p>
      </div>
    </div>
  )
}

export default AdminLoginPage
