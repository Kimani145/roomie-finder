import React, { useEffect, useState } from 'react'
import {
  Users,
  Home,
  HeartHandshake,
  ShieldAlert,
  AlertCircle,
  RefreshCw,
  ArrowRight,
  Shield,
  FileText,
  Building,
} from 'lucide-react'
import { Link } from 'react-router-dom'
import { fetchWithAuth } from '@/services/apiClient'
import { logger } from '@/utils/logger'

interface MetricsData {
  users: { total: number; active: number; banned: number }
  listings: { total: number; active: number; paused: number; flagged: number }
  reports: { total: number; pending: number; under_review: number; resolved: number }
  matches: { total: number; matched: number }
  admins: { total: number; superAdmins: number; regularAdmins: number }
}

const TelemetryCard: React.FC<{
  label: string
  value: number | string
  subtext?: string
  icon: any
  colorClass: string
  linkTo?: string
}> = ({ label, value, subtext, icon: Icon, colorClass, linkTo }) => {
  const CardContent = (
    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-sm hover:shadow-md transition-all flex flex-col justify-between h-full">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs font-bold uppercase tracking-widest text-slate-500 dark:text-slate-400">
            {label}
          </p>
          <p className="text-3xl font-syne font-bold text-slate-900 dark:text-slate-50 mt-2">
            {value}
          </p>
        </div>
        <div className={`p-3.5 rounded-2xl ${colorClass}`}>
          <Icon className="w-6 h-6" />
        </div>
      </div>
      {subtext && (
        <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs text-slate-500">
          <span>{subtext}</span>
          {linkTo && <ArrowRight className="w-3.5 h-3.5 text-slate-400" />}
        </div>
      )}
    </div>
  )

  if (linkTo) {
    return <Link to={linkTo} className="block">{CardContent}</Link>
  }

  return CardContent
}

const DEFAULT_METRICS: MetricsData = {
  users: { total: 0, active: 0, banned: 0 },
  listings: { total: 0, active: 0, paused: 0, flagged: 0 },
  reports: { total: 0, pending: 0, under_review: 0, resolved: 0 },
  matches: { total: 0, matched: 0 },
  admins: { total: 0, superAdmins: 0, regularAdmins: 0 },
}

