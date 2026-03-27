import React, { useState, useEffect } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import {
  ChevronLeft,
  CheckCircle,
  Home,
  Moon,
  Zap,
  Wind,
  Wine,
} from 'lucide-react'
import { collection, getDocs, query, where } from 'firebase/firestore'
import { ProgressBar } from '@/components/ui/ProgressBar'
import { formatBudget } from '@/utils/formatters'
import { useAuthStore } from '@/store/authStore'
import { getUserProfile } from '@/firebase/profiles'
import { hasLiked, likeProfile } from '@/firebase/matches'
import { db } from '@/firebase/config'
import { useMatchStore } from '@/store/useMatchStore'
import { calculateCompatibilityScore, getCompatibilityPercentage } from '@/engine/compatibilityEngine'
import { ImageGalleryModal } from '@/components/ui/ImageGalleryModal'
import type { Listing, UserProfile, ScoreBreakdown } from '@/types'

const DEFAULT_GRADIENT =
  'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800 600"><defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1"><stop offset="0%" stop-color="%231d4ed8"/><stop offset="100%" stop-color="%230f172a"/></linearGradient></defs><rect width="800" height="600" fill="url(%23g)"/></svg>'

const ProfileDetailPage: React.FC = () => {
  const { uid } = useParams<{ uid: string }>()
  const navigate = useNavigate()
  const { currentUser } = useAuthStore()
  const openMatch = useMatchStore((state) => state.openMatch)

  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [loading, setLoading] = useState<boolean>(true)
  const [error, setError] = useState<string | null>(null)
  const [scoreBreakdown, setScoreBreakdown] = useState<ScoreBreakdown | null>(null)
  const [compatibilityScore, setCompatibilityScore] = useState<number>(0)
  const [hostListing, setHostListing] = useState<Listing | null>(null)
  const [isSubmittingLike, setIsSubmittingLike] = useState(false)
  const [actionError, setActionError] = useState<string | null>(null)
  const [likeSent, setLikeSent] = useState(false)
  const [galleryOpen, setGalleryOpen] = useState(false)
  const [galleryStartIndex, setGalleryStartIndex] = useState(0)

  useEffect(() => {
    let isMounted = true

    const fetchProfile = async () => {
      if (!uid) {
        if (isMounted) {
          setError('No user ID provided')
          setLoading(false)
        }
        return
      }

      setLoading(true)
      setActionError(null)
      setLikeSent(false)
      try {
        const fetchedProfile = await getUserProfile(uid)
        
        if (isMounted) {
          if (fetchedProfile) {
            setProfile(fetchedProfile)
            if (currentUser) {
              const breakdown = calculateCompatibilityScore(currentUser, fetchedProfile)
              const score = getCompatibilityPercentage(breakdown.totalScore)
              setScoreBreakdown(breakdown)
              setCompatibilityScore(score)

              if (currentUser.uid !== fetchedProfile.uid) {
                try {
                  const alreadyLiked = await hasLiked(currentUser.uid, fetchedProfile.uid)
                  if (isMounted) setLikeSent(alreadyLiked)
                } catch (likeErr: any) {
                  if (
                    likeErr?.code !== 'permission-denied' &&
                    likeErr?.code !== 'not-found'
                  ) {
                    console.warn('Failed to check existing like state', likeErr)
                  }
                }
              }
            }
          } else {
            setError('Profile not found')
          }
        }
      } catch (err) {
        if (isMounted) {
          console.error('Failed to fetch profile', err)
          setError('Failed to fetch profile data.')
        }
      } finally {
        if (isMounted) {
          setLoading(false)
        }
      }
    }

    fetchProfile()

    return () => {
      isMounted = false
    }
  }, [uid, currentUser])

  useEffect(() => {
    let isMounted = true

    const fetchHostListing = async () => {
      if (!profile || profile.role !== 'HOST') {
        if (isMounted) setHostListing(null)
        return
      }

      try {
        const listingQuery = query(
          collection(db, 'listings'),
          where('hostId', '==', profile.uid),
          where('status', '==', 'active')
        )

        const snapshot = await getDocs(listingQuery)

        if (!isMounted) return

        if (snapshot.empty) {
          setHostListing(null)
          return
        }

        const firstListing = snapshot.docs[0]
        setHostListing({ id: firstListing.id, ...(firstListing.data() as Omit<Listing, 'id'>) })
      } catch (err) {
        console.error('Failed to fetch host listing', err)
        if (isMounted) setHostListing(null)
      }
    }

    fetchHostListing()

    return () => {
      isMounted = false
    }
  }, [profile])

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen text-blue-600 dark:text-blue-400 font-syne font-bold bg-slate-50 dark:bg-slate-950">
        Loading profile...
      </div>
    )
  }

  if (error || !profile) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex items-center justify-center">
        <div className="text-center">
          <p className="text-slate-600 dark:text-slate-300">
            {error || 'Profile not found'}
          </p>
          <button
            onClick={() => navigate('/discover')}
            className="mt-4 text-blue-600 dark:text-blue-400 font-bold hover:text-blue-700 dark:hover:text-blue-300"
          >
            Back to Discovery
          </button>
        </div>
      </div>
    )
  }

  // Helper functions
  function getActivityStatus(lastActive: Date | { seconds: number; nanoseconds: number } | string | null | undefined): string {
    if (!lastActive) return 'Unknown activity'
    
    // Handle Firestore Timestamp or string
    let lastActiveDate: Date
    if (typeof lastActive === 'object' && 'seconds' in lastActive) {
      lastActiveDate = new Date(lastActive.seconds * 1000)
    } else {
      lastActiveDate = new Date(lastActive as any)
    }
    
    const now = new Date()
    const diffMs = now.getTime() - lastActiveDate.getTime()
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60))

    if (diffHours === 0) return 'Active now'
    if (diffHours < 24) return `Active ${diffHours}h ago`

    const diffDays = Math.floor(diffHours / 24)
    if (diffDays === 1) return 'Active yesterday'
    return `Active ${diffDays}d ago`
  }

  const viewedUser = profile
  const activityStatus = getActivityStatus(viewedUser.lastActive)
  const primaryZone = viewedUser.zones?.[0] || '—'
  const isSelfProfile = !!currentUser && currentUser.uid === viewedUser.uid
  const coverImg = hostListing?.photos?.[0] || viewedUser.photoURL || DEFAULT_GRADIENT
  const additionalPhotos = hostListing?.photos?.slice(1, 5) ?? []

  const handleMatchClick = async () => {
    if (!currentUser || !viewedUser || isSubmittingLike || isSelfProfile) return

    setIsSubmittingLike(true)
    setActionError(null)
    try {
      const result = await likeProfile(currentUser.uid, viewedUser.uid)

      if (result.matched && result.matchId) {
        await new Promise<void>((resolve) => {
          window.setTimeout(resolve, 800)
        })
        openMatch({
          matchId: result.matchId,
          userA: {
            uid: currentUser.uid,
            name: currentUser.displayName,
            avatar: currentUser.photoURL,
          },
          userB: {
            uid: viewedUser.uid,
            name: viewedUser.displayName,
            avatar: viewedUser.photoURL,
          },
        })
        return
      }

      setLikeSent(true)
    } catch (err: any) {
      console.error('Failed to like profile', err)
      if (err?.code === 'permission-denied') {
        setActionError("You don't have permission to perform this action.")
      } else {
        setActionError('Failed to send like. Please try again.')
      }
    } finally {
      setIsSubmittingLike(false)
    }
  }

  const handlePassClick = () => {
    navigate('/discover')
  }

  return (
    <div className="bg-slate-50 dark:bg-slate-950 min-h-screen">
      <div className="max-w-7xl mx-auto w-full grid grid-cols-1 lg:grid-cols-12 gap-0 lg:gap-8 lg:p-8">
        <div className="lg:col-span-7 flex flex-col gap-4">
          <div
            className="relative w-full h-80 sm:h-96 lg:h-[500px] lg:rounded-2xl overflow-hidden group cursor-pointer"
            onClick={() => {
              setGalleryStartIndex(0)
              setGalleryOpen(true)
            }}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                setGalleryStartIndex(0)
                setGalleryOpen(true)
              }
            }}
            aria-label="Open full-screen gallery"
          >
            <img
              src={coverImg}
              alt={viewedUser.displayName}
              className="object-cover w-full h-full"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-slate-900/40 to-transparent flex flex-col justify-end p-6">
              <button
                onClick={() => navigate('/discover')}
                className="absolute top-4 left-4 z-10 bg-white/80 dark:bg-slate-900/80 backdrop-blur rounded-full p-2 hover:bg-white dark:hover:bg-slate-900 transition-colors outline-none focus-visible:ring-2 focus-visible:ring-blue-400"
                aria-label="Go back"
              >
                <ChevronLeft className="w-5 h-5 text-slate-900 dark:text-slate-50" />
              </button>
              <div className="flex items-end justify-between gap-3">
                <div className="min-w-0">
                  <h1 className="text-3xl font-bold text-white">
                    {viewedUser.displayName}, {viewedUser.age}
                  </h1>
                  <p className="text-sm text-white/90 mt-1">
                    Year {viewedUser.courseYear} • {viewedUser.school}
                  </p>
                </div>
                <div className="bg-emerald-500 text-white px-4 py-2 rounded-2xl text-sm font-black shadow-md border border-emerald-400 whitespace-nowrap">
                  {compatibilityScore}% Match
                </div>
              </div>
            </div>
          </div>

          {additionalPhotos.length > 0 && (
            <div className="hidden lg:grid grid-cols-4 gap-3">
              {additionalPhotos.map((photo, i) => (
                <div
                  key={`${photo}-${i}`}
                  className="h-24 rounded-xl overflow-hidden border border-slate-200 dark:border-slate-700 cursor-pointer hover:opacity-80 transition-opacity"
                  onClick={() => {
                    setGalleryStartIndex(i + 1)
                    setGalleryOpen(true)
                  }}
                  role="button"
                  tabIndex={0}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      setGalleryStartIndex(i + 1)
                      setGalleryOpen(true)
                    }
                  }}
                  aria-label={`Open full-screen gallery at image ${i + 2}`}
                >
                  <img
                    src={photo}
                    alt={`Room preview ${i + 2}`}
                    className="h-full w-full object-cover"
                  />
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="lg:col-span-5 flex flex-col gap-6 p-6 lg:p-0 pb-24 lg:pb-0">
          {hostListing && (
            <Link
              to={`/listing/${hostListing.id}`}
              className="bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-4 flex items-center justify-between hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
            >
              <div>
                <p className="text-sm font-semibold text-slate-900 dark:text-slate-50">
                  KES {hostListing.roommateShare.toLocaleString()} • {hostListing.zone}
                </p>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                  {hostListing.housingType}
                </p>
              </div>
              <span className="text-sm font-medium text-blue-600 dark:text-blue-400 inline-flex items-center gap-1">
                <Home className="h-4 w-4" />
                View Room
              </span>
            </Link>
          )}

          <div className="bg-slate-50 dark:bg-slate-800/60 p-5 rounded-2xl border border-slate-100 dark:border-slate-700">
            <div className="flex items-center justify-between text-sm">
              <div>
                <p className="text-slate-500 dark:text-slate-400 font-medium">Budget</p>
                <p className="font-bold text-slate-900 dark:text-slate-50 text-lg">
                  {formatBudget(viewedUser.minBudget, viewedUser.maxBudget)}
                </p>
              </div>
              <div className="text-right">
                <p className="text-slate-500 dark:text-slate-400 font-medium">Zone</p>
                <p className="font-bold text-slate-900 dark:text-slate-50 text-lg">
                  {primaryZone}
                </p>
              </div>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-2">{activityStatus}</p>
          </div>

          <div className="bg-slate-50 dark:bg-slate-800/60 p-5 rounded-2xl border border-slate-100 dark:border-slate-700">
          <h2 className="font-syne text-lg font-bold text-slate-900 dark:text-slate-50 mb-4">
            Compatibility Breakdown
          </h2>

          {scoreBreakdown ? (
            <div className="space-y-4">
              <div>
                <ProgressBar
                  label="Budget Overlap"
                  percentage={scoreBreakdown.budgetOverlap ? 100 : 0}
                  color={scoreBreakdown.budgetOverlap ? "emerald" : "amber"}
                />
                <span className="text-xs text-slate-500 dark:text-slate-400 mt-1 block">
                  Their budget: KES {viewedUser.minBudget} - {viewedUser.maxBudget}
                </span>
              </div>

              <div>
                <ProgressBar
                  label="Zone Match"
                  percentage={Math.min(100, (scoreBreakdown.zoneMatch / 20) * 100)}
                  color={scoreBreakdown.zoneMatch > 0 ? "emerald" : "amber"}
                />
                <span className="text-xs text-slate-500 dark:text-slate-400 mt-1 block">
                  Prefers {primaryZone}
                </span>
              </div>

              <div>
                <ProgressBar
                  label="Cleanliness Match"
                  percentage={(scoreBreakdown.cleanlinessMatch / 20) * 100}
                  color="emerald"
                />
                <span className="text-xs text-slate-500 dark:text-slate-400 mt-1 block">
                  Cleanliness: {viewedUser.lifestyle.cleanlinessLevel}
                </span>
              </div>

              <div>
                <ProgressBar
                  label="Sleep Schedule"
                  percentage={(scoreBreakdown.sleepMatch / 15) * 100}
                  color="emerald"
                />
                <span className="text-xs text-slate-500 dark:text-slate-400 mt-1 block">
                  Sleep preference: {viewedUser.lifestyle.sleepTime}
                </span>
              </div>

              <div>
                <ProgressBar
                  label="Noise Tolerance"
                  percentage={(scoreBreakdown.noiseMatch / 10) * 100}
                  color="emerald"
                />
                <span className="text-xs text-slate-500 dark:text-slate-400 mt-1 block">
                  Noise tolerance: {viewedUser.lifestyle.noiseTolerance}
                </span>
              </div>
            </div>
          ) : (
            <p className="text-sm text-slate-500 dark:text-slate-400">
              Sign in to see full compatibility
            </p>
          )}
        </div>

          {viewedUser.bio && (
            <div className="bg-slate-50 dark:bg-slate-800/60 p-5 rounded-2xl border border-slate-100 dark:border-slate-700">
            <h3 className="font-syne text-sm font-bold text-slate-900 dark:text-slate-50 mb-2">
              About
            </h3>
            <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
              {viewedUser.bio}
            </p>
          </div>
        )}

          <div className="bg-slate-50 dark:bg-slate-800/60 p-5 rounded-2xl border border-slate-100 dark:border-slate-700">
          <h2 className="font-syne text-lg font-bold text-slate-900 dark:text-slate-50 mb-4">
            Living Habits & Preferences
          </h2>

          <div className="space-y-3">
            {!viewedUser.lifestyle.smoking && (
              <div className="flex items-center gap-3">
                <CheckCircle className="w-5 h-5 text-emerald-500 dark:text-emerald-300 flex-shrink-0" />
                <span className="text-sm text-slate-700 dark:text-slate-200 font-medium">
                  Non-Smoker
                </span>
              </div>
            )}

            {!viewedUser.lifestyle.alcohol && (
              <div className="flex items-center gap-3">
                <Wine className="w-5 h-5 text-emerald-500 dark:text-emerald-300 flex-shrink-0" />
                <span className="text-sm text-slate-700 dark:text-slate-200 font-medium">
                  No Alcohol
                </span>
              </div>
            )}

            <div className="flex items-center gap-3">
              <Moon className="w-5 h-5 text-slate-400 dark:text-slate-500 flex-shrink-0" />
              <span className="text-sm text-slate-700 dark:text-slate-200 font-medium">
                {viewedUser.lifestyle.sleepTime} Bird
              </span>
            </div>

            <div className="flex items-center gap-3">
              <Zap className="w-5 h-5 text-slate-400 dark:text-slate-500 flex-shrink-0" />
              <span className="text-sm text-slate-700 dark:text-slate-200 font-medium">
                {viewedUser.lifestyle.cleanlinessLevel} Cleanliness Standard
              </span>
            </div>

            <div className="flex items-center gap-3">
              <Wind className="w-5 h-5 text-slate-400 dark:text-slate-500 flex-shrink-0" />
              <span className="text-sm text-slate-700 dark:text-slate-200 font-medium">
                {viewedUser.lifestyle.noiseTolerance} Noise Tolerance
              </span>
            </div>
          </div>
          </div>

          <div className="mt-auto">
            <div className="flex gap-4">
              <button
                onClick={handlePassClick}
                className="flex-1 py-3 rounded-xl border-2 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 font-bold hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
              >
                Pass
              </button>
              <button
                onClick={handleMatchClick}
                disabled={likeSent || isSubmittingLike || isSelfProfile}
                className="flex-1 py-3 rounded-xl bg-blue-500 text-white font-bold hover:bg-blue-600 transition-colors shadow-sm disabled:bg-blue-300 disabled:cursor-not-allowed"
              >
                {isSelfProfile
                  ? 'This is you'
                  : isSubmittingLike
                    ? 'Sending...'
                    : likeSent
                      ? 'Liked'
                      : 'Like Profile'}
              </button>
            </div>
            {actionError && (
              <p className="mt-3 text-sm text-red-600 dark:text-red-300">{actionError}</p>
            )}
          </div>
        </div>
      </div>

      {galleryOpen && hostListing?.photos && (
        <ImageGalleryModal
          images={hostListing.photos}
          initialIndex={galleryStartIndex}
          onClose={() => setGalleryOpen(false)}
        />
      )}
    </div>
  )
}

export default ProfileDetailPage
