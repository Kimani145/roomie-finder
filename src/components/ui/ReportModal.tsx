import React, { useState } from 'react'
import { X, AlertTriangle, Upload, RefreshCw } from 'lucide-react'
import { db } from '@/firebase/config'
import { collection, addDoc, serverTimestamp } from 'firebase/firestore'
import { useAuthStore } from '@/store/authStore'
import { toast } from 'react-hot-toast'
import { logger } from '@/utils/logger'

interface ReportModalProps {
  isOpen: boolean
  onClose: () => void
  reportedId: string
  type: 'user' | 'listing' | 'match' | 'chat'
  reportedName?: string
}

const REASONS = [
  'Scam',
  'Fake Listing',
  'Harassment',
  'Spam',
  'Offensive Behaviour',
  'Impersonation',
  'Other',
]

export const ReportModal: React.FC<ReportModalProps> = ({
  isOpen,
  onClose,
  reportedId,
  type,
  reportedName,
}) => {
  const { currentUser } = useAuthStore()
  const [reason, setReason] = useState(REASONS[0])
  const [description, setDescription] = useState('')
  const [screenshotName, setScreenshotName] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  if (!isOpen) return null

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      setScreenshotName(file.name)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!currentUser) {
      toast.error('You must be signed in to submit a report.')
      return
    }

    setSubmitting(true)
    try {
      await addDoc(collection(db, 'reports'), {
        reporterId: currentUser.uid,
        reportedId,
        type,
        reason,
        description,
        screenshotURL: screenshotName ? `placeholder://uploads/${screenshotName}` : null,
        createdAt: serverTimestamp(),
        status: 'pending',
      })

      toast.success('Report submitted successfully. Our safety moderators will review it shortly.')
      
      // Reset & close
      setReason(REASONS[0])
      setDescription('')
      setScreenshotName(null)
      onClose()
    } catch (error: any) {
      logger.error('Failed to submit report:', error)
      toast.error(error.message || 'Failed to submit report. Please try again.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
      <div 
        className="bg-white dark:bg-slate-800 rounded-3xl border border-slate-200 dark:border-white/10 shadow-2xl max-w-md w-full overflow-hidden animate-in fade-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-700/60 flex items-center justify-between">
          <div className="flex items-center gap-2 text-red-600 dark:text-red-400">
            <AlertTriangle className="w-5 h-5" />
            <h3 className="font-syne font-bold text-lg text-slate-900 dark:text-white">
              Report {type === 'listing' ? 'Listing' : 'Student'}
            </h3>
          </div>
          <button 
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {reportedName && (
            <div className="text-xs text-slate-500 dark:text-slate-400 bg-slate-50 dark:bg-slate-900/50 p-3 rounded-xl">
              Target: <strong className="text-slate-800 dark:text-slate-200">{reportedName}</strong>
            </div>
          )}

          {/* Reason */}
          <div className="space-y-1.5">
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Reason for Report
            </label>
            <select
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              className="w-full h-11 px-3 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-slate-50 focus:border-brand-600 focus:ring-2 focus:ring-brand-600/10 outline-none transition-all text-sm"
              required
            >
              {REASONS.map((r) => (
                <option key={r} value={r}>
                  {r}
                </option>
              ))}
            </select>
          </div>

          {/* Optional Description */}
          <div className="space-y-1.5">
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Description (Optional)
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Provide more context about what happened..."
              className="w-full min-h-[100px] p-3 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-slate-50 focus:border-brand-600 focus:ring-2 focus:ring-brand-600/10 outline-none transition-all text-sm resize-none"
            />
          </div>

          {/* Screenshot Upload (Placeholder UI) */}
          <div className="space-y-1.5">
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Upload Screenshot (Optional)
            </label>
            <div className="relative flex items-center justify-center border-2 border-dashed border-slate-200 dark:border-slate-700 rounded-xl p-4 bg-slate-50 dark:bg-slate-900 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">
              <input
                type="file"
                accept="image/*"
                onChange={handleFileChange}
                className="absolute inset-0 opacity-0 cursor-pointer"
              />
              <div className="text-center flex flex-col items-center gap-1">
                <Upload className="w-5 h-5 text-slate-400" />
                <span className="text-xs text-slate-600 dark:text-slate-400 font-semibold">
                  {screenshotName || 'Click or drag photo here'}
                </span>
                <span className="text-[10px] text-slate-400">
                  PNG, JPG up to 5MB
                </span>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              disabled={submitting}
              className="flex-1 h-11 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-bold rounded-xl transition-all text-sm"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="flex-1 h-11 bg-red-600 hover:bg-red-700 text-white font-bold rounded-xl transition-all text-sm flex items-center justify-center gap-2"
            >
              {submitting ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>Submitting...</span>
                </>
              ) : (
                <span>Submit Report</span>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
