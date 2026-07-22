import { useState } from 'react'
import { Heart, Home, User, Trash2, ArrowRight, Sparkles } from 'lucide-react'
import { Link } from 'react-router-dom'
import { useFavorites } from '@/hooks/useFavorites'

export default function SavedPage() {
  const [activeTab, setActiveTab] = useState<'listings' | 'roommates'>('listings')
  const { favorites, loading, removeFavorite } = useFavorites()

  const savedListings = favorites.filter((f) => f.targetType === 'listing')
  const savedRoommates = favorites.filter((f) => f.targetType === 'profile')

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-syne font-bold text-slate-900 dark:text-slate-50 flex items-center gap-3">
            <Heart className="w-8 h-8 text-pink-500 fill-pink-500" />
            Wishlist & Saved Items
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Keep track of your favorite room listings and potential roommate candidates.
          </p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-slate-200 dark:border-slate-800">
        <button
          onClick={() => setActiveTab('listings')}
          className={`py-3 px-6 font-syne font-bold text-sm border-b-2 transition-all flex items-center gap-2 ${
            activeTab === 'listings'
              ? 'border-brand-600 text-brand-600 dark:border-brand-400 dark:text-brand-400'
              : 'border-transparent text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200'
          }`}
        >
          <Home className="w-4 h-4" />
          Saved Listings ({savedListings.length})
        </button>
        <button
          onClick={() => setActiveTab('roommates')}
          className={`py-3 px-6 font-syne font-bold text-sm border-b-2 transition-all flex items-center gap-2 ${
            activeTab === 'roommates'
              ? 'border-brand-600 text-brand-600 dark:border-brand-400 dark:text-brand-400'
              : 'border-transparent text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200'
          }`}
        >
          <User className="w-4 h-4" />
          Saved Roommates ({savedRoommates.length})
        </button>
      </div>

      {/* Grid Content */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="h-64 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl animate-pulse"
            />
          ))}
        </div>
      ) : activeTab === 'listings' ? (
        savedListings.length === 0 ? (
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-16 text-center flex flex-col items-center">
            <Home className="w-12 h-12 text-slate-400 mb-4" />
            <h3 className="text-xl font-syne font-bold text-slate-900 dark:text-slate-50 mb-2">
              No Saved Listings
            </h3>
            <p className="text-slate-500 text-sm max-w-sm mb-6">
              You haven&apos;t saved any accommodation listings to your wishlist yet.
            </p>
            <Link
              to="/discover"
              className="px-5 py-2.5 rounded-xl bg-brand-600 text-white text-sm font-semibold hover:bg-brand-700 transition-colors"
            >
              Discover Places
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {savedListings.map((item) => {
              const listing = item.targetData || {}
              return (
                <div
                  key={item.id}
                  className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800/80 rounded-3xl overflow-hidden shadow-sm hover:shadow-md transition-all flex flex-col justify-between"
                >
                  <div className="relative h-44 bg-slate-100 dark:bg-slate-800">
                    <img
                      src={listing.images?.[0] || listing.photos?.[0] || '/placeholder-listing.webp'}
                      alt={listing.title || 'Listing'}
                      onError={(e) => {
                        e.currentTarget.src = 'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?auto=format&fit=crop&w=600&q=80'
                      }}
                      className="w-full h-full object-cover"
                      loading="lazy"
                    />
                    <button
                      onClick={() => removeFavorite(item.id)}
                      className="absolute top-3 right-3 p-2 rounded-full bg-white/90 dark:bg-slate-900/90 text-red-500 hover:bg-white shadow-md transition-transform active:scale-95"
                      title="Remove from saved"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                    <span className="absolute bottom-3 left-3 bg-slate-900/80 backdrop-blur-md text-white text-xs font-mono px-2.5 py-1 rounded-md">
                      {listing.zone || 'Nairobi'}
                    </span>
                  </div>

                  <div className="p-5 space-y-3 flex-1 flex flex-col justify-between">
                    <div>
                      <h3 className="font-syne font-bold text-slate-900 dark:text-slate-50 text-base line-clamp-1">
                        {listing.title || `Listing ${item.targetId.slice(0, 8)}`}
                      </h3>
                      <p className="text-sm font-semibold text-brand-600 dark:text-brand-400 mt-1">
                        KSh {(listing.roommateShare || listing.rentAmount || 0).toLocaleString()} / mo
                      </p>
                    </div>

                    <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
                      <Link
                        to={`/listing/${item.targetId}`}
                        className="inline-flex items-center gap-1 text-xs font-bold text-brand-600 dark:text-brand-400 hover:underline"
                      >
                        View details <ArrowRight className="w-3.5 h-3.5" />
                      </Link>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )
      ) : savedRoommates.length === 0 ? (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-16 text-center flex flex-col items-center">
          <User className="w-12 h-12 text-slate-400 mb-4" />
          <h3 className="text-xl font-syne font-bold text-slate-900 dark:text-slate-50 mb-2">
            No Saved Roommates
          </h3>
          <p className="text-slate-500 text-sm max-w-sm mb-6">
            You haven&apos;t saved any roommate candidate profiles yet.
          </p>
          <Link
            to="/discover"
            className="px-5 py-2.5 rounded-xl bg-brand-600 text-white text-sm font-semibold hover:bg-brand-700 transition-colors"
          >
            Explore Roommates
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {savedRoommates.map((item) => {
            const profile = item.targetData || {}
            return (
              <div
                key={item.id}
                className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800/80 rounded-3xl p-6 shadow-sm hover:shadow-md transition-all flex flex-col justify-between"
              >
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      {profile.photoURL ? (
                        <img
                          src={profile.photoURL}
                          alt={profile.displayName}
                          className="w-12 h-12 rounded-full object-cover"
                        />
                      ) : (
                        <div className="w-12 h-12 rounded-full bg-brand-100 text-brand-600 flex items-center justify-center font-bold font-syne text-lg">
                          {profile.displayName?.charAt(0)?.toUpperCase() || '?'}
                        </div>
                      )}
                      <div>
                        <h3 className="font-syne font-bold text-slate-900 dark:text-slate-50 text-base">
                          {profile.displayName || 'Roommate Candidate'}
                        </h3>
                        <p className="text-xs text-slate-500 capitalize">
                          {profile.role || 'SEEKER'} • {profile.courseYear || 'Student'}
                        </p>
                      </div>
                    </div>
                    <button
                      onClick={() => removeFavorite(item.id)}
                      className="p-2 text-slate-400 hover:text-red-500 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                      title="Remove from saved"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>

                  <div className="text-xs text-slate-600 dark:text-slate-300 space-y-1">
                    <p>Budget: KSh {profile.minBudget?.toLocaleString()} - KSh {profile.maxBudget?.toLocaleString()}</p>
                    {profile.zones?.length > 0 && <p>Zones: {profile.zones.join(', ')}</p>}
                  </div>
                </div>

                <div className="pt-4 mt-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
                  <Link
                    to={`/profile/${item.targetId}`}
                    className="inline-flex items-center gap-1 text-xs font-bold text-brand-600 dark:text-brand-400 hover:underline"
                  >
                    View profile <Sparkles className="w-3.5 h-3.5" />
                  </Link>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
