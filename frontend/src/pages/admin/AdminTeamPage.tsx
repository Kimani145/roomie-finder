import React, { useEffect, useState } from 'react'
import { Users, UserPlus, RefreshCw, AlertCircle, Shield, KeyRound, Mail, X } from 'lucide-react'
import toast from 'react-hot-toast'
import { fetchWithAuth } from '@/services/apiClient'
import { logger } from '@/utils/logger'
import { ConfirmationModal } from '@/components/ui/ConfirmationModal'

interface AdminAccountDoc {
  uid: string
  email: string
  displayName: string
  systemRole: 'ADMIN' | 'SUPER_ADMIN'
  status: 'active' | 'disabled'
  twoFactorEnabled: boolean
  createdAt?: string | null
}

export default function AdminTeamPage() {
  const [admins, setAdmins] = useState<AdminAccountDoc[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [actionLoading, setActionLoading] = useState<string | null>(null)

  // Invite Modal State
  const [inviteModalOpen, setInviteModalOpen] = useState(false)
  const [inviteEmail, setInviteEmail] = useState('')
  const [inviteRole, setInviteRole] = useState<'ADMIN' | 'SUPER_ADMIN'>('ADMIN')
  const [inviting, setInviting] = useState(false)

  // Confirmation Modal State
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

  const fetchAdmins = async () => {
    try {
      setLoading(true)
      setError(null)
      const data = await fetchWithAuth('/api/v1/admin/team')
      setAdmins(data.admins || [])
    } catch (err: any) {
      logger.error('Failed to fetch admin team:', err)
      setError('Could not load admin team data. Verify permissions.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchAdmins()
  }, [])

  const handleSendInvite = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!inviteEmail.trim()) {
      toast.error('Please enter a valid email address')
      return
    }

    try {
      setInviting(true)
      await fetchWithAuth('/api/v1/admin/invitations', {
        method: 'POST',
        body: JSON.stringify({ email: inviteEmail.trim(), role: inviteRole }),
      })
      toast.success(`Invitation sent to ${inviteEmail}`)
      setInviteModalOpen(false)
      setInviteEmail('')
      await fetchAdmins()
    } catch (err: any) {
      logger.error('Error sending invite:', err)
      toast.error(err.message || 'Failed to send invitation')
    } finally {
      setInviting(false)
    }
  }

  const handleToggleRole = (admin: AdminAccountDoc) => {
    const nextRole = admin.systemRole === 'SUPER_ADMIN' ? 'ADMIN' : 'SUPER_ADMIN'
    setConfirmModal({
      isOpen: true,
      title: `Change Role to ${nextRole}`,
      displayName: admin.displayName || admin.email,
      actionSummary: `Are you sure you want to update ${admin.displayName || admin.email}'s role to ${nextRole}?`,
      confirmText: `Promote to ${nextRole}`,
      variant: 'success',
      onConfirm: async () => {
        try {
          setActionLoading(admin.uid)
          await fetchWithAuth(`/api/v1/admin/team/${admin.uid}/role`, {
            method: 'PUT',
            body: JSON.stringify({ systemRole: nextRole }),
          })
          toast.success(`Updated role to ${nextRole}`)
          await fetchAdmins()
        } catch (err: any) {
          logger.error('Error updating role:', err)
          toast.error(err.message || 'Failed to update admin role')
        } finally {
          setActionLoading(null)
          setConfirmModal((prev) => ({ ...prev, isOpen: false }))
        }
      },
    })
  }

  const handleToggleStatus = (admin: AdminAccountDoc) => {
    const nextStatus = admin.status === 'active' ? 'disabled' : 'active'
    setConfirmModal({
      isOpen: true,
      title: nextStatus === 'disabled' ? 'Revoke Admin Access' : 'Restore Admin Access',
      displayName: admin.displayName || admin.email,
      actionSummary: nextStatus === 'disabled'
        ? `Are you sure you want to revoke admin access for ${admin.displayName || admin.email}? They will no longer be able to log in to the admin platform.`
        : `Are you sure you want to reactivate admin access for ${admin.displayName || admin.email}?`,
      confirmText: nextStatus === 'disabled' ? 'Revoke Access' : 'Restore Access',
      variant: nextStatus === 'disabled' ? 'danger' : 'success',
      onConfirm: async () => {
        try {
          setActionLoading(admin.uid)
          await fetchWithAuth(`/api/v1/admin/team/${admin.uid}/status`, {
            method: 'PUT',
            body: JSON.stringify({ status: nextStatus }),
          })
          toast.success(`Admin access ${nextStatus === 'disabled' ? 'revoked' : 'restored'}`)
          await fetchAdmins()
        } catch (err: any) {
          logger.error('Error updating status:', err)
          toast.error(err.message || 'Failed to update admin status')
        } finally {
          setActionLoading(null)
          setConfirmModal((prev) => ({ ...prev, isOpen: false }))
        }
      },
    })
  }

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-syne font-bold text-slate-900 dark:text-slate-50 flex items-center gap-2">
            <Users className="w-8 h-8 text-purple-600 dark:text-purple-400" />
            Admin Team & Access Governance
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Manage administrator accounts, invitations, 2FA status, and Super Admin permissions.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={fetchAdmins}
            className="inline-flex items-center gap-2 px-4 py-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-sm font-semibold rounded-xl transition-colors"
          >
            <RefreshCw className="w-4 h-4" />
            Refresh
          </button>
          <button
            onClick={() => setInviteModalOpen(true)}
            className="inline-flex items-center gap-2 px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white text-sm font-semibold rounded-xl transition-colors shadow-sm"
          >
            <UserPlus className="w-4 h-4" />
            Invite Admin
          </button>
        </div>
      </div>

      {/* Admin Cards Grid */}
      {error ? (
        <div className="flex flex-col items-center justify-center p-12 text-center bg-white dark:bg-slate-900 border border-red-200 dark:border-red-900/50 rounded-2xl">
          <AlertCircle className="w-12 h-12 text-red-500 mb-4" />
          <h3 className="text-xl font-syne font-bold text-slate-900 dark:text-slate-50 mb-2">
            Failed to Load Team Data
          </h3>
          <p className="text-slate-500 mb-4">{error}</p>
          <button
            onClick={fetchAdmins}
            className="px-4 py-2 bg-purple-600 text-white rounded-xl text-sm font-semibold"
          >
            Retry Connection
          </button>
        </div>
      ) : loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="h-52 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl animate-pulse"
            />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {admins.map((admin) => (
            <div
              key={admin.uid}
              className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800/80 rounded-3xl p-6 shadow-sm hover:shadow-md transition-all flex flex-col justify-between"
            >
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span
                    className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold ${
                      admin.systemRole === 'SUPER_ADMIN'
                        ? 'bg-purple-100 text-purple-800 dark:bg-purple-500/20 dark:text-purple-300'
                        : 'bg-blue-100 text-blue-800 dark:bg-blue-500/20 dark:text-blue-300'
                    }`}
                  >
                    <Shield className="w-3.5 h-3.5" />
                    {admin.systemRole.replace('_', ' ')}
                  </span>

                  <span
                    className={`text-xs font-bold px-2.5 py-0.5 rounded-full capitalize ${
                      admin.status === 'active'
                        ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-500/10 dark:text-emerald-400'
                        : 'bg-red-100 text-red-800 dark:bg-red-500/10 dark:text-red-400'
                    }`}
                  >
                    {admin.status}
                  </span>
                </div>

                <div>
                  <h3 className="font-syne font-bold text-slate-900 dark:text-slate-50 text-lg">
                    {admin.displayName}
                  </h3>
                  <p className="text-xs font-mono text-slate-500 dark:text-slate-400 mt-0.5">
                    {admin.email}
                  </p>
                </div>

                <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
                  <KeyRound className={`w-4 h-4 ${admin.twoFactorEnabled ? 'text-emerald-500' : 'text-amber-500'}`} />
                  <span>2FA Status: <strong className="text-slate-700 dark:text-slate-300">{admin.twoFactorEnabled ? 'Enabled' : 'Pending Setup'}</strong></span>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="pt-4 mt-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between gap-2">
                <button
                  onClick={() => handleToggleRole(admin)}
                  disabled={actionLoading === admin.uid}
                  className="px-3 py-1.5 text-xs font-bold rounded-xl text-purple-700 bg-purple-50 hover:bg-purple-100 dark:text-purple-400 dark:bg-purple-500/10 transition-colors"
                >
                  {admin.systemRole === 'SUPER_ADMIN' ? 'Demote to Admin' : 'Promote to Super Admin'}
                </button>

                <button
                  onClick={() => handleToggleStatus(admin)}
                  disabled={actionLoading === admin.uid}
                  className={`px-3 py-1.5 text-xs font-bold rounded-xl transition-colors ${
                    admin.status === 'active'
                      ? 'text-red-700 bg-red-50 hover:bg-red-100 dark:text-red-400 dark:bg-red-500/10'
                      : 'text-emerald-700 bg-emerald-50 hover:bg-emerald-100 dark:text-emerald-400 dark:bg-emerald-500/10'
                  }`}
                >
                  {admin.status === 'active' ? 'Revoke Access' : 'Restore Access'}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Invite Modal */}
      {inviteModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 max-w-md w-full space-y-6 shadow-2xl relative">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-4">
              <h3 className="text-xl font-syne font-bold text-slate-900 dark:text-slate-50 flex items-center gap-2">
                <UserPlus className="w-5 h-5 text-purple-600" />
                Invite Administrator
              </h3>
              <button
                onClick={() => setInviteModalOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSendInvite} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-1">
                  Administrator Email
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
                  <input
                    type="email"
                    required
                    value={inviteEmail}
                    onChange={(e) => setInviteEmail(e.target.value)}
                    placeholder="admin@university.ac.ke"
                    className="w-full pl-10 pr-4 py-2.5 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-50 text-sm rounded-xl border border-slate-200 dark:border-slate-700 focus:outline-none focus:ring-2 focus:ring-purple-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-1">
                  Assign System Role
                </label>
                <select
                  value={inviteRole}
                  onChange={(e) => setInviteRole(e.target.value as 'ADMIN' | 'SUPER_ADMIN')}
                  className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-50 text-sm rounded-xl border border-slate-200 dark:border-slate-700 focus:outline-none focus:ring-2 focus:ring-purple-500"
                >
                  <option value="ADMIN">Administrator (Standard Moderation & Operations)</option>
                  <option value="SUPER_ADMIN">Super Administrator (Full Team Governance & Deletion)</option>
                </select>
              </div>

              <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setInviteModalOpen(false)}
                  className="px-4 py-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 font-semibold text-slate-700 dark:text-slate-200 rounded-xl transition-colors text-sm"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={inviting}
                  className="px-5 py-2 bg-purple-600 hover:bg-purple-700 font-semibold text-white rounded-xl transition-colors text-sm disabled:opacity-50"
                >
                  {inviting ? 'Sending Invite...' : 'Send Invitation Token'}
                </button>
              </div>
            </form>
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
