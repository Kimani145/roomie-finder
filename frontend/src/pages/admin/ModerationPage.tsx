import { useEffect, useState } from 'react'
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
  Eye,
  RefreshCw,
  X,
} from 'lucide-react'
import toast from 'react-hot-toast'
import { formatDistanceToNow } from 'date-fns'
import { fetchWithAuth } from '@/services/apiClient'
import { logger } from '@/utils/logger'
import { ConfirmationModal } from '@/components/ui/ConfirmationModal'

interface ReportDoc {
  id: string
  reportedId: string
  reportedBy: string
  reportedName?: string
  reportedUser?: {
    uid: string
    name: string
    email: string
    role: string
    avatar?: string
  }
  reporterUser?: {
    uid: string
    name: string
    email: string
    role: string
    avatar?: string
  }
  type: 'user' | 'listing' | 'match' | 'chat'
  reason: string
  description?: string
  status: 'pending' | 'under_review' | 'resolved' | 'archived'
  assignedAdminUid?: string | null
  createdAt?: string | null
  updatedAt?: string | null
}

export default function ModerationPage() {
  const [reports, setReports] = useState<ReportDoc[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [actionLoading, setActionLoading] = useState<string | null>(null)
  
  // Status filter state
  const [activeTab, setActiveTab] = useState<'pending' | 'under_review' | 'resolved' | 'archived'>('pending')
  
  // Evidence drawer state
  const [inspectReport, setInspectReport] = useState<ReportDoc | null>(null)

  // Confirmation modal state
  const [confirmModal, setConfirmModal] = useState<{
    isOpen: boolean
    title: string
    displayName: string
    actionSummary: string
    confirmText: string
    variant: 'danger' | 'success'
    onConfirm: () => Promise<void>
  }>({
    isOpen: false,
    title: '',
    displayName: '',
    actionSummary: '',
    confirmText: '',
    variant: 'danger',
    onConfirm: async () => {},
  })

  const fetchReports = async () => {
    try {
      setLoading(true)
      setError(null)
      const data = await fetchWithAuth(`/api/v1/admin/reports?status=${activeTab}`)
      setReports(data.reports || [])
    } catch (err: any) {
      logger.error('Failed to fetch reports:', err)
      setError('Could not load moderation queue via backend API. Verify permissions.')
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
      await fetchWithAuth(`/api/v1/admin/reports/${id}/status`, {
        method: 'PUT',
        body: JSON.stringify({ status: newStatus }),
      })
      toast.success(`Report marked as ${newStatus.replace('_', ' ')}`)
      await fetchReports()
    } catch (err) {
      logger.error('Error:', err)
      toast.error('Failed to update report status')
    } finally {
      setActionLoading(null)
    }
  }

  // Ban User / Deactivate Listing action
  const triggerAction = (report: ReportDoc) => {
    const isListing = report.type === 'listing'
    const actionType = isListing ? 'pause_listing' : 'ban_user'
    const targetTitle = isListing ? `Listing ${report.reportedId.slice(0, 8)}` : (report.reportedName || `User ${report.reportedId.slice(0, 8)}`)

    setConfirmModal({
      isOpen: true,
      title: isListing ? 'Pause Reported Listing' : 'Ban Reported User',
      displayName: targetTitle,
      actionSummary: isListing
        ? `Are you sure you want to pause listing ${targetTitle}? It will be hidden from public discovery and marked as paused.`
        : `Are you sure you want to ban ${targetTitle}? Access to Roomie Finder will be revoked immediately and all their listings will be paused.`,
      confirmText: isListing ? 'Pause Listing' : 'Ban User',
      variant: 'danger',
      onConfirm: async () => {
        try {
          setActionLoading(report.id)
          await fetchWithAuth(`/api/v1/admin/reports/${report.id}/action`, {
            method: 'POST',
            body: JSON.stringify({ actionType, targetId: report.reportedId }),
          })
          toast.success(
            isListing
              ? 'Listing paused and report marked as resolved.'
              : 'User banned, associated listings paused, and report resolved.'
          )
          await fetchReports()
        } catch (err) {
          logger.error('Error:', err)
          toast.error('Failed to execute moderation enforcement action.')
        } finally {
          setActionLoading(null)
          setConfirmModal((prev) => ({ ...prev, isOpen: false }))
        }
      },
    })
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

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-syne font-bold text-slate-900 dark:text-slate-50 flex items-center gap-2">
            <ShieldAlert className="w-8 h-8 text-amber-500" />
            Moderation Command Center
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Review user reports, assign investigations, and execute backend-authoritative governance.
          </p>
        </div>
        <button
          onClick={fetchReports}
          className="inline-flex items-center gap-2 px-4 py-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-sm font-semibold rounded-xl transition-colors self-start sm:self-auto"
        >
          <RefreshCw className="w-4 h-4" />
          Refresh Feed
        </button>
      </div>

      {/* Status Tabs */}
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
                {reports.length}
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
          <p className="text-slate-500 mb-4">{error}</p>
          <button
            onClick={fetchReports}
            className="px-4 py-2 bg-brand-600 hover:bg-brand-700 text-white rounded-xl text-sm font-semibold transition-colors"
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
            No Reports In Queue
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
                      {report.createdAt ? formatDistanceToNow(new Date(report.createdAt), { addSuffix: true }) : 'Recently'}
                    </span>
                    <span className="text-slate-400 dark:text-slate-500">•</span>
                    <span className="text-slate-500 dark:text-slate-400">
                      Target ID: <span className="font-mono bg-slate-50 dark:bg-slate-800 px-1 py-0.5 rounded">{report.reportedId}</span>
                    </span>
                  </div>

                  {/* Body Content */}
                  <div>
                    <h4 className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest">
                      Reason
                    </h4>
                    <p className="text-slate-900 dark:text-slate-50 font-bold mt-1 text-base">
                      {report.reason}
                    </p>
                  </div>

                  {report.description && (
                    <div>
                      <h4 className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest">
                        Additional Details
                      </h4>
                      <p className="text-slate-700 dark:text-slate-300 mt-1 text-sm bg-slate-50/50 dark:bg-slate-800/40 p-3 rounded-2xl border border-slate-100 dark:border-white/5">
                        {report.description}
                      </p>
                    </div>
                  )}

                  {/* Metadata */}
                  <div className="flex items-center gap-4 text-xs text-slate-400 dark:text-slate-500 pt-3 border-t border-slate-100 dark:border-slate-800">
                    <span>
                      Reporter ID:{' '}
                      <span className="font-mono text-slate-600 dark:text-slate-400">
                        {report.reportedBy.slice(0, 8)}...
                      </span>
                    </span>
                    {report.reportedName && (
                      <>
                        <span>•</span>
                        <span>
                          Target Name:{' '}
                          <span className="font-bold text-slate-600 dark:text-slate-300">
                            {report.reportedName}
                          </span>
                        </span>
                      </>
                    )}
                  </div>
                </div>

                {/* Card Actions Panel */}
                <div className="flex flex-row lg:flex-col items-center lg:items-end justify-start lg:justify-center gap-2.5 shrink-0 self-stretch border-t lg:border-t-0 lg:border-l border-slate-100 dark:border-slate-800 pt-4 lg:pt-0 lg:pl-6">
                  {/* Action 0: Evidence Inspector */}
                  <button
                    onClick={() => setInspectReport(report)}
                    className="px-3.5 py-2 text-xs font-bold rounded-xl text-slate-700 bg-slate-100 hover:bg-slate-200 dark:text-slate-300 dark:bg-slate-800 dark:hover:bg-slate-700 transition-colors flex items-center gap-1.5"
                  >
                    <Eye className="w-3.5 h-3.5 text-blue-500" />
                    Inspect Evidence
                  </button>

                  {/* Action 1: Status Flow */}
                  {report.status === 'pending' && (
                    <button
                      onClick={() => handleUpdateStatus(report.id, 'under_review')}
                      disabled={actionLoading !== null}
                      className="px-3.5 py-2 text-xs font-bold rounded-xl text-slate-700 bg-slate-100 hover:bg-slate-200 dark:text-slate-300 dark:bg-slate-800 dark:hover:bg-slate-700 transition-colors disabled:opacity-50 flex items-center gap-1.5"
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
                      className="px-3.5 py-2 text-xs font-bold rounded-xl text-white bg-emerald-600 hover:bg-emerald-700 transition-colors shadow-sm disabled:opacity-50 flex items-center gap-1.5"
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
                      className="px-3.5 py-2 text-xs font-bold rounded-xl text-slate-700 bg-slate-100 hover:bg-slate-200 dark:text-slate-300 dark:bg-slate-800 dark:hover:bg-slate-700 transition-colors disabled:opacity-50 flex items-center gap-1.5"
                    >
                      <Archive className="w-3.5 h-3.5 text-slate-500" />
                      Archive
                    </button>
                  )}

                  {/* Action 4: Take Critical Enforcing Action */}
                  {report.status !== 'resolved' && report.status !== 'archived' && (
                    <button
                      onClick={() => triggerAction(report)}
                      disabled={actionLoading !== null}
                      className="px-3.5 py-2 text-xs font-bold rounded-xl text-white bg-red-600 hover:bg-red-700 transition-colors shadow-sm disabled:opacity-50 flex items-center gap-1.5"
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

      {/* Evidence Inspector Modal */}
      {inspectReport && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 max-w-xl w-full space-y-6 shadow-2xl relative">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-4">
              <h3 className="text-xl font-syne font-bold text-slate-900 dark:text-slate-50 flex items-center gap-2">
                <Eye className="w-5 h-5 text-blue-500" />
                Report Evidence Inspector
              </h3>
              <button
                onClick={() => setInspectReport(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4 text-sm">
              <div>
                <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">Report ID</span>
                <p className="font-mono text-slate-800 dark:text-slate-200 font-semibold">{inspectReport.id}</p>
              </div>

              <div>
                <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">Reported Subject</span>
                <div className="font-sans text-slate-800 dark:text-slate-200 bg-slate-100 dark:bg-slate-800 p-3 rounded-xl mt-1">
                  <p className="font-bold text-slate-900 dark:text-slate-50">
                    {inspectReport.reportedUser?.name || inspectReport.reportedName || inspectReport.reportedId}
                  </p>
                  {inspectReport.reportedUser?.email && (
                    <p className="text-xs text-slate-500 font-mono mt-0.5">{inspectReport.reportedUser.email}</p>
                  )}
                  <p className="text-[10px] font-mono text-slate-400 mt-1">
                    Type: {inspectReport.type.toUpperCase()} | ID: {inspectReport.reportedId}
                  </p>
                </div>
              </div>

              <div>
                <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">Report Reason & Narrative</span>
                <p className="font-bold text-slate-900 dark:text-slate-100 mt-1">{inspectReport.reason}</p>
                {inspectReport.description && (
                  <p className="text-slate-600 dark:text-slate-300 mt-2 bg-slate-50 dark:bg-slate-800/60 p-3 rounded-xl border border-slate-100 dark:border-slate-800">
                    {inspectReport.description}
                  </p>
                )}
              </div>

              <div>
                <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">Reporter Identification</span>
                <p className="font-semibold text-slate-800 dark:text-slate-200 mt-1">
                  {inspectReport.reporterUser?.name || 'Verified Student'}
                </p>
                <p className="font-mono text-xs text-slate-500">{inspectReport.reporterUser?.email || inspectReport.reportedBy}</p>
              </div>
            </div>

            <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex justify-end">
              <button
                onClick={() => setInspectReport(null)}
                className="px-5 py-2.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 font-semibold text-slate-700 dark:text-slate-200 rounded-xl transition-colors text-sm"
              >
                Close Inspector
              </button>
            </div>
          </div>
        </div>
      )}

      <ConfirmationModal
        isOpen={confirmModal.isOpen}
        title={confirmModal.title}
        displayName={confirmModal.displayName}
        actionSummary={confirmModal.actionSummary}
        confirmText={confirmModal.confirmText}
        variant={confirmModal.variant}
        loading={actionLoading !== null}
        onConfirm={confirmModal.onConfirm}
        onCancel={() => setConfirmModal((prev) => ({ ...prev, isOpen: false }))}
      />
    </div>
  )
}
