import React, { useEffect, useState } from 'react'
import { FileText, Search, RefreshCw, AlertCircle, Shield, ChevronDown, ChevronUp } from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'
import { fetchWithAuth } from '@/services/apiClient'
import { logger } from '@/utils/logger'

interface AuditLogEntryDoc {
  id: string
  action: string
  resource?: string
  actorUid?: string
  actorEmail?: string
  targetUid?: string
  actor?: {
    uid: string
    name: string
    email: string
    role: string
    avatar?: string
  }
  status?: string
  timestamp?: string
  requestId?: string
  metadata?: Record<string, any>
}

export default function AuditLogPage() {
  const [logs, setLogs] = useState<AuditLogEntryDoc[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [expandedLogId, setExpandedLogId] = useState<string | null>(null)

  const fetchLogs = async () => {
    try {
      setLoading(true)
      setError(null)
      const data = await fetchWithAuth('/api/v1/audit?limit=100')
      setLogs(data.logs || [])
    } catch (err: any) {
      logger.error('Failed to fetch audit logs:', err)
      setError('Could not load audit log entries. Verify permissions.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchLogs()
  }, [])

  const filteredLogs = logs.filter((log) => {
    if (!searchQuery.trim()) return true
    const q = searchQuery.toLowerCase()
    return (
      log.action?.toLowerCase().includes(q) ||
      log.actorUid?.toLowerCase().includes(q) ||
      log.resource?.toLowerCase().includes(q) ||
      log.requestId?.toLowerCase().includes(q)
    )
  })

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-syne font-bold text-slate-900 dark:text-slate-50 flex items-center gap-2">
            <FileText className="w-8 h-8 text-indigo-500" />
            Administrator Audit Log
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Immutable audit trail of all security, moderation, and system events.
          </p>
        </div>
        <button
          onClick={fetchLogs}
          className="inline-flex items-center gap-2 px-4 py-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-sm font-semibold rounded-xl transition-colors self-start sm:self-auto"
        >
          <RefreshCw className="w-4 h-4" />
          Refresh Logs
        </button>
      </div>

      {/* Filter Bar */}
      <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800">
        <div className="relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by action, actor UID, resource, or request ID..."
            className="w-full pl-10 pr-4 py-2.5 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-50 text-sm rounded-xl border border-slate-200 dark:border-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>
      </div>

      {/* Logs Table */}
      {error ? (
        <div className="flex flex-col items-center justify-center p-12 text-center bg-white dark:bg-slate-900 border border-red-200 dark:border-red-900/50 rounded-2xl">
          <AlertCircle className="w-12 h-12 text-red-500 mb-4" />
          <h3 className="text-xl font-syne font-bold text-slate-900 dark:text-slate-50 mb-2">
            Failed to Load Audit Trail
          </h3>
          <p className="text-slate-500 mb-4">{error}</p>
          <button
            onClick={fetchLogs}
            className="px-4 py-2 bg-indigo-600 text-white rounded-xl text-sm font-semibold"
          >
            Retry Connection
          </button>
        </div>
      ) : loading ? (
        <div className="space-y-3">
          {[1, 2, 3, 4, 5].map((i) => (
            <div
              key={i}
              className="h-16 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl animate-pulse"
            />
          ))}
        </div>
      ) : filteredLogs.length === 0 ? (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-16 text-center">
          <Shield className="w-12 h-12 text-slate-400 mx-auto mb-4" />
          <h3 className="text-xl font-bold font-syne text-slate-900 dark:text-slate-50 mb-2">
            No Audit Logs Match
          </h3>
          <p className="text-slate-500 text-sm">
            No logs matched your search parameters.
          </p>
        </div>
      ) : (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/50 text-xs font-bold text-slate-500 uppercase tracking-wider">
                  <th className="py-3.5 px-4">Action</th>
                  <th className="py-3.5 px-4">Actor</th>
                  <th className="py-3.5 px-4">Resource</th>
                  <th className="py-3.5 px-4">Time</th>
                  <th className="py-3.5 px-4 text-right">Details</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 text-sm">
                {filteredLogs.map((log) => {
                  const isExpanded = expandedLogId === log.id
                  return (
                    <React.Fragment key={log.id}>
                      <tr
                        onClick={() => setExpandedLogId(isExpanded ? null : log.id)}
                        className="hover:bg-slate-50 dark:hover:bg-slate-800/40 cursor-pointer transition-colors"
                      >
                        <td className="py-3.5 px-4 font-mono font-bold text-xs text-indigo-600 dark:text-indigo-400">
                          <span className="px-2 py-1 bg-indigo-50 dark:bg-indigo-500/10 rounded-md">
                            {log.action}
                          </span>
                        </td>
                        <td className="py-3.5 px-4 text-slate-700 dark:text-slate-300 text-xs">
                          {log.actor ? (
                            <div className="flex flex-col">
                              <span className="font-semibold text-slate-900 dark:text-slate-100">{log.actor.name}</span>
                              <span className="text-[10px] text-slate-500 font-mono">{log.actor.email || log.actorUid}</span>
                            </div>
                          ) : log.actorEmail ? (
                            <span className="font-mono">{log.actorEmail}</span>
                          ) : log.actorUid ? (
                            <span className="font-mono">{log.actorUid.slice(0, 8)}...</span>
                          ) : (
                            <span className="text-slate-400 font-medium italic">System</span>
                          )}
                        </td>
                        <td className="py-3.5 px-4 text-slate-600 dark:text-slate-400 font-mono text-xs">
                          {log.resource || 'N/A'}
                        </td>
                        <td className="py-3.5 px-4 text-slate-500 text-xs">
                          {log.timestamp
                            ? formatDistanceToNow(new Date(log.timestamp), { addSuffix: true })
                            : 'Recently'}
                        </td>
                        <td className="py-3.5 px-4 text-right">
                          <button className="p-1 rounded-md text-slate-400 hover:text-slate-600 dark:hover:text-slate-200">
                            {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                          </button>
                        </td>
                      </tr>

                      {isExpanded && (
                        <tr className="bg-slate-50/70 dark:bg-slate-850">
                          <td colSpan={5} className="p-4">
                            <div className="bg-slate-900 text-slate-100 rounded-xl p-4 font-mono text-xs space-y-2 overflow-x-auto">
                              <p><span className="text-amber-400">Log ID:</span> {log.id}</p>
                              {log.requestId && <p><span className="text-amber-400">Request ID:</span> {log.requestId}</p>}
                              {log.metadata && (
                                <div>
                                  <span className="text-amber-400">Metadata:</span>
                                  <pre className="text-emerald-400 mt-1">{JSON.stringify(log.metadata, null, 2)}</pre>
                                </div>
                              )}
                            </div>
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}
