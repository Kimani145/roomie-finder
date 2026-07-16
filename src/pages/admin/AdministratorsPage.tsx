import React, { useEffect, useState } from 'react'
import { collection, query, limit, getDocs, doc, updateDoc } from 'firebase/firestore'
import { db } from '../../firebase/config'
import { UserPlus, RefreshCw, XCircle, CheckCircle } from 'lucide-react'
import toast from 'react-hot-toast'
import { formatDistanceToNow } from 'date-fns'
import { logger } from '@/utils/logger'
import { useAuth } from '@/hooks/useAuth'
import { fetchWithAuth } from '@/services/apiClient'
import { auditService } from '@/services/auditService'
import { UserRole } from '@/types'

interface AdminDoc {
  uid: string
  email: string
  systemRole: string
  status: string
  invitedAt?: any
  activatedAt?: any
  lastActive?: any
}

const AdministratorsPage: React.FC = () => {
  const { user } = useAuth()
  const [admins, setAdmins] = useState<AdminDoc[]>([])
  const [loading, setLoading] = useState(true)
  const [actionLoading, setActionLoading] = useState<string | null>(null)

  // Invitation Form State
  const [inviteEmail, setInviteEmail] = useState('')
  const [inviteRole, setInviteRole] = useState<UserRole>(UserRole.ADMIN)
  const [inviting, setInviting] = useState(false)

  const fetchAdmins = async () => {
    try {
      setLoading(true)
      const q = query(collection(db, 'admins'), limit(50))
      const snap = await getDocs(q)
      setAdmins(snap.docs.map(d => ({ uid: d.id, ...d.data() } as AdminDoc)))
    } catch (err: any) {
      logger.error('Failed to fetch admins:', err)
      toast.error('Could not load admins')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchAdmins()
  }, [])

  const handleInvite = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!inviteEmail || !user) return

    try {
      setInviting(true)
      
      const response = await fetchWithAuth('/admin/invitations', {
        method: 'POST',
        body: JSON.stringify({ email: inviteEmail.trim(), role: inviteRole }),
      })

      if (!response.success) {
        throw new Error(response.message || 'Failed to send invitation')
      }

      toast.success('Invitation sent successfully')
      setInviteEmail('')
      // Note: Admin won't appear in the table until they accept
    } catch (err) {
      logger.error('Error sending invite:', err)
      toast.error('Failed to send invitation')
    } finally {
      setInviting(false)
    }
  }

  const handleToggleStatus = async (uid: string, currentStatus: string) => {
    const newStatus = currentStatus === 'active' ? 'disabled' : 'active'
    if (!window.confirm(`Are you sure you want to ${newStatus} this administrator?`)) return
    
    try {
      setActionLoading(uid)
      await updateDoc(doc(db, 'admins', uid), { status: newStatus })
      
      await auditService.log({
        action: newStatus === 'active' ? 'admin_reactivated' : 'admin_disabled',
        actorUid: user!.uid,
        targetUid: uid,
      })

      toast.success(`Administrator ${newStatus} successfully`)
      await fetchAdmins()
    } catch (err) {
      logger.error('Error toggling status:', err)
      toast.error(`Failed to ${newStatus} administrator`)
    } finally {
      setActionLoading(null)
    }
  }

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand-500" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white">
          Administrator Provisioning
        </h1>
        <button
          onClick={fetchAdmins}
          className="p-2 text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200"
        >
          <RefreshCw className="w-5 h-5" />
        </button>
      </div>

      {/* Invite Form */}
      <div className="bg-white dark:bg-slate-800 p-6 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700">
        <h2 className="text-lg font-semibold text-slate-900 dark:text-white mb-4">Invite New Administrator</h2>
        <form onSubmit={handleInvite} className="flex items-end gap-4">
          <div className="flex-1">
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
              Email Address
            </label>
            <input
              type="email"
              required
              value={inviteEmail}
              onChange={e => setInviteEmail(e.target.value)}
              className="w-full px-4 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-900 text-slate-900 dark:text-white"
              placeholder="admin@example.com"
            />
          </div>
          <div className="w-48">
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
              Role
            </label>
            <select
              value={inviteRole}
              onChange={e => setInviteRole(e.target.value as UserRole)}
              className="w-full px-4 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-900 text-slate-900 dark:text-white"
            >
              <option value={UserRole.ADMIN}>Administrator</option>
              <option value={UserRole.SUPER_ADMIN}>Super Admin</option>
            </select>
          </div>
          <button
            type="submit"
            disabled={inviting || !inviteEmail}
            className="px-6 py-2 bg-brand-500 hover:bg-brand-600 text-white rounded-lg font-medium disabled:opacity-50 flex items-center h-[42px]"
          >
            {inviting ? 'Sending...' : <><UserPlus className="w-4 h-4 mr-2" /> Invite</>}
          </button>
        </form>
      </div>

      <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50">
                <th className="text-left py-3 px-4 text-sm font-semibold text-slate-900 dark:text-white">Email</th>
                <th className="text-left py-3 px-4 text-sm font-semibold text-slate-900 dark:text-white">Role</th>
                <th className="text-left py-3 px-4 text-sm font-semibold text-slate-900 dark:text-white">Status</th>
                <th className="text-left py-3 px-4 text-sm font-semibold text-slate-900 dark:text-white">Last Active</th>
                <th className="text-right py-3 px-4 text-sm font-semibold text-slate-900 dark:text-white">Actions</th>
              </tr>
            </thead>
            <tbody>
              {admins.map(admin => (
                <tr 
                  key={admin.uid}
                  className="border-b border-slate-100 dark:border-slate-700/50 last:border-0 hover:bg-slate-50 dark:hover:bg-slate-700/25 transition-colors"
                >
                  <td className="py-3 px-4">
                    <span className="font-medium text-slate-900 dark:text-white">
                      {admin.email}
                    </span>
                  </td>
                  <td className="py-3 px-4">
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800 dark:bg-purple-500/10 dark:text-purple-400 capitalize">
                      {admin.systemRole === UserRole.SUPER_ADMIN ? 'Super Admin' : 'Admin'}
                    </span>
                  </td>
                  <td className="py-3 px-4">
                    {admin.status === 'disabled' ? (
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800 dark:bg-red-500/10 dark:text-red-500">
                        Disabled
                      </span>
                    ) : (
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-emerald-100 text-emerald-800 dark:bg-emerald-500/10 dark:text-emerald-400">
                        Active
                      </span>
                    )}
                  </td>
                  <td className="py-3 px-4 text-sm text-slate-500 dark:text-slate-400">
                    {admin.lastActive ? (
                      typeof admin.lastActive.toDate === 'function' ? (
                        formatDistanceToNow(admin.lastActive.toDate(), { addSuffix: true })
                      ) : (
                        'Unknown'
                      )
                    ) : 'Never'}
                  </td>
                  <td className="py-3 px-4 text-right">
                    {admin.uid !== user?.uid && (
                      <button
                        onClick={() => handleToggleStatus(admin.uid, admin.status)}
                        disabled={actionLoading === admin.uid}
                        className={`inline-flex items-center px-3 py-1.5 rounded-lg text-sm font-medium transition-colors disabled:opacity-50 ${
                          admin.status === 'disabled'
                            ? 'text-emerald-600 hover:bg-emerald-50 dark:text-emerald-500 dark:hover:bg-emerald-500/10'
                            : 'text-red-600 hover:bg-red-50 dark:text-red-500 dark:hover:bg-red-500/10'
                        }`}
                      >
                        {admin.status === 'disabled' ? (
                          <><CheckCircle className="w-4 h-4 mr-1.5" /> Enable</>
                        ) : (
                          <><XCircle className="w-4 h-4 mr-1.5" /> Disable</>
                        )}
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}

export default AdministratorsPage