export default function AdminDashboardPage() {
  const [metrics, setMetrics] = useState<MetricsData>(DEFAULT_METRICS)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchMetrics = async () => {
    try {
      setLoading(true)
      setError(null)
      const data = await fetchWithAuth('/api/v1/admin/metrics')
      if (data && data.metrics) {
        setMetrics({
          users: {
            total: data.metrics.users?.total ?? 0,
            active: data.metrics.users?.active ?? 0,
            banned: data.metrics.users?.banned ?? 0,
          },
          listings: {
            total: data.metrics.listings?.total ?? 0,
            active: data.metrics.listings?.active ?? 0,
            paused: data.metrics.listings?.paused ?? 0,
            flagged: data.metrics.listings?.flagged ?? 0,
          },
          reports: {
            total: data.metrics.reports?.total ?? 0,
            pending: data.metrics.reports?.pending ?? 0,
            under_review: data.metrics.reports?.under_review ?? 0,
            resolved: data.metrics.reports?.resolved ?? 0,
          },
          matches: {
            total: data.metrics.matches?.total ?? 0,
            matched: data.metrics.matches?.matched ?? 0,
          },
          admins: {
            total: data.metrics.admins?.total ?? 0,
            superAdmins: data.metrics.admins?.superAdmins ?? 0,
            regularAdmins: data.metrics.admins?.regularAdmins ?? 0,
          },
        })
      }
    } catch (err: any) {
      logger.error('Failed to fetch platform metrics:', err)
      setError('Could not connect to live operational telemetry endpoint.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchMetrics()
  }, [])

  const safeMetrics = metrics ?? DEFAULT_METRICS

  return (
    <div className="max-w-7xl mx-auto space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-syne font-bold text-slate-900 dark:text-slate-50 flex items-center gap-2">
            <Shield className="w-8 h-8 text-brand-600 dark:text-brand-400" />
            Real-time Operations Dashboard
          </h1>
          <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">
            Live platform telemetry, trust & safety metrics, and operational command shortcuts.
          </p>
        </div>
        <button
          onClick={fetchMetrics}
          className="inline-flex items-center gap-2 px-4 py-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-sm font-semibold rounded-xl transition-colors self-start sm:self-auto"
        >
          <RefreshCw className="w-4 h-4" />
          Refresh Telemetry
        </button>
      </div>

      {error ? (
        <div className="flex flex-col items-center justify-center p-12 text-center bg-white dark:bg-slate-900 border border-red-200 dark:border-red-900/50 rounded-2xl">
          <AlertCircle className="w-12 h-12 text-red-500 mb-4" />
          <h3 className="text-xl font-syne font-bold text-slate-900 dark:text-slate-50 mb-2">
            Telemetry Feed Disconnected
          </h3>
          <p className="text-slate-500 mb-4">{error}</p>
          <button
            onClick={fetchMetrics}
            className="px-4 py-2 bg-brand-600 text-white rounded-xl text-sm font-semibold"
          >
            Reconnect Telemetry
          </button>
        </div>
      ) : loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {[1, 2, 3, 4].map((i) => (
            <div
              key={i}
              className="h-36 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl animate-pulse"
            />
          ))}
        </div>
      ) : metrics ? (
        <>
          {/* Main Telemetry Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            <TelemetryCard
              label="Pending Reports"
              value={safeMetrics?.reports?.pending ?? 0}
              subtext={`${safeMetrics?.reports?.under_review ?? 0} under review • ${safeMetrics?.reports?.resolved ?? 0} resolved`}
              icon={ShieldAlert}
              colorClass="bg-amber-50 text-amber-600 dark:bg-amber-500/10 dark:text-amber-400"
              linkTo="/admin/moderation"
            />

            <TelemetryCard
              label="Active Accommodation Listings"
              value={safeMetrics?.listings?.active ?? 0}
              subtext={`${safeMetrics?.listings?.total ?? 0} total • ${safeMetrics?.listings?.paused ?? 0} paused • ${safeMetrics?.listings?.flagged ?? 0} flagged`}
              icon={Home}
              colorClass="bg-brand-50 text-brand-600 dark:bg-brand-500/10 dark:text-brand-400"
              linkTo="/admin/listings"
            />

            <TelemetryCard
              label="Registered Users"
              value={safeMetrics?.users?.total ?? 0}
              subtext={`${safeMetrics?.users?.active ?? 0} active • ${safeMetrics?.users?.banned ?? 0} banned`}
              icon={Users}
              colorClass="bg-blue-50 text-blue-600 dark:bg-blue-500/10 dark:text-blue-400"
              linkTo="/admin/users"
            />

            <TelemetryCard
              label="Successful Roomie Matches"
              value={safeMetrics?.matches?.matched ?? 0}
              subtext={`${safeMetrics?.matches?.total ?? 0} total compatibility interactions`}
              icon={HeartHandshake}
              colorClass="bg-pink-50 text-pink-600 dark:bg-pink-500/10 dark:text-pink-400"
            />
          </div>

          {/* Platform Governance & Control Quick Links */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-4">
            <Link
              to="/admin/moderation"
              className="group bg-gradient-to-br from-amber-500/10 via-slate-900/5 to-transparent dark:from-amber-500/10 dark:to-slate-900 border border-amber-500/20 rounded-3xl p-6 hover:border-amber-500/40 transition-all"
            >
              <div className="flex items-center justify-between">
                <div className="p-3 bg-amber-500/10 text-amber-500 rounded-2xl">
                  <ShieldAlert className="w-6 h-6" />
                </div>
                <ArrowRight className="w-5 h-5 text-slate-400 group-hover:translate-x-1 transition-transform" />
              </div>
              <h3 className="font-syne font-bold text-lg text-slate-900 dark:text-slate-50 mt-4">
                Moderation Command Center
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                Inspect pending safety reports and execute user bans or listing pauses.
              </p>
            </Link>

            <Link
              to="/admin/listings"
              className="group bg-gradient-to-br from-brand-500/10 via-slate-900/5 to-transparent dark:from-brand-500/10 dark:to-slate-900 border border-brand-500/20 rounded-3xl p-6 hover:border-brand-500/40 transition-all"
            >
              <div className="flex items-center justify-between">
                <div className="p-3 bg-brand-500/10 text-brand-600 dark:text-brand-400 rounded-2xl">
                  <Building className="w-6 h-6" />
                </div>
                <ArrowRight className="w-5 h-5 text-slate-400 group-hover:translate-x-1 transition-transform" />
              </div>
              <h3 className="font-syne font-bold text-lg text-slate-900 dark:text-slate-50 mt-4">
                Listings Control
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                Manage room listings, toggle featured status, and moderate housing options.
              </p>
            </Link>

            <Link
              to="/admin/audit"
              className="group bg-gradient-to-br from-indigo-500/10 via-slate-900/5 to-transparent dark:from-indigo-500/10 dark:to-slate-900 border border-indigo-500/20 rounded-3xl p-6 hover:border-indigo-500/40 transition-all"
            >
              <div className="flex items-center justify-between">
                <div className="p-3 bg-indigo-500/10 text-indigo-500 rounded-2xl">
                  <FileText className="w-6 h-6" />
                </div>
                <ArrowRight className="w-5 h-5 text-slate-400 group-hover:translate-x-1 transition-transform" />
              </div>
              <h3 className="font-syne font-bold text-lg text-slate-900 dark:text-slate-50 mt-4">
                Audit Trail Logs
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                Inspect immutable security audit logs across all platform administrative actions.
              </p>
            </Link>
          </div>
        </>
      ) : null}
    </div>
  )
}
