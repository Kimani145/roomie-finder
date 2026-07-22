import React, { useEffect, useState } from 'react'
import {
  Home,
  Search,
  RefreshCw,
  AlertCircle,
  Star,
  Trash2,
  CheckCircle2,
  PauseCircle,
  Flag,
} from 'lucide-react'
import toast from 'react-hot-toast'
import { fetchWithAuth } from '@/services/apiClient'
import { logger } from '@/utils/logger'
import { ConfirmationModal } from '@/components/ui/ConfirmationModal'

interface ListingDoc {
  id: string
  title: string
  hostId: string
  hostName?: string
  host?: {
    uid: string
    name: string
    email?: string
    role?: string
    avatar?: string
  }
  zone: string
  rentAmount: number
  status: 'active' | 'paused' | 'flagged' | 'filled'
  isFeatured: boolean
  isVerified: boolean
  images?: string[]
  description?: string
  createdAt?: string | null
}

export default function ListingsManagementPage() {
  const [listings, setListings] = useState<ListingDoc[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [actionLoading, setActionLoading] = useState<string | null>(null)

  // Filters & Search
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'paused' | 'flagged' | 'filled'>('all')
  const [searchQuery, setSearchQuery] = useState('')

  // Modal State
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

  const fetchListings = async () => {
    try {
      setLoading(true)
      setError(null)
      const params = new URLSearchParams()
      params.append('status', statusFilter)
      if (searchQuery.trim()) {
        params.append('search', searchQuery.trim())
      }
      const data = await fetchWithAuth(`/api/v1/admin/listings?${params.toString()}`)
      setListings(data.listings || [])
    } catch (err: any) {
      logger.error('Failed to fetch listings:', err)
      setError('Could not load listings management data. Verify admin permissions.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchListings()
  }, [statusFilter])

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    fetchListings()
  }

  const handleUpdateStatus = async (id: string, newStatus: ListingDoc['status']) => {
    try {
      setActionLoading(id)
      await fetchWithAuth(`/api/v1/admin/listings/${id}/status`, {
        method: 'PUT',
        body: JSON.stringify({ status: newStatus }),
      })
      toast.success(`Listing status updated to ${newStatus}`)
      await fetchListings()
    } catch (err) {
      logger.error('Error:', err)
      toast.error('Failed to update listing status')
    } finally {
      setActionLoading(null)
    }
  }

  const handleToggleFeatured = async (listing: ListingDoc) => {
    const nextFeatured = !listing.isFeatured
    try {
      setActionLoading(listing.id)
      await fetchWithAuth(`/api/v1/admin/listings/${listing.id}/featured`, {
        method: 'PUT',
        body: JSON.stringify({ isFeatured: nextFeatured }),
      })
      toast.success(nextFeatured ? 'Listing promoted to featured' : 'Listing unfeatured')
      await fetchListings()
    } catch (err) {
      logger.error('Error:', err)
      toast.error('Failed to toggle featured status')
    } finally {
      setActionLoading(null)
    }
  }

  const triggerDelete = (listing: ListingDoc) => {
    setConfirmModal({
      isOpen: true,
      title: 'Permanently Remove Listing',
      displayName: listing.title,
      actionSummary: `Are you sure you want to permanently delete listing "${listing.title}" (ID: ${listing.id})? This is a Super Admin action and cannot be undone.`,
      confirmText: 'Delete Listing',
      variant: 'danger',
      onConfirm: async () => {
        try {
          setActionLoading(listing.id)
          await fetchWithAuth(`/api/v1/admin/listings/${listing.id}`, {
            method: 'DELETE',
          })
          toast.success('Listing permanently deleted')
          await fetchListings()
        } catch (err: any) {
          logger.error('Error:', err)
          toast.error(err.message || 'Failed to delete listing (Super Admin permission required)')
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
            <Home className="w-8 h-8 text-brand-600 dark:text-brand-400" />
            Listings Administration
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Search, inspect, pause, feature, or remove accommodation listings across all university zones.
          </p>
        </div>
        <button
          onClick={fetchListings}
          className="inline-flex items-center gap-2 px-4 py-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-sm font-semibold rounded-xl transition-colors self-start sm:self-auto"
        >
          <RefreshCw className="w-4 h-4" />
          Refresh Listings
        </button>
      </div>

      {/* Controls Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800">
        {/* Search */}
        <form onSubmit={handleSearchSubmit} className="flex-1 relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by title, zone, or host ID..."
            className="w-full pl-10 pr-4 py-2.5 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-50 text-sm rounded-xl border border-slate-200 dark:border-slate-700 focus:outline-none focus:ring-2 focus:ring-brand-500"
          />
        </form>

        {/* Status Filters */}
        <div className="flex items-center gap-1 overflow-x-auto pb-1 md:pb-0">
          {(['all', 'active', 'paused', 'flagged', 'filled'] as const).map((st) => (
            <button
              key={st}
              onClick={() => setStatusFilter(st)}
              className={`px-3.5 py-2 text-xs font-bold rounded-xl transition-colors capitalize whitespace-nowrap ${
                statusFilter === st
                  ? 'bg-brand-600 text-white shadow-sm'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700'
              }`}
            >
              {st}
            </button>
          ))}
        </div>
      </div>

      {/* Content Grid */}
      {error ? (
        <div className="flex flex-col items-center justify-center p-12 text-center bg-white dark:bg-slate-900 border border-red-200 dark:border-red-900/50 rounded-2xl">
          <AlertCircle className="w-12 h-12 text-red-500 mb-4" />
          <h3 className="text-xl font-syne font-bold text-slate-900 dark:text-slate-50 mb-2">
            Failed to Load Listings
          </h3>
          <p className="text-slate-500 mb-4">{error}</p>
          <button
            onClick={fetchListings}
            className="px-4 py-2 bg-brand-600 text-white rounded-xl text-sm font-semibold"
          >
            Retry Connection
          </button>
        </div>
      ) : loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div
              key={i}
              className="h-64 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl animate-pulse"
            />
          ))}
        </div>
      ) : listings.length === 0 ? (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-16 text-center flex flex-col items-center justify-center">
          <Home className="w-12 h-12 text-slate-400 mb-4" />
          <h3 className="text-xl font-bold font-syne text-slate-900 dark:text-slate-50 mb-2">
            No Listings Found
          </h3>
          <p className="text-slate-500 text-sm">
            No listings matched your status filter or search parameters.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {listings.map((listing) => (
            <div
              key={listing.id}
              className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800/80 rounded-3xl p-5 shadow-sm hover:shadow-md transition-all flex flex-col justify-between"
            >
              <div className="space-y-3">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-xs font-mono text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-800 px-2 py-1 rounded-md">
                    {listing.zone}
                  </span>
                  <span
                    className={`text-xs font-bold px-2.5 py-0.5 rounded-full capitalize ${
                      listing.status === 'active'
                        ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-500/10 dark:text-emerald-400'
                        : listing.status === 'paused'
                        ? 'bg-amber-100 text-amber-800 dark:bg-amber-500/10 dark:text-amber-400'
                        : listing.status === 'flagged'
                        ? 'bg-red-100 text-red-800 dark:bg-red-500/10 dark:text-red-400'
                        : 'bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-400'
                    }`}
                  >
                    {listing.status}
                  </span>
                </div>

                <h3 className="font-syne font-bold text-slate-900 dark:text-slate-50 text-base line-clamp-1">
                  {listing.title}
                </h3>

                <p className="text-sm font-semibold text-brand-600 dark:text-brand-400">
                  KSh {listing.rentAmount.toLocaleString()} / mo
                </p>

                {listing.description && (
                  <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-2">
                    {listing.description}
                  </p>
                )}

                <div className="pt-2 border-t border-slate-100 dark:border-slate-800 text-xs text-slate-500 flex justify-between items-center">
                  <span>Host: <strong className="text-slate-800 dark:text-slate-200">{listing.host?.name || listing.hostName || 'Student Host'}</strong></span>
                  <span className="font-mono text-[10px] text-slate-400">({listing.hostId.slice(0, 6)})</span>
                </div>
              </div>

              {/* Actions */}
              <div className="pt-4 mt-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between gap-2">
                <button
                  onClick={() => handleToggleFeatured(listing)}
                  disabled={actionLoading === listing.id}
                  className={`p-2 rounded-xl text-xs font-bold transition-colors ${
                    listing.isFeatured
                      ? 'bg-amber-100 text-amber-700 dark:bg-amber-500/20 dark:text-amber-400'
                      : 'bg-slate-100 text-slate-500 hover:text-amber-600 dark:bg-slate-800 dark:text-slate-400'
                  }`}
                  title={listing.isFeatured ? 'Unfeature listing' : 'Mark featured'}
                >
                  <Star className={`w-4 h-4 ${listing.isFeatured ? 'fill-amber-500 text-amber-500' : ''}`} />
                </button>

                <div className="flex items-center gap-1.5">
                  {listing.status === 'active' ? (
                    <button
                      onClick={() => handleUpdateStatus(listing.id, 'paused')}
                      disabled={actionLoading === listing.id}
                      className="px-3 py-1.5 text-xs font-bold rounded-xl text-amber-700 bg-amber-50 hover:bg-amber-100 dark:text-amber-400 dark:bg-amber-500/10 transition-colors flex items-center gap-1"
                    >
                      <PauseCircle className="w-3.5 h-3.5" />
                      Pause
                    </button>
                  ) : (
                    <button
                      onClick={() => handleUpdateStatus(listing.id, 'active')}
                      disabled={actionLoading === listing.id}
                      className="px-3 py-1.5 text-xs font-bold rounded-xl text-emerald-700 bg-emerald-50 hover:bg-emerald-100 dark:text-emerald-400 dark:bg-emerald-500/10 transition-colors flex items-center gap-1"
                    >
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      Activate
                    </button>
                  )}

                  <button
                    onClick={() => handleUpdateStatus(listing.id, 'flagged')}
                    disabled={actionLoading === listing.id}
                    className="p-2 rounded-xl text-xs font-bold text-slate-500 hover:text-red-600 bg-slate-100 dark:bg-slate-800 dark:text-slate-400 transition-colors"
                    title="Flag listing"
                  >
                    <Flag className="w-4 h-4" />
                  </button>

                  <button
                    onClick={() => triggerDelete(listing)}
                    disabled={actionLoading === listing.id}
                    className="p-2 rounded-xl text-xs font-bold text-red-600 hover:bg-red-50 dark:hover:bg-red-500/10 transition-colors"
                    title="Delete listing (Super Admin)"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}
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
