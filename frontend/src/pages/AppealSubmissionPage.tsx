import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { db } from '@/firebase/config'
import { collection, addDoc, serverTimestamp } from 'firebase/firestore'
import { useAuthStore } from '@/store/authStore'
import { ShieldAlert, ArrowLeft, Send, Upload, HelpCircle, Loader2 } from 'lucide-react'
import { toast } from 'react-hot-toast'

import { createNotification } from '@/firebase/notifications'
import { logger } from '@/utils/logger'

export const AppealSubmissionPage: React.FC = () => {
  const { currentUser } = useAuthStore()
  const navigate = useNavigate()

  const [reason, setReason] = useState('')
  const [explanation, setExplanation] = useState('')
  const [evidenceName, setEvidenceName] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  const suspensionReason = currentUser?.suspensionReason || 'Violation of community safety policies.'
  const suspensionDate = currentUser?.suspensionDate

  // Format date safely
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

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      setEvidenceName(file.name)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!currentUser) return

    if (!reason.trim()) {
      toast.error('Please enter a brief reason for appeal.')
      return
    }
    if (!explanation.trim()) {
      toast.error('Please provide a detailed explanation.')
      return
    }

    setSubmitting(true)
    try {
      // 1. Write appeal document to Firestore
      await addDoc(collection(db, 'appeals'), {
        userId: currentUser.uid,
        userName: currentUser.displayName || 'TUK Student',
        userEmail: currentUser.email || '',
        reason: reason.trim(),
        explanation: explanation.trim(),
        evidenceURL: evidenceName ? `placeholder://uploads/evidence/${evidenceName}` : null,
        status: 'submitted',
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        suspensionReason,
        suspensionDate: suspensionDate || null,
      })

      // 2. Log in-app notification
      await createNotification({
        recipientId: currentUser.uid,
        type: 'appeal',
        title: 'Appeal Submitted Successfully',
        body: 'We have received your appeal request. Our safety administrators will review it shortly.',
        link: '/appeal-status',
        senderId: 'system_trust_and_safety',
      })

      // 3. Email sending logic has been moved to the trusted backend.
      // A backend trigger or dedicated endpoint should handle the 'appeal_received' email.

      toast.success('Appeal submitted successfully!')
      navigate('/appeal-status')
    } catch (err: any) {
      logger.error('Failed to submit appeal:', err)
      toast.error(err.message || 'Failed to submit appeal. Please try again.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="min-h-screen bg-slate-900 flex flex-col items-center justify-center p-6 text-slate-100 font-sans">
      <div className="max-w-xl w-full bg-slate-800 rounded-3xl border border-slate-700/60 p-8 shadow-2xl space-y-6">
        
        {/* Navigation & Title */}
        <div className="flex items-center justify-between border-b border-slate-700/50 pb-4">
          <button
            onClick={() => navigate('/suspended')}
            className="flex items-center gap-1.5 text-xs font-bold text-slate-400 hover:text-slate-200 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Cancel</span>
          </button>
          <div className="flex items-center gap-2 text-brand-400">
            <ShieldAlert className="w-5 h-5" />
            <h1 className="font-syne font-bold text-lg text-slate-50">
              Submit Appeal
            </h1>
          </div>
        </div>

        {/* Current Suspension Details Display */}
        <div className="bg-slate-900/50 rounded-2xl p-4 border border-slate-700/40 text-xs space-y-3">
          <h3 className="font-bold text-slate-400 uppercase tracking-wider">
            Restricted Account Review
          </h3>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <span className="block text-slate-500 font-bold">Suspension Date</span>
              <span className="text-slate-300 font-semibold">{formatSuspensionDate(suspensionDate)}</span>
            </div>
            <div>
              <span className="block text-slate-500 font-bold">Status</span>
              <span className="text-red-400 font-semibold">Suspended</span>
            </div>
          </div>
          <div>
            <span className="block text-slate-500 font-bold">Suspension Reason</span>
            <p className="text-slate-300 italic mt-0.5">&ldquo;{suspensionReason}&rdquo;</p>
          </div>
          <div className="pt-2 border-t border-slate-800 flex items-center gap-1.5 text-[10px] text-slate-400">
            <HelpCircle className="w-3.5 h-3.5 text-brand-400" />
            <span>Expected review response: <strong>3-5 business days</strong></span>
          </div>
        </div>

        {/* Submission Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Reason for Appeal */}
          <div className="space-y-1.5">
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-450">
              Reason for Appeal
            </label>
            <input
              type="text"
              required
              disabled={submitting}
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="e.g., Inaccurate report, misunderstanding with roommate, etc."
              className="w-full h-11 px-3 bg-slate-900 border border-slate-700 rounded-xl text-slate-100 placeholder-slate-500 focus:border-brand-600 focus:ring-2 focus:ring-brand-600/10 outline-none transition-all text-sm"
            />
          </div>

          {/* Explanation */}
          <div className="space-y-1.5">
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-450">
              Detailed Explanation
            </label>
            <textarea
              required
              disabled={submitting}
              value={explanation}
              onChange={(e) => setExplanation(e.target.value)}
              placeholder="Please describe why this suspension should be reviewed. Provide as much relevant detail and context as possible..."
              className="w-full min-h-[140px] p-3 bg-slate-900 border border-slate-700 rounded-xl text-slate-100 placeholder-slate-500 focus:border-brand-600 focus:ring-2 focus:ring-brand-600/10 outline-none transition-all text-sm resize-none"
            />
          </div>

          {/* Optional Evidence File Upload */}
          <div className="space-y-1.5">
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-450">
              Supporting Evidence (Optional)
            </label>
            <div className="relative border border-dashed border-slate-700 rounded-xl p-4 bg-slate-900 hover:bg-slate-750 transition-colors flex items-center justify-center">
              <input
                type="file"
                disabled={submitting}
                onChange={handleFileChange}
                className="absolute inset-0 opacity-0 cursor-pointer"
              />
              <div className="flex flex-col items-center gap-1 text-center">
                <Upload className="w-5 h-5 text-slate-400" />
                <span className="text-xs text-slate-300 font-semibold">
                  {evidenceName || 'Attach relevant logs, photos, or screenshots'}
                </span>
                <span className="text-[10px] text-slate-500">PDF, PNG, JPG up to 10MB</span>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-4 pt-2">
            <button
              type="button"
              disabled={submitting}
              onClick={() => navigate('/suspended')}
              className="flex-1 h-12 border border-slate-750 hover:bg-slate-750 text-slate-350 font-bold rounded-xl transition-all text-sm"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="flex-1 h-12 bg-brand-600 hover:bg-brand-700 disabled:opacity-50 text-white font-bold rounded-xl transition-all text-sm flex items-center justify-center gap-2"
            >
              {submitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Submitting...</span>
                </>
              ) : (
                <>
                  <Send className="w-4 h-4" />
                  <span>Submit Appeal</span>
                </>
              )}
            </button>
          </div>
        </form>

      </div>
    </div>
  )
}

export default AppealSubmissionPage
