import React, { useEffect, useState } from 'react'
import { collection, query, limit, getDocs, doc, updateDoc } from 'firebase/firestore'
import { db } from '../../firebase/config'
import { Ban, AlertCircle, RefreshCw } from 'lucide-react'
import toast from 'react-hot-toast'
import { formatDistanceToNow } from 'date-fns'

interface ProfileDoc {
  uid: string
  displayName: string
  email?: string
  role: string
  status: string
  createdAt: any
}

const UserManagementPage: React.FC = () => {
  const [users, setUsers] = useState<ProfileDoc[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [actionLoading, setActionLoading] = useState<string | null>(null)

  const fetchUsers = async () => {
    try {
      setLoading(true)
      setError(null)
      const q = query(collection(db, 'profiles'), limit(50))
      const snap = await getDocs(q)
      setUsers(snap.docs.map(d => ({ uid: d.id, ...d.data() } as ProfileDoc)))
    } catch (err: any) {
      console.error('Failed to fetch users:', err)
      setError('Could not load user data. Verify permissions.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchUsers()
  }, [])

  const handleBan = async (uid: string) => {
    if (!window.confirm(`Are you absolutely sure you want to ban user ${uid}?`)) return
    
    try {
      setActionLoading(uid)
      await updateDoc(doc(db, 'profiles', uid), { status: 'banned' })
      toast.success('User banned successfully')
      await fetchUsers()
    } catch (err) {
      console.error(err)
      toast.error('Failed to ban user')
    } finally {
      setActionLoading(null)
    }
  }

  const handleUnban = async (uid: string) => {
    if (!window.confirm(`Are you sure you want to unban user ${uid}?`)) return
    
    try {
      setActionLoading(uid)
      await updateDoc(doc(db, 'profiles', uid), { status: 'active' })
      toast.success('User unbanned successfully')
      await fetchUsers()
    } catch (err) {
      console.error(err)
      toast.error('Failed to unban user')
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
          User Management
        </h1>
        <button
          onClick={fetchUsers}
          className="p-2 text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200"
        >
          <RefreshCw className="w-5 h-5" />
        </button>
      </div>

      {error && (
        <div className="bg-red-50 dark:bg-red-500/10 text-red-600 dark:text-red-400 p-4 rounded-lg flex items-center space-x-2">
          <AlertCircle className="w-5 h-5 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50">
                <th className="text-left py-3 px-4 text-sm font-semibold text-slate-900 dark:text-white">User</th>
                <th className="text-left py-3 px-4 text-sm font-semibold text-slate-900 dark:text-white">Role</th>
                <th className="text-left py-3 px-4 text-sm font-semibold text-slate-900 dark:text-white">Status</th>
                <th className="text-left py-3 px-4 text-sm font-semibold text-slate-900 dark:text-white">Joined</th>
                <th className="text-right py-3 px-4 text-sm font-semibold text-slate-900 dark:text-white">Actions</th>
              </tr>
            </thead>
            <tbody>
              {users.map(user => (
                <tr 
                  key={user.uid}
                  className="border-b border-slate-100 dark:border-slate-700/50 last:border-0 hover:bg-slate-50 dark:hover:bg-slate-700/25 transition-colors"
                >
                  <td className="py-3 px-4">
                    <div className="flex flex-col">
                      <span className="font-medium text-slate-900 dark:text-white">
                        {user.displayName || 'Unknown User'}
                      </span>
                      <span className="text-sm text-slate-500 dark:text-slate-400 font-mono">
                        {user.uid.slice(0, 8)}...
                      </span>
                    </div>
                  </td>
                  <td className="py-3 px-4">
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-slate-100 text-slate-800 dark:bg-slate-700 dark:text-slate-300 capitalize">
                      {user.role}
                    </span>
                  </td>
                  <td className="py-3 px-4">
                    {user.status === 'banned' ? (
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800 dark:bg-red-500/10 dark:text-red-500 border border-red-500/20">
                        Banned
                      </span>
                    ) : (
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-emerald-100 text-emerald-800 dark:bg-emerald-500/10 dark:text-emerald-400 border border-emerald-500/20 capitalize">
                        {user.status || 'Active'}
                      </span>
                    )}
                  </td>
                  <td className="py-3 px-4 text-sm text-slate-500 dark:text-slate-400">
                    {user.createdAt ? (
                      typeof user.createdAt.toDate === 'function' ? (
                        formatDistanceToNow(user.createdAt.toDate(), { addSuffix: true })
                      ) : (
                        'Unknown'
                      )
                    ) : 'Unknown'}
                  </td>
                  <td className="py-3 px-4 text-right">
                    {user.role !== 'admin' && (
                      <div className="flex items-center justify-end space-x-2">
                        {user.status === 'banned' ? (
                          <button
                            onClick={() => handleUnban(user.uid)}
                            disabled={actionLoading === user.uid}
                            className="inline-flex items-center px-3 py-1.5 rounded-lg text-sm font-medium text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50 dark:text-emerald-500 dark:hover:bg-emerald-500/10 transition-colors disabled:opacity-50"
                          >
                            Unban
                          </button>
                        ) : (
                          <button
                            onClick={() => handleBan(user.uid)}
                            disabled={actionLoading === user.uid}
                            className="inline-flex items-center px-3 py-1.5 rounded-lg text-sm font-medium text-red-600 hover:text-red-700 hover:bg-red-50 dark:text-red-500 dark:hover:bg-red-500/10 transition-colors disabled:opacity-50"
                          >
                            <Ban className="w-4 h-4 mr-1.5" />
                            Ban User
                          </button>
                        )}
                      </div>
                    )}
                  </td>
                </tr>
              ))}
              
              {users.length === 0 && (
                <tr>
                  <td colSpan={5} className="py-8 text-center text-slate-500 dark:text-slate-400">
                    No users found
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}

export default UserManagementPage
