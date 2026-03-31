import React, { useEffect, useState } from 'react'
import { collection, query, orderBy, getDocs, doc, updateDoc } from 'firebase/firestore'
import { db } from '@/firebase/config'
import { AlertCircle, CheckCircle2, Loader2 } from 'lucide-react'
import toast from 'react-hot-toast'

interface ReportDoc {
  id: string
  reportedUserId: string
  reportedBy: string
  reason: string
  status: string
  createdAt: any
}

const ModerationPage: React.FC = () => {
  const [reports, setReports] = useState<ReportDoc[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [actionLoading, setActionLoading] = useState<string | null>(null)

  const fetchReports = async () => {
    try {
      setLoading(true)
      setError(null)
      const q = query(collection(db, 'reports'), orderBy('createdAt', 'desc'))
      const snap = await getDocs(q)
      setReports(snap.docs.map(d => ({ id: d.id, ...d.data() } as ReportDoc)))
    } catch (err: any) {
      console.error('Failed to fetch reports:', err)
      setError('Could not load moderation queue. Verify permissions.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchReports()
  }, [])

  const handleResolve = async (id: string) => {
    try {
      setActionLoading(id)
      await updateDoc(doc(db, 'reports', id), { status: 'resolved' })
      toast.success('Report resolved')
      await fetchReports()
    } catch (err) {
      console.error(err)
      toast.error('Failed to resolve report')
    } finally {
      setActionLoading(null)
    }
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center p-12 text-center bg-white dark:bg-slate-900 border border-red-200 dark:border-red-900/50 rounded-2xl">
        <AlertCircle className="w-12 h-12 text-red-500 mb-4" />
        <h3 className="text-xl font-syne font-bold text-slate-900 dark:text-slate-50 mb-2">Error Loading Data</h3>
        <p className="text-slate-500">{error}</p>
        <button onClick={fetchReports} className="mt-4 px-4 py-2 bg-slate-100 rounded-xl text-sm font-medium">Retry</button>
      </div>
    )
  }

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      <div>
        <h1 className="text-3xl font-syne font-bold text-slate-900 dark:text-slate-50">Moderation Queue</h1>
        <p className="text-slate-500 mt-1">Review user reports and actionable infractions.</p>
      </div>

      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden overflow-x-auto shadow-sm">
        <table className="w-full text-left text-sm whitespace-nowrap">
          <thead className="bg-slate-50 dark:bg-slate-800/50 text-slate-600 dark:text-slate-400 border-b border-slate-200 dark:border-slate-800 uppercase tracking-wider font-semibold text-[10px]">
            <tr>
              <th className="px-6 py-4">Date</th>
              <th className="px-6 py-4">Reporter</th>
              <th className="px-6 py-4">Accused</th>
              <th className="px-6 py-4 w-1/3">Reason</th>
              <th className="px-6 py-4">Status</th>
              <th className="px-6 py-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-slate-700 dark:text-slate-300">
            {loading ? (
              [...Array(5)].map((_, i) => (
                <tr key={i} className="animate-pulse">
                  <td className="px-6 py-4"><div className="h-4 bg-slate-200 dark:bg-slate-800 rounded w-20"></div></td>
                  <td className="px-6 py-4"><div className="h-4 bg-slate-200 dark:bg-slate-800 rounded w-24"></div></td>
                  <td className="px-6 py-4"><div className="h-4 bg-slate-200 dark:bg-slate-800 rounded w-24"></div></td>
                  <td className="px-6 py-4"><div className="h-4 bg-slate-200 dark:bg-slate-800 rounded w-48"></div></td>
                  <td className="px-6 py-4"><div className="h-4 bg-slate-200 dark:bg-slate-800 rounded w-16"></div></td>
                  <td className="px-6 py-4 text-right"><div className="h-4 bg-slate-200 dark:bg-slate-800 rounded w-12 ml-auto"></div></td>
                </tr>
              ))
            ) : reports.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-6 py-12 text-center text-slate-500">No reports found.</td>
              </tr>
            ) : (
              reports.map(report => (
                <tr key={report.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors">
                  <td className="px-6 py-4 text-xs font-medium">
                    {report.createdAt?.toDate ? report.createdAt.toDate().toLocaleDateString() : 'N/A'}
                  </td>
                  <td className="px-6 py-4 font-mono text-[11px] text-slate-500" title={report.reportedBy}>
                    {report.reportedBy.substring(0, 8)}...
                  </td>
                  <td className="px-6 py-4 font-mono text-[11px] text-slate-500" title={report.reportedUserId}>
                    {report.reportedUserId.substring(0, 8)}...
                  </td>
                  <td className="px-6 py-4">
                    <p className="max-w-[200px] md:max-w-xs truncate" title={report.reason}>
                      {report.reason}
                    </p>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                      report.status === 'pending' ? 'bg-amber-100 text-amber-700 dark:bg-amber-500/20 dark:text-amber-400' :
                      report.status === 'resolved' ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-400' :
                      'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400'
                    }`}>
                      {report.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right">
                    {report.status === 'pending' && (
                      <button
                        onClick={() => handleResolve(report.id)}
                        disabled={actionLoading === report.id}
                        className="text-amber-600 hover:text-amber-700 dark:text-amber-400 dark:hover:text-amber-300 disabled:opacity-50 font-medium text-xs flex items-center gap-1 ml-auto transition-colors outline-none focus-visible:ring-2 focus-visible:ring-amber-400 rounded px-1"
                      >
                        {actionLoading === report.id ? <Loader2 className="w-3 h-3 animate-spin" /> : <CheckCircle2 className="w-3 h-3" />}
                        Resolve
                      </button>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}

export default ModerationPage
