import React, { useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { deleteDoc, updateDoc, doc } from 'firebase/firestore'
import toast from 'react-hot-toast'
import { Home } from 'lucide-react'
import { db } from '@/firebase/config'
import { useAuthStore } from '@/store/authStore'
import { useMyListings } from '@/hooks/useMyListings'
import type { Listing } from '@/types'

// ─── Status Badge ─────────────────────────────────────────────────────────────
function StatusBadge({ status }: { status: Listing['status'] }) {
  if (status === 'active') {
    return (
      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300">
        Active
      </span>
    )
  }
  if (status === 'paused') {
    return (
      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300">
        Paused
      </span>
    )
  }
  return (
    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-slate-100 text-slate-600 dark:bg-slate-700 dark:text-slate-300 capitalize">
      {status}
    </span>
  )
}

// ─── MyListingsPage ───────────────────────────────────────────────────────────
const MyListingsPage: React.FC = () => {
  const { currentUser } = useAuthStore()
  const navigate = useNavigate()
  const { myListings, isLoading } = useMyListings(currentUser?.uid)

  // Redirect SEEKERs — this page is HOST/FLEX only
  useEffect(() => {
    if (currentUser && currentUser.role === 'SEEKER') {
      navigate('/profile', { replace: true })
    }
  }, [currentUser, navigate])

  const handleDelete = async (listingId: string) => {
    const confirmed = window.confirm(
      'Are you sure you want to delete this listing? This cannot be undone.'
    )
    if (!confirmed) return

    try {
      await deleteDoc(doc(db, 'listings', listingId))
      toast.success('Listing deleted')
    } catch (err) {
      console.error('Delete listing error:', err)
      toast.error('Failed to delete listing')
    }
  }

  const handleTogglePause = async (listingId: string, currentStatus: Listing['status']) => {
    try {
      const newStatus = currentStatus === 'active' ? 'paused' : 'active'
      const statusText = newStatus === 'paused' ? 'paused' : 'activated'
      
      const updatePromise = updateDoc(doc(db, 'listings', listingId), {
        status: newStatus,
        updatedAt: Date.now() // Simple timestamp fallback since we aren't using serverTimestamp here
      })

      toast.promise(updatePromise, {
        loading: 'Updating status...',
        success: `Listing successfully ${statusText}!`,
        error: 'Failed to update status.',
      })
      
      await updatePromise
    } catch (error) {
      console.error('Toggle pause error:', error)
    }
  }

  if (isLoading) {
    return (
      <div className="max-w-5xl mx-auto py-8 w-full px-4 sm:px-6">
        <div className="h-8 w-48 rounded-lg bg-slate-200 dark:bg-slate-700 animate-pulse mb-6" />
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="h-32 rounded-2xl bg-slate-200 dark:bg-slate-800 animate-pulse"
            />
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-5xl mx-auto py-8 w-full px-4 sm:px-6">
      <h1 className="text-2xl font-syne font-bold text-slate-900 dark:text-slate-50 mb-6">
        Manage My Listings
      </h1>

      {myListings.length === 0 ? (
        /* ── Empty State ─────────────────────────────────────────────────── */
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-slate-100 dark:bg-slate-800">
            <Home className="h-8 w-8 text-slate-400 dark:text-slate-500" />
          </div>
          <p className="mb-2 text-lg font-semibold text-slate-700 dark:text-slate-200">
            You haven't posted any rooms yet.
          </p>
          <p className="mb-6 text-sm text-slate-500 dark:text-slate-400">
            Create your first listing to start finding compatible colonymates.
          </p>
          <Link
            to="/create-listing"
            className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-6 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-blue-700 active:scale-[0.98] transition-all"
          >
            Post a Room
          </Link>
        </div>
      ) : (
        /* ── Listings List ───────────────────────────────────────────────── */
        <div>
          {myListings.map((listing) => (
            <div
              key={listing.id}
              className="flex flex-col sm:flex-row bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl overflow-hidden mb-4 shadow-sm"
            >
              {/* Image Thumbnail */}
              {listing.photos.length > 0 ? (
                <img
                  src={listing.photos[0]}
                  alt={listing.housingType}
                  className="w-full sm:w-48 h-32 object-cover shrink-0"
                />
              ) : (
                <div className="w-full sm:w-48 h-32 bg-slate-100 dark:bg-slate-700 flex items-center justify-center shrink-0">
                  <Home className="h-8 w-8 text-slate-400 dark:text-slate-500" />
                </div>
              )}

              {/* Content */}
              <div className="flex-1 px-4 py-3 flex flex-col justify-center gap-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-semibold text-slate-900 dark:text-slate-50 text-sm">
                    {listing.housingType} · {listing.zone}
                  </span>
                  <StatusBadge status={listing.status} />
                </div>
                <p className="text-sm text-slate-600 dark:text-slate-300">
                  KES {listing.roommateShare.toLocaleString()}
                  <span className="text-xs text-slate-400 dark:text-slate-500">
                    {' '}/ roommate share
                  </span>
                </p>
                {listing.amenities.length > 0 && (
                  <p className="text-xs text-slate-500 dark:text-slate-400 truncate">
                    {listing.amenities.slice(0, 3).join(' · ')}
                    {listing.amenities.length > 3 &&
                      ` +${listing.amenities.length - 3} more`}
                  </p>
                )}
              </div>

              {/* Actions */}
              <div className="flex sm:flex-col justify-end gap-1 px-3 py-3 shrink-0 border-t sm:border-t-0 sm:border-l border-slate-100 dark:border-slate-700">
                <Link
                  to={`/create-listing?edit=${listing.id}`}
                  className="inline-flex items-center justify-center px-3 py-1.5 rounded-lg text-xs font-semibold text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-600 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
                >
                  Edit
                </Link>
                <button
                  type="button"
                  onClick={() => handleTogglePause(listing.id, listing.status)}
                  className="inline-flex items-center justify-center px-3 py-1.5 rounded-lg text-xs font-semibold text-amber-600 dark:text-amber-400 hover:bg-amber-50 dark:hover:bg-amber-900/20 transition-colors"
                >
                  {listing.status === 'paused' ? 'Resume' : 'Pause'}
                </button>
                <button
                  type="button"
                  onClick={() => handleDelete(listing.id)}
                  className="inline-flex items-center justify-center px-3 py-1.5 rounded-lg text-xs font-semibold text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                >
                  Delete
                </button>
              </div>
            </div>
          ))}

          <Link
            to="/create-listing"
            className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-blue-700 active:scale-[0.98] transition-all mt-2"
          >
            Post Another Room
          </Link>
        </div>
      )}

      {/* Bottom padding for mobile nav */}
      <div className="h-20" aria-hidden="true" />
    </div>
  )
}

export default MyListingsPage
