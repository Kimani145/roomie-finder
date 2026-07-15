import React, { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { auth, db } from '@/firebase/config'
import { useAuthStore } from '@/store/authStore'
import { collection, query, where, getDocs, orderBy, limit } from 'firebase/firestore'
import { CheckCircle2, AlertTriangle, ShieldCheck, LogOut, ArrowLeft, Loader2, Hourglass, HelpCircle } from 'lucide-react'
import { toast } from 'react-hot-toast'
import { logger } from '@/utils/logger'

export const AppealStatusPage: React.FC = () => {
  const { currentUser, clearAuth } = useAuthStore()
  const navigate = useNavigate()
  const [appeal, setAppeal] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  const fetchAppeal = async () => {
    if (!currentUser) return
    try {
      setLoading(true)
      const q = query(
        collection(db, 'appeals'),
        where('userId', '==', currentUser.uid),
        orderBy('createdAt', 'desc'),
        limit(1)
      )
      const snap = await getDocs(q)
      if (!snap.empty) {
        setAppeal({ id: snap.docs[0].id, ...snap.docs[0].data() })
      }
    } catch (err) {
      logger.error('Failed to load appeal:', err)
      toast.error('Failed to retrieve appeal status.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchAppeal()
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

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center text-slate-100">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="w-8 h-8 text-brand-500 animate-spin" />
          <span className="text-sm font-medium text-slate-400">Loading appeal records...</span>
        </div>
      </div>
    )
  }

  if (!appeal) {
    return (
      <div className="min-h-screen bg-slate-900 flex flex-col items-center justify-center p-6 text-center text-slate-100">
        <AlertTriangle className="w-12 h-12 text-amber-500 mb-4" />
        <h1 className="text-xl font-syne font-bold">No Active Appeal Found</h1>
        <p className="text-sm text-slate-400 max-w-sm mt-2 mb-6">
          You currently have no submitted appeals. If your account is restricted, please file an appeal from the suspension notice.
        </p>
        <button
          onClick={() => navigate('/suspended')}
          className="px-6 py-2.5 bg-brand-600 hover:bg-brand-700 text-white font-bold rounded-xl transition-all"
        >
          View Suspension Details
        </button>
      </div>
    )
  }

  const steps = [
    {
      key: 'submitted',
      title: 'Appeal Submitted',
      description: 'Your request was recorded and queued for administrative review.',
      time: appeal.createdAt,
      isActive: true,
      isDone: true,
    },
    {
      key: 'under_review',
      title: 'Under Administrative Review',
      description: 'A Trust & Safety team member is evaluating your case details, original reports, and evidence.',
      time: appeal.status !== 'submitted' ? appeal.updatedAt : null,
      isActive: appeal.status !== 'submitted',
      isDone: appeal.status === 'approved' || appeal.status === 'rejected' || appeal.status === 'under_review',
    },
    {
      key: 'decision',
      title: appeal.status === 'approved' ? 'Appeal Approved' : appeal.status === 'rejected' ? 'Appeal Rejected' : 'Final Decision',
      description: appeal.status === 'approved' 
        ? 'Your appeal was approved and full access has been restored.' 
        : appeal.status === 'rejected' 
        ? 'Following a full review, the suspension is upheld. You can read the decision details below.'
        : 'The final decision will be posted here once the review concludes.',
      time: appeal.status === 'approved' || appeal.status === 'rejected' ? appeal.updatedAt : null,
      isActive: appeal.status === 'approved' || appeal.status === 'rejected',
      isDone: appeal.status === 'approved' || appeal.status === 'rejected',
    },
  ]

  const formatStepDate = (timestamp: any) => {
    if (!timestamp) return ''
    if (timestamp.toDate && typeof timestamp.toDate === 'function') {
      return timestamp.toDate().toLocaleString()
    }
    return new Date(timestamp).toLocaleString()
  }

  return (
    <div className="min-h-screen bg-slate-900 flex flex-col items-center justify-center p-6 text-slate-100 font-sans">
      <div className="max-w-md w-full bg-slate-800 rounded-3xl border border-slate-700/60 p-8 shadow-2xl space-y-6">
        
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-700/50 pb-4">
          <button
            onClick={() => navigate('/suspended')}
            className="flex items-center gap-1.5 text-xs font-bold text-slate-400 hover:text-slate-200 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Dashboard</span>
          </button>
          <div className="flex items-center gap-2 text-brand-400">
            <Hourglass className="w-5 h-5 animate-pulse" />
            <h1 className="font-syne font-bold text-lg text-slate-50">
              Appeal Tracking
            </h1>
          </div>
        </div>

        {/* Appeal Info Header */}
        <div className="bg-slate-900/40 rounded-2xl p-4 border border-slate-850 text-xs grid grid-cols-2 gap-4">
          <div>
            <span className="block text-slate-500 font-bold uppercase tracking-wider">Appeal ID</span>
            <span className="text-slate-300 font-mono block mt-0.5">{appeal.id}</span>
          </div>
          <div>
            <span className="block text-slate-500 font-bold uppercase tracking-wider">Current Status</span>
            <span className={`font-semibold block mt-0.5 capitalize ${
              appeal.status === 'approved' ? 'text-emerald-400' : appeal.status === 'rejected' ? 'text-red-400' : 'text-amber-400'
            }`}>
              {appeal.status.replace('_', ' ')}
            </span>
          </div>
        </div>

        {/* Timeline */}
        <div className="relative border-l border-slate-700/80 ml-4 space-y-6 py-2">
          {steps.map((step, idx) => {
            const isApproved = appeal.status === 'approved'
            const isRejected = appeal.status === 'rejected'
            
            let colorClass = 'bg-slate-700 text-slate-500 border-slate-800'
            if (step.isDone) {
              if (step.key === 'decision' && isRejected) {
                colorClass = 'bg-red-500/20 text-red-500 border-red-500/30'
              } else if (step.key === 'decision' && isApproved) {
                colorClass = 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30'
              } else {
                colorClass = 'bg-brand-500/20 text-brand-400 border-brand-500/30'
              }
            } else if (step.isActive) {
              colorClass = 'bg-amber-500/20 text-amber-400 border-amber-500/30 animate-pulse'
            }

            return (
              <div key={idx} className="relative pl-8 text-left">
                {/* Bullet */}
                <div className={`absolute -left-[13px] top-0.5 w-6 h-6 rounded-full border flex items-center justify-center ${colorClass}`}>
                  {step.key === 'decision' && isApproved ? (
                    <ShieldCheck className="w-3.5 h-3.5" />
                  ) : step.key === 'decision' && isRejected ? (
                    <AlertTriangle className="w-3.5 h-3.5" />
                  ) : (
                    <CheckCircle2 className="w-3.5 h-3.5" />
                  )}
                </div>
                
                {/* Content */}
                <div className="space-y-1">
                  <h4 className={`text-sm font-bold ${step.isActive ? 'text-slate-100' : 'text-slate-400'}`}>
                    {step.title}
                  </h4>
                  <p className="text-xs text-slate-400 leading-relaxed">
                    {step.description}
                  </p>
                  {step.time && (
                    <span className="text-[10px] text-slate-500 font-medium block pt-1">
                      {formatStepDate(step.time)}
                    </span>
                  )}
                </div>
              </div>
            )
          })}
        </div>

        {/* Administrator's Explanation Notes */}
        {(appeal.status === 'approved' || appeal.status === 'rejected') && appeal.decisionNotes && (
          <div className="bg-slate-900/50 rounded-2xl p-4 border border-slate-700/40 text-left space-y-2">
            <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">
              Moderator Explanation Notes
            </h4>
            <p className="text-xs text-slate-300 leading-relaxed italic">
              &ldquo;{appeal.decisionNotes}&rdquo;
            </p>
          </div>
        )}

        {/* Support disclaimer if rejected */}
        {appeal.status === 'rejected' && (
          <div className="flex items-start gap-2 bg-slate-900/25 p-4 rounded-xl border border-red-500/10 text-[11px] text-slate-400">
            <HelpCircle className="w-4 h-4 text-red-400 shrink-0" />
            <p className="leading-relaxed">
              If you have further questions or require policy documentation regarding this final decision, please email <strong className="text-slate-350">support@students.tukenya.ac.ke</strong>.
            </p>
          </div>
        )}

        {/* Actions CTAs */}
        <div className="flex flex-col gap-3 pt-2">
          {appeal.status === 'approved' && (
            <button
              onClick={() => {
                // Perform local state reload or reload browser to reset auth flow
                window.location.reload()
              }}
              className="w-full h-12 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl transition-all flex items-center justify-center gap-2"
            >
              <span>Access Application</span>
            </button>
          )}

          <button
            onClick={handleSignOut}
            className="w-full h-12 border border-slate-700 hover:bg-slate-750 text-slate-400 hover:text-slate-300 font-bold rounded-xl transition-all flex items-center justify-center gap-2"
          >
            <LogOut className="w-4 h-4" />
            <span>Sign Out</span>
          </button>
        </div>

      </div>
    </div>
  )
}

export default AppealStatusPage
