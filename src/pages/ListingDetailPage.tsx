import React, { useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { Home } from 'lucide-react'
import { doc, serverTimestamp, setDoc } from 'firebase/firestore'
import { toast } from 'react-hot-toast'
import { getListingById } from '@/firebase/listings'
import { ImageGalleryModal } from '@/components/ui/ImageGalleryModal'
import { useAuthStore } from '@/store/authStore'
import { db } from '@/firebase/config'
import type { Listing } from '@/types'

const ListingDetailPage: React.FC = () => {
  const { listingId } = useParams<{ listingId: string }>()
  const navigate = useNavigate()
  const { currentUser } = useAuthStore()
  const [listing, setListing] = useState<Listing | null>(null)
  const [loading, setLoading] = useState(true)
  const [galleryIndex, setGalleryIndex] = useState<number | null>(null)

  const handleMessageOwner = async () => {
    if (!listing || !currentUser) return

    const chatId = [currentUser.uid, listing.hostId].sort().join('_')
    const chatData = {
      participants: [currentUser.uid, listing.hostId],
      status: 'matched',
      updatedAt: serverTimestamp(),
      lastMessage: '',
      unreadBy: [],
    }

    try {
      await setDoc(doc(db, 'chats', chatId), chatData, { merge: true })
      navigate(`/chat/${chatId}`)
    } catch (error: any) {
      if (error?.code === 'permission-denied') {
        toast.error('You must match with this user before sending a message!', {
          icon: '🔒',
        })
        return
      }
      toast.error('Could not start conversation. Please try again.')
      console.error(error)
    }
  }

  useEffect(() => {
    let cancelled = false

    ;(async () => {
      if (!listingId) {
        setLoading(false)
        return
      }

      try {
        const data = await getListingById(listingId)
        if (!cancelled) {
          setListing(data)
        }
      } catch (error) {
        console.error('Failed to load listing detail:', error)
        if (!cancelled) {
          setListing(null)
        }
      } finally {
        if (!cancelled) {
          setLoading(false)
        }
      }
    })()

    return () => {
      cancelled = true
    }
  }, [listingId])

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full text-slate-600 dark:text-slate-300">
        Loading listing...
      </div>
    )
  }

  if (!listing) {
    return (
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full">
        <div className="rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-8 text-center">
          <p className="text-slate-600 dark:text-slate-300">Listing not found.</p>
          <Link
            to="/discover"
            className="inline-flex mt-4 rounded-xl bg-blue-500 text-white px-4 py-2 text-sm font-semibold hover:bg-blue-600"
          >
            Back to Discover
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 pb-24 w-full">
      <div className="rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 overflow-hidden">
        {listing.photos.length > 0 ? (
          <div className="flex overflow-x-auto snap-x snap-mandatory gap-4 pb-4 no-scrollbar -mx-4 px-4 sm:mx-0 sm:px-0">
            {listing.photos.map((photo, index) => (
              <img
                key={index}
                src={photo}
                alt={`Room view ${index + 1}`}
                onClick={() => setGalleryIndex(index)}
                className="snap-center shrink-0 w-[85vw] sm:w-[60vw] md:w-[500px] h-64 md:h-[400px] rounded-2xl object-cover cursor-pointer hover:opacity-95 transition-opacity border border-slate-200 dark:border-slate-700"
              />
            ))}
          </div>
        ) : (
          <div className="w-full h-64 bg-slate-100 dark:bg-slate-700 flex items-center justify-center">
            <Home className="h-10 w-10 text-slate-400 dark:text-slate-500" />
          </div>
        )}

        <div className="p-6">
          <h1 className="text-2xl font-syne font-bold text-slate-900 dark:text-slate-50 mb-2">
            {listing.housingType} in {listing.zone}
          </h1>
          <p className="text-slate-600 dark:text-slate-300 mb-4">
            KES {listing.roommateShare.toLocaleString()} roommate share
          </p>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Amenities: {listing.amenities.length ? listing.amenities.join(', ') : 'Not specified'}
          </p>
        </div>
      </div>

      <div className="fixed bottom-0 left-0 right-0 md:left-64 bg-white/90 dark:bg-slate-900/90 backdrop-blur-md border-t border-slate-200 dark:border-slate-800 p-4 px-6 z-40 flex items-center justify-between pb-safe">
        <div>
          <p className="text-xs text-slate-500 dark:text-slate-400 font-bold uppercase tracking-wider">Total Rent</p>
          <p className="text-lg font-bold text-slate-900 dark:text-white">
            KES {listing.rentTotal}{' '}
            <span className="text-sm font-normal text-slate-500">/mo</span>
          </p>
        </div>
        <button
          onClick={handleMessageOwner}
          className="bg-blue-500 hover:bg-blue-600 text-white font-bold py-3 px-8 rounded-xl transition-colors shadow-sm"
        >
          Message Host
        </button>
      </div>

      {galleryIndex !== null && (
        <ImageGalleryModal
          images={listing.photos}
          initialIndex={galleryIndex}
          onClose={() => setGalleryIndex(null)}
        />
      )}
    </div>
  )
}

export default ListingDetailPage
