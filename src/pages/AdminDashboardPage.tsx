import React, { useEffect, useState } from 'react'
import { collection, query, where, getCountFromServer, getDocs, doc, updateDoc, writeBatch, orderBy, limit } from 'firebase/firestore'
import { db } from '@/firebase/config'
import { CheckCircle2, Ban, ShieldAlert, Users, Home, HeartHandshake, Loader2, AlertCircle} from 'lucide-react'
import toast from 'react-hot-toast'
import { formatTimeAgo } from '@/utils/formatters'

interface TelemetryStats {
  activeUsers: number
  activeListings: number
  matches: number
  pendingReports: number
}

interface ReportDoc {
  id: string
  reportedUserId: string
  reportedBy: string
  reason: string
  status: string
  createdAt: any
}

const AdminCardStats: React.FC<{ loading: boolean; label: string; value: number | string; icon: any }> = ({ loading, label, value, icon: Icon }) => (
  <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 flex items-start justify-between">
    <div className="space-y-2">
      <p className="text-sm font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-widest">{label}</p>
      {loading ? (
        <div className="h-8 w-16 bg-slate-200 dark:bg-slate-800 rounded animate-pulse" />
      ) : (
        <p className="text-3xl font-bold text-slate-900 dark:text-slate-50">{value}</p>
      )}
    </div>
    <div className="p-3 bg-slate-50 dark:bg-slate-800/50 rounded-xl">
      <Icon className="h-6 w-6 text-slate-400 dark:text-slate-500" />
    </div>
  </div>
)

