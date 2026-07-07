import { useEffect, useState } from 'react'
import {
  collection,
  query,
  orderBy,
  getDocs,
  doc,
  updateDoc,
  where,
  writeBatch,
} from 'firebase/firestore'
import { db } from '@/firebase/config'
import {
  AlertCircle,
  CheckCircle2,
  Archive,
  Ban,
  Clock,
  User,
  Home,
  MessageSquare,
  Users,
  Check,
  ShieldAlert,
} from 'lucide-react'
import toast from 'react-hot-toast'
import { formatTimeAgo } from '@/utils/formatters'

interface ReportDoc {
  id: string
  reportedId: string
  reportedBy: string
  reportedName?: string
  type: 'user' | 'listing' | 'match' | 'chat'
  reason: string
  description?: string
  status: 'pending' | 'under_review' | 'resolved' | 'archived'
  createdAt: any
}

export default function ModerationPage() {
  const [reports, setReports] = useState<ReportDoc[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [actionLoading, setActionLoading] = useState<string | null>(null)
  
  // Status filter state
  const [activeTab, setActiveTab] = useState<'pending' | 'under_review' | 'resolved' | 'archived'>('pending')

  const fetchReports = async () => {
    try {
      setLoading(true)
      setError(null)
      const q = query(
        collection(db, 'reports'),
        where('status', '==', activeTab),
        orderBy('createdAt', 'desc')
      )
      const snap = await getDocs(q)
      setReports(
        snap.docs.map((d) => {
          const data = d.data()
          return {
            id: d.id,
            reportedId: data.reportedId || data.reportedUserId || '',
            reportedBy: data.reportedBy || '',
            reportedName: data.reportedName || '',
            type: data.type || 'user',
            reason: data.reason || '',
            description: data.description || '',
            status: data.status || 'pending',
            createdAt: data.createdAt,
          } as ReportDoc
        })
      )
    } catch (err: any) {
      console.error('Failed to fetch reports:', err)
      setError('Could not load moderation queue. Verify permissions.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchReports()
  }, [activeTab])

  // Update report status (resolved, under_review, archived)
  const handleUpdateStatus = async (id: string, newStatus: ReportDoc['status']) => {
    try {
      setActionLoading(id)
      await updateDoc(doc(db, 'reports', id), { status: newStatus })
      toast.success(`Report marked as ${newStatus.replace('_', ' ')}`)
      await fetchReports()
    } catch (err) {
      console.error(err)
      toast.error('Failed to update report status')
    } finally {
      setActionLoading(null)
    }
  }

  // Ban User / Deactivate Listing action
  const handleTakeAction = async (report: ReportDoc) => {
    const isListing = report.type === 'listing'
    const confirmMessage = isListing
      ? `CRITICAL ACTION: Are you sure you want to deactivate/pause listing ${report.reportedId}?`
      : `CRITICAL ACTION: Are you sure you want to ban user ${report.reportedId}?`

    if (!window.confirm(confirmMessage)) return

    try {
      setActionLoading(report.id)
      const batch = writeBatch(db)

      if (isListing) {
        // Deactivate listing
        batch.update(doc(db, 'listings', report.reportedId), { status: 'paused' })
      } else {
        // Ban user profile
        batch.update(doc(db, 'profiles', report.reportedId), { status: 'banned' })
        
        // Also pause any listings they have posted
        const lSnap = await getDocs(
          query(collection(db, 'listings'), where('hostId', '==', report.reportedId))
        )
        lSnap.docs.forEach((lDoc) => {
          batch.update(doc(db, 'listings', lDoc.id), { status: 'paused' })
        })
      }

      // Mark the report as resolved
      batch.update(doc(db, 'reports', report.id), { status: 'resolved' })

      await batch.commit()
      toast.success(
        isListing
          ? 'Listing paused and report resolved.'
          : 'User banned, associated listings paused, and report resolved.'
      )
      await fetchReports()
    } catch (err) {
      console.error(err)
      toast.error('Failed to execute moderation action.')
    } finally {
      setActionLoading(null)
    }
  }

  const getReportTypeIcon = (type: ReportDoc['type']) => {
    switch (type) {
      case 'user':
        return <User className="w-4 h-4 text-blue-500" />
      case 'listing':
        return <Home className="w-4 h-4 text-orange-500" />
      case 'match':
        return <Users className="w-4 h-4 text-pink-500" />
      case 'chat':
        return <MessageSquare className="w-4 h-4 text-emerald-500" />
      default:
        return <ShieldAlert className="w-4 h-4 text-slate-500" />
    }
  }

  const getTabCount = () => reports.length

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-syne font-bold text-slate-900 dark:text-slate-50 flex items-center gap-2">
            <ShieldAlert className="w-8 h-8 text-amber-500" />
            Moderation Command Center
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Review user reports, escalate to investigation, and enforce platform governance policies.
          </p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-slate-200 dark:border-slate-800">
        {(['pending', 'under_review', 'resolved', 'archived'] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`py-3 px-4 sm:px-6 font-syne font-bold text-sm border-b-2 transition-all capitalize ${
              activeTab === tab
                ? 'border-brand-600 text-brand-600 dark:border-brand-400 dark:text-brand-400'
                : 'border-transparent text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
            }`}
          >
            {tab.replace('_', ' ')}
            {activeTab === tab && (
              <span className="ml-2 px-1.5 py-0.5 text-xs bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 rounded-md">
                {getTabCount()}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Report Cards / Workspace */}
      {error ? (
        <div className="flex flex-col items-center justify-center p-12 text-center bg-white dark:bg-slate-900 border border-red-200 dark:border-red-900/50 rounded-2xl">
          <AlertCircle className="w-12 h-12 text-red-500 mb-4" />
          <h3 className="text-xl font-syne font-bold text-slate-900 dark:text-slate-50 mb-2">
            Workspace Offline
          </h3>
          <p className="text-slate-500">{error}</p>
          <button
            onClick={fetchReports}
            className="mt-4 px-4 py-2 bg-slate-100 dark:bg-slate-800 rounded-xl text-sm font-medium"
          >
            Retry Connection
          </button>
        </div>
      ) : loading ? (
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="h-44 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl animate-pulse"
            />
          ))}
        </div>
      ) : reports.length === 0 ? (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-16 text-center flex flex-col items-center justify-center">
          <div className="w-16 h-16 bg-emerald-50 dark:bg-emerald-500/10 rounded-full flex items-center justify-center mb-4">
            <CheckCircle2 className="w-8 h-8 text-emerald-500" />
          </div>
          <h3 className="text-xl font-bold font-syne text-slate-900 dark:text-slate-50 mb-2">
            No Reports Here
          </h3>
          <p className="text-slate-500 dark:text-slate-400 text-sm max-w-sm">
            Everything is calm in this sector. No reports match the selected status category.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {reports.map((report) => (
            <div
              key={report.id}
              className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800/80 rounded-3xl p-6 shadow-sm hover:shadow-md transition-all"
            >
              <div className="flex flex-col lg:flex-row justify-between gap-6">
                <div className="space-y-4 flex-1">
                  {/* Card Header Info */}
                  <div className="flex items-center flex-wrap gap-2 text-xs">
                    <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-full font-bold uppercase tracking-wider bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                      {getReportTypeIcon(report.type)}
                      {report.type}
                    </span>
                    <span className="text-slate-400 dark:text-slate-500">•</span>
                    <span className="text-slate-500 dark:text-slate-400 flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5" />
                      {report.createdAt ? formatTimeAgo(report.createdAt.toDate()) : 'Recently'}
                    </span>
                    <span className="text-slate-400 dark:text-slate-500">•</span>
                    <span className="text-slate-500 dark:text-slate-400">
                      ID: <span className="font-mono bg-slate-50 dark:bg-slate-850 px-1 py-0.5 rounded">{report.reportedId}</span>
                    </span>
                  </div>

                  {/* Body Content */}
                  <div>
                    <h4 className="text-sm font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest text-[10px]">
                      Reason
                    </h4>
                    <p className="text-slate-900 dark:text-slate-50 font-bold mt-1 text-base">
                      {report.reason}
                    </p>
                  </div>

                  {report.description && (
                    <div>
                      <h4 className="text-sm font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest text-[10px]">
                        Additional Details
                      </h4>
                      <p className="text-slate-650 dark:text-slate-300 mt-1 text-sm bg-slate-50/50 dark:bg-slate-800/40 p-3 rounded-2xl border border-slate-100 dark:border-white/5">
                        {report.description}
                      </p>
                    </div>
                  )}

                  {/* Metadata */}
                  <div className="flex items-center gap-4 text-xs text-slate-400 dark:text-slate-500 pt-3 border-t border-slate-100 dark:border-slate-800">
                    <span>
                      Reporter ID:{' '}
                      <span className="font-mono text-slate-600 dark:text-slate-400">
                        {report.reportedBy}
                      </span>
                    </span>
                    {report.reportedName && (
                      <>
                        <span>•</span>
                        <span>
                          Target Name:{' '}
                          <span className="font-bold text-slate-600 dark:text-slate-350">
                            {report.reportedName}
                          </span>
                        </span>
                      </>
                    )}
                  </div>
                </div>

                {/* Card Actions Panel */}
                <div className="flex flex-row lg:flex-col items-center lg:items-end justify-start lg:justify-center gap-3 shrink-0 self-stretch border-t lg:border-t-0 lg:border-l border-slate-100 dark:border-slate-800 pt-4 lg:pt-0 lg:pl-6">
                  {/* Action 1: Status Flow */}
                  {report.status === 'pending' && (
                    <button
                      onClick={() => handleUpdateStatus(report.id, 'under_review')}
                      disabled={actionLoading !== null}
                      className="px-4 py-2 text-xs font-bold rounded-xl text-slate-700 bg-slate-100 hover:bg-slate-200 dark:text-slate-300 dark:bg-slate-800 dark:hover:bg-slate-700 transition-colors disabled:opacity-50 flex items-center gap-1.5"
                    >
                      <Clock className="w-3.5 h-3.5 text-amber-500" />
                      Investigate
                    </button>
                  )}

                  {/* Action 2: Resolve */}
                  {report.status !== 'resolved' && (
                    <button
                      onClick={() => handleUpdateStatus(report.id, 'resolved')}
                      disabled={actionLoading !== null}
                      className="px-4 py-2 text-xs font-bold rounded-xl text-white bg-emerald-600 hover:bg-emerald-700 transition-colors shadow-sm disabled:opacity-50 flex items-center gap-1.5"
                    >
                      <Check className="w-3.5 h-3.5" />
                      Resolve
                    </button>
                  )}

                  {/* Action 3: Archive */}
                  {report.status !== 'archived' && (
                    <button
                      onClick={() => handleUpdateStatus(report.id, 'archived')}
                      disabled={actionLoading !== null}
                      className="px-4 py-2 text-xs font-bold rounded-xl text-slate-700 bg-slate-100 hover:bg-slate-200 dark:text-slate-350 dark:bg-slate-800 dark:hover:bg-slate-750 transition-colors disabled:opacity-50 flex items-center gap-1.5"
                    >
                      <Archive className="w-3.5 h-3.5 text-slate-500" />
                      Archive Log
                    </button>
                  )}

                  {/* Action 4: Take Critical Enforcing Action */}
                  {report.status !== 'resolved' && report.status !== 'archived' && (
                    <button
                      onClick={() => handleTakeAction(report)}
                      disabled={actionLoading !== null}
                      className="px-4 py-2 text-xs font-bold rounded-xl text-white bg-red-650 hover:bg-red-700 transition-colors shadow-sm disabled:opacity-50 flex items-center gap-1.5"
                    >
                      <Ban className="w-3.5 h-3.5" />
                      {report.type === 'listing' ? 'Pause Listing' : 'Ban User'}
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
