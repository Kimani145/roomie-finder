import React, { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { auth, db } from '@/firebase/config'
import { useAuthStore } from '@/store/authStore'
import { AlertOctagon, LogOut, ArrowRight, ShieldAlert, Clock } from 'lucide-react'
import { collection, query, where, getDocs, orderBy, limit } from 'firebase/firestore'
import { toast } from 'react-hot-toast'
import { logger } from '@/utils/logger'

export const SuspensionPage: React.FC = () => {
  const { currentUser, clearAuth } = useAuthStore()
  const navigate = useNavigate()
  const [latestAppeal, setLatestAppeal] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchLatestAppeal = async () => {
      if (!currentUser) return
      try {
        const q = query(
          collection(db, 'appeals'),
          where('userId', '==', currentUser.uid),
          orderBy('createdAt', 'desc'),
          limit(1)
        )
        const snap = await getDocs(q)
        if (!snap.empty) {
          const docData = snap.docs[0].data()
          setLatestAppeal({ id: snap.docs[0].id, ...docData })
        }
      } catch (err) {
        logger.error('Failed to fetch appeal history:', err)
      } finally {
        setLoading(false)
      }
    }
    fetchLatestAppeal()
  }, [currentUser])

  const handleSignOut = async () => {
    try {
      await auth.signOut()
      clearAuth()
      toast.success('Signed out successfully.')
      navigate('/login')
    } catch (err) {
      logger.error('Sign out error:', err)
      toast.error('Failed to sign out.')
    }
  }

  // Formatting date safely
  const formatSuspensionDate = (dateVal: any) => {
    if (!dateVal) return 'Recently'
    if (dateVal.toDate && typeof dateVal.toDate === 'function') {
      return dateVal.toDate().toLocaleDateString(undefined, {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      })
    }
    return new Date(dateVal).toLocaleDateString()
  }

  const suspensionReason = currentUser?.suspensionReason || 'Violation of community safety policies.'
  const suspensionDate = currentUser?.suspensionDate

  return (
    <div className="min-h-screen bg-slate-900 flex flex-col items-center justify-center p-6 text-slate-100 font-sans">
      <div className="max-w-md w-full bg-slate-800 rounded-3xl border border-slate-700/60 p-8 shadow-2xl space-y-6 text-center animate-in fade-in zoom-in-95 duration-200">
        
        {/* Brand/Status Header */}
        <div className="flex flex-col items-center gap-3">
          <div className="w-16 h-16 bg-red-500/10 text-red-500 rounded-2xl flex items-center justify-center">
            <AlertOctagon className="w-9 h-9" />
          </div>
          <h1 className="font-syne text-2xl font-bold text-slate-50 mt-2">
            Account Restricted
          </h1>
          <p className="text-sm text-slate-400">
            Roomie Finder Governance System
          </p>
        </div>

        {/* Informative message */}
        <div className="text-left bg-slate-900/50 rounded-2xl p-5 border border-slate-700/40 space-y-4">
          <div>
            <h4 className="text-xs font-bold text-slate-500 uppercase tracking-widest">
              Suspension Details
            </h4>
            <p className="text-slate-350 text-sm mt-1 leading-relaxed">
              Following an administrative review of reports associated with your profile, this account has been suspended for violating our platform safety guidelines.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-4 pt-3 border-t border-slate-800 text-xs">
            <div>
              <span className="block text-slate-500 font-bold uppercase tracking-wider">Date Effective</span>
              <span className="text-slate-300 font-semibold mt-0.5 block">
                {formatSuspensionDate(suspensionDate)}
              </span>
            </div>
            <div>
              <span className="block text-slate-500 font-bold uppercase tracking-wider">Status</span>
              <span className="text-red-400 font-semibold mt-0.5 block capitalize">
                Suspended
              </span>
            </div>
          </div>

          <div className="pt-3 border-t border-slate-800">
            <span className="block text-xs text-slate-500 font-bold uppercase tracking-wider mb-1">Reason for Decision</span>
            <p className="text-xs text-slate-300 italic leading-relaxed">
              &ldquo;{suspensionReason}&rdquo;
            </p>
          </div>
        </div>

        {/* Appeal Information Section */}
        {!loading && (
          <div className="bg-slate-900/30 rounded-2xl p-4 border border-slate-800 flex items-center justify-between text-left gap-3">
            <div className="flex items-center gap-3">
              <Clock className="w-5 h-5 text-brand-400" />
              <div>
                <span className="block text-xs font-bold text-slate-400">Appeal Status</span>
                <span className="text-xs text-slate-300 mt-0.5 block font-semibold capitalize">
                  {latestAppeal ? latestAppeal.status.replace('_', ' ') : 'No appeal submitted'}
                </span>
              </div>
            </div>
            {latestAppeal && (
              <button
                onClick={() => navigate('/appeal-status')}
                className="text-xs font-bold text-brand-400 hover:text-brand-300 flex items-center gap-1 transition-colors"
              >
                View Status <ArrowRight className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        )}

        {/* Actions CTA */}
        <div className="flex flex-col gap-3">
          {(!latestAppeal || latestAppeal.status === 'rejected') && (
            <button
              onClick={() => navigate('/appeal')}
              className="w-full h-12 bg-brand-600 hover:bg-brand-700 text-white font-bold rounded-xl transition-all shadow-lg shadow-brand-600/10 flex items-center justify-center gap-2"
            >
              <ShieldAlert className="w-5 h-5" />
              <span>Submit Appeal</span>
            </button>
          )}

          {latestAppeal && latestAppeal.status === 'submitted' && (
            <button
              onClick={() => navigate('/appeal-status')}
              className="w-full h-12 border border-slate-700 hover:bg-slate-700 text-slate-200 font-bold rounded-xl transition-all flex items-center justify-center gap-2"
            >
              <span>Track Active Appeal</span>
            </button>
          )}

          <button
            onClick={handleSignOut}
            className="w-full h-12 border border-dashed border-slate-700 hover:border-slate-650 hover:bg-slate-750/30 text-slate-400 hover:text-slate-300 font-bold rounded-xl transition-all flex items-center justify-center gap-2"
          >
            <LogOut className="w-4 h-4" />
            <span>Sign Out</span>
          </button>
        </div>

      </div>
    </div>
  )
}

export default SuspensionPage