const AdminDashboardPage: React.FC = () => {
  const [stats, setStats] = useState<TelemetryStats | null>(null)
  const [reports, setReports] = useState<ReportDoc[]>([])
  const [recentListings, setRecentListings] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [actionLoading, setActionLoading] = useState<string | null>(null)

  const fetchDashboardData = async () => {
    try {
      setLoading(true)
      setError(null)

      // Parallel reads for telemetry using getCountFromServer
      const [usersSnap, listingsSnap, matchesSnap, reportsSnap] = await Promise.all([
        getCountFromServer(query(collection(db, 'profiles'), where('status', '==', 'active'))),
        getCountFromServer(query(collection(db, 'listings'), where('status', '==', 'active'))),
        getCountFromServer(query(collection(db, 'matches'), where('status', '==', 'matched'))),
        getCountFromServer(query(collection(db, 'reports'), where('status', '==', 'pending')))
      ])

      setStats({
        activeUsers: usersSnap.data().count,
        activeListings: listingsSnap.data().count,
        matches: matchesSnap.data().count,
        pendingReports: reportsSnap.data().count
      })

      // Fetch pending reports
      const reportsQuery = query(collection(db, 'reports'), where('status', '==', 'pending'))
      const rSnap = await getDocs(reportsQuery)
      setReports(rSnap.docs.map(d => ({ id: d.id, ...d.data() } as ReportDoc)))

      // Fetch recent listings
      const recentListingsQuery = query(collection(db, 'listings'), orderBy('createdAt', 'desc'), limit(5))
      const rlSnap = await getDocs(recentListingsQuery)
      setRecentListings(rlSnap.docs.map(d => ({ id: d.id, ...d.data() })))

    } catch (err: any) {
      console.error('Admin telemetry failed:', err)
      setError('Failed to fetch system telemetry. Ensure Firestore rules permit admin access.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchDashboardData()
  }, [])

  const handleDismissReport = async (reportId: string) => {
    try {
      setActionLoading(reportId)
      await updateDoc(doc(db, 'reports', reportId), {
        status: 'resolved'
      })
      toast.success('Report dismissed')
      await fetchDashboardData()
    } catch (err) {
      console.error(err)
      toast.error('Failed to dismiss report')
    } finally {
      setActionLoading(null)
    }
  }

  const handleBanUser = async (reportId: string, reportedUserId: string) => {
    if (!window.confirm(`CRITICAL ACTION: Are you sure you want to ban user ${reportedUserId}?`)) return
    
    try {
      setActionLoading(reportId)
      const batch = writeBatch(db)

      // 1. Ban profile
      batch.update(doc(db, 'profiles', reportedUserId), { status: 'banned' })
      
      // 2. Pause their listings
      const lQuery = query(collection(db, 'listings'), where('hostId', '==', reportedUserId))
      const lSnap = await getDocs(lQuery)
      lSnap.docs.forEach(lDoc => {
        batch.update(doc(db, 'listings', lDoc.id), { status: 'paused' })
      })

      // 3. Resolve report
      batch.update(doc(db, 'reports', reportId), { status: 'resolved' })

      await batch.commit()
      toast.success('User banned and associated listings paused.')
      await fetchDashboardData()
    } catch (err) {
      console.error(err)
      toast.error('Failed to ban user.')
    } finally {
      setActionLoading(null)
    }
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center p-12 text-center bg-white dark:bg-slate-900 border border-red-200 dark:border-red-900/50 rounded-2xl mx-4 my-8">
        <AlertCircle className="w-12 h-12 text-red-500 mb-4" />
        <h3 className="text-xl font-syne font-bold text-slate-900 dark:text-slate-50 mb-2">Telemetry Offline</h3>
        <p className="text-slate-500 max-w-md">{error}</p>
        <button onClick={fetchDashboardData} className="mt-6 px-6 py-2 bg-slate-900 dark:bg-slate-50 text-white dark:text-slate-900 rounded-xl font-medium">
          Retry Connection
        </button>
      </div>
    )
  }

  return (
    <div className="max-w-7xl mx-auto space-y-8">
      <div>
        <h1 className="text-3xl font-syne font-bold text-slate-900 dark:text-slate-50">System Telemetry</h1>
        <p className="text-slate-500 dark:text-slate-400 mt-1">Real-time platform health and active user metrics.</p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
        <AdminCardStats loading={loading} label="Active Users" value={stats?.activeUsers ?? 0} icon={Users} />
        <AdminCardStats loading={loading} label="Active Listings" value={stats?.activeListings ?? 0} icon={Home} />
        <AdminCardStats loading={loading} label="Formed Matches" value={stats?.matches ?? 0} icon={HeartHandshake} />
        <AdminCardStats loading={loading} label="Pending Reports" value={stats?.pendingReports ?? 0} icon={ShieldAlert} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 md:gap-8">
        <div className="lg:col-span-2 space-y-4">
          <h2 className="text-xl font-syne font-bold text-slate-900 dark:text-slate-50">Actionable Reports</h2>
          
          {loading ? (
            <div className="space-y-4">
              {[1,2].map(i => (
                <div key={i} className="h-32 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl animate-pulse" />
              ))}
            </div>
          ) : reports.length === 0 ? (
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-12 text-center flex flex-col items-center">
              <div className="w-16 h-16 bg-emerald-50 dark:bg-emerald-500/10 rounded-full flex items-center justify-center mb-4">
                <CheckCircle2 className="w-8 h-8 text-emerald-500" />
              </div>
              <h3 className="text-xl font-semibold text-slate-900 dark:text-slate-50 mb-2">System Stable</h3>
              <p className="text-slate-500">0 Pending Reports in queue.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {reports.map(report => (
                <div key={report.id} className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6">
                  <div className="flex flex-col md:flex-row justify-between gap-4">
                    <div className="space-y-2 flex-1">
                      <div className="flex items-center gap-2">
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-amber-100 text-amber-700 dark:bg-amber-500/20 dark:text-amber-400">
                          Reported User
                        </span>
                        <code className="text-xs text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded">
                          {report.reportedUserId}
                        </code>
                      </div>
                      <p className="text-slate-900 dark:text-slate-50 font-medium whitespace-pre-wrap">{report.reason}</p>
                      <div className="text-xs text-slate-500 pt-2 border-t border-slate-100 dark:border-slate-800">
                        Reported by: {report.reportedBy} • {report.createdAt?.toDate().toLocaleString()}
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-3 shrink-0">
                      <button
                        onClick={() => handleDismissReport(report.id)}
                        disabled={actionLoading !== null}
                        className="px-4 py-2 text-sm font-medium rounded-xl text-slate-600 bg-slate-100 hover:bg-slate-200 dark:text-slate-300 dark:bg-slate-800 dark:hover:bg-slate-700 transition-colors disabled:opacity-50 flex items-center"
                      >
                        {actionLoading === report.id ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Dismiss'}
                      </button>
                      <button
                        onClick={() => handleBanUser(report.id, report.reportedUserId)}
                        disabled={actionLoading !== null}
                        className="px-4 py-2 text-sm font-medium rounded-xl text-white bg-red-500 hover:bg-red-600 transition-colors shadow-sm disabled:opacity-50 flex items-center gap-2"
                      >
                        {actionLoading === report.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <Ban className="w-4 h-4" />}
                        Ban User
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="lg:col-span-1">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl flex flex-col h-full min-h-[300px] overflow-hidden">
            <div className="p-4 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50">
              <h3 className="font-syne font-bold text-slate-900 dark:text-slate-50">Live Operational Feed</h3>
            </div>
            <div className="flex-1 overflow-y-auto">
              {recentListings.map(listing => (
                <div key={listing.id} className="flex items-start gap-3 p-3 border-b border-slate-100 dark:border-slate-800 last:border-0 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                  <div className="p-1.5 bg-blue-500/10 text-blue-500 rounded-md shrink-0">
                    <Home className="w-4 h-4" />
                  </div>
                  <div>
                    <p className="text-sm text-slate-900 dark:text-slate-100">
                      <span className="font-bold">New Listing</span> created in {listing.zone}
                    </p>
                    <p className="text-xs text-slate-500 mt-0.5">{listing.createdAt ? formatTimeAgo(listing.createdAt.toDate()) : 'Recently'}</p>
                  </div>
                </div>
              ))}
              {recentListings.length === 0 && (
                <div className="p-6 text-center text-slate-500">No recent activity</div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default AdminDashboardPage
