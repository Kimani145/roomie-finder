import React, { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import {
  ChevronLeft,
  CheckCircle,
  Moon,
  Zap,
  Wind,
  Wine,
} from 'lucide-react'
import { ProgressBar } from '@/components/ui/ProgressBar'
import { formatBudget } from '@/utils/formatters'
import { useAuthStore } from '@/store/authStore'
import { getUserProfile } from '@/firebase/profiles'
import { hasLiked, likeProfile } from '@/firebase/matches'
import { useMatchStore } from '@/store/useMatchStore'
import { calculateCompatibilityScore, getCompatibilityPercentage } from '@/engine/compatibilityEngine'
import type { UserProfile, ScoreBreakdown } from '@/types'

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
  const [isSubmittingLike, setIsSubmittingLike] = useState(false)
  const [actionError, setActionError] = useState<string | null>(null)
  const [likeSent, setLikeSent] = useState(false)

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

  function getInitials(name: string): string {
    if (!name) return '?'
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2)
  }

  const activityStatus = getActivityStatus(profile.lastActive)
  const primaryZone = profile.zones?.[0] || '—'
  const isSelfProfile = !!currentUser && currentUser.uid === profile.uid

  const handleMatchClick = async () => {
    if (!currentUser || !profile || isSubmittingLike || isSelfProfile) return

    setIsSubmittingLike(true)
    setActionError(null)
    try {
      const result = await likeProfile(currentUser.uid, profile.uid)

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
            uid: profile.uid,
            name: profile.displayName,
            avatar: profile.photoURL,
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

  return (
    // Desktop Containerization: slate-50 background, centered floating card on desktop
    <div className="bg-slate-50 dark:bg-slate-950 min-h-screen">
      {/* Centered profile card container - full screen on mobile, floating card on desktop */}
      <div className="max-w-3xl mx-auto bg-white dark:bg-slate-900 min-h-screen md:min-h-[calc(100vh-4rem)] md:my-8 md:rounded-2xl md:shadow-xl overflow-hidden relative pb-24 border border-transparent dark:border-slate-800">
        <div className="relative">
          <div className="w-full h-32 bg-slate-200 dark:bg-slate-800" />

          <button
            onClick={() => navigate('/discover')}
            className="absolute top-4 left-4 z-10 bg-white/80 dark:bg-slate-900/80 backdrop-blur rounded-full p-2 hover:bg-white dark:hover:bg-slate-900 transition-colors outline-none focus-visible:ring-2 focus-visible:ring-blue-400"
            aria-label="Go back"
          >
            <ChevronLeft className="w-5 h-5 text-slate-900 dark:text-slate-50" />
          </button>
        </div>

        <div className="w-24 h-24 rounded-full bg-slate-100 dark:bg-slate-800 border-4 border-white dark:border-slate-900 shadow-sm flex items-center justify-center -mt-12 ml-6 text-3xl font-syne font-bold text-slate-300 dark:text-slate-500 overflow-hidden">
          {profile.photoURL ? (
            <img
              src={profile.photoURL}
              alt={profile.displayName}
              className="h-full w-full object-cover"
            />
          ) : (
            getInitials(profile.displayName)
          )}
        </div>

        <div className="px-6 pt-3 pb-4">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <h1 className="font-syne text-2xl font-bold text-slate-900 dark:text-slate-50 leading-tight">
                {profile.displayName}, {profile.age}
              </h1>
              <p className="text-sm text-slate-500 dark:text-slate-400 leading-tight">
                Year {profile.courseYear} • {profile.school}
              </p>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                {activityStatus}
              </p>
            </div>

            <div className="bg-emerald-500 text-white px-4 py-2 rounded-2xl text-lg font-black shadow-md border-2 border-emerald-400 whitespace-nowrap">
              {compatibilityScore}% Compatible
            </div>
          </div>
        </div>

        {/* Budget & Zone Block */}
        <div className="bg-slate-50 dark:bg-slate-800/60 p-5 rounded-2xl border border-slate-100 dark:border-slate-700 mb-6 mx-6">
          <div className="flex items-center justify-between text-sm">
            <div>
              <p className="text-slate-500 dark:text-slate-400 font-medium">Budget</p>
              <p className="font-bold text-slate-900 dark:text-slate-50 text-lg">
                {formatBudget(profile.minBudget, profile.maxBudget)}
              </p>
            </div>
            <div className="text-right">
              <p className="text-slate-500 dark:text-slate-400 font-medium">Zone</p>
              <p className="font-bold text-slate-900 dark:text-slate-50 text-lg">
                {primaryZone}
              </p>
            </div>
          </div>
        </div>

        {/* Compatibility Breakdown */}
        <div className="bg-slate-50 dark:bg-slate-800/60 p-5 rounded-2xl border border-slate-100 dark:border-slate-700 mb-6 mx-6">
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
                  Their budget: KES {profile.minBudget} - {profile.maxBudget}
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
                  Cleanliness: {profile.lifestyle.cleanlinessLevel}
                </span>
              </div>

              <div>
                <ProgressBar
                  label="Sleep Schedule"
                  percentage={(scoreBreakdown.sleepMatch / 15) * 100}
                  color="emerald"
                />
                <span className="text-xs text-slate-500 dark:text-slate-400 mt-1 block">
                  Sleep preference: {profile.lifestyle.sleepTime}
                </span>
              </div>

              <div>
                <ProgressBar
                  label="Noise Tolerance"
                  percentage={(scoreBreakdown.noiseMatch / 10) * 100}
                  color="emerald"
                />
                <span className="text-xs text-slate-500 dark:text-slate-400 mt-1 block">
                  Noise tolerance: {profile.lifestyle.noiseTolerance}
                </span>
              </div>
            </div>
          ) : (
            <p className="text-sm text-slate-500 dark:text-slate-400">
              Sign in to see full compatibility
            </p>
          )}
        </div>

        {/* Bio Section */}
        {profile.bio && (
          <div className="bg-slate-50 dark:bg-slate-800/60 p-5 rounded-2xl border border-slate-100 dark:border-slate-700 mb-6 mx-6">
            <h3 className="font-syne text-sm font-bold text-slate-900 dark:text-slate-50 mb-2">
              About
            </h3>
            <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
              {profile.bio}
            </p>
          </div>
        )}

        {/* Living Habits & Preferences */}
        <div className="bg-slate-50 dark:bg-slate-800/60 p-5 rounded-2xl border border-slate-100 dark:border-slate-700 mb-6 mx-6">
          <h2 className="font-syne text-lg font-bold text-slate-900 dark:text-slate-50 mb-4">
            Living Habits & Preferences
          </h2>

          <div className="space-y-3">
            {!profile.lifestyle.smoking && (
              <div className="flex items-center gap-3">
                <CheckCircle className="w-5 h-5 text-emerald-500 dark:text-emerald-300 flex-shrink-0" />
                <span className="text-sm text-slate-700 dark:text-slate-200 font-medium">
                  Non-Smoker
                </span>
              </div>
            )}

            {!profile.lifestyle.alcohol && (
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
                {profile.lifestyle.sleepTime} Bird
              </span>
            </div>

            <div className="flex items-center gap-3">
              <Zap className="w-5 h-5 text-slate-400 dark:text-slate-500 flex-shrink-0" />
              <span className="text-sm text-slate-700 dark:text-slate-200 font-medium">
                {profile.lifestyle.cleanlinessLevel} Cleanliness Standard
              </span>
            </div>

            <div className="flex items-center gap-3">
              <Wind className="w-5 h-5 text-slate-400 dark:text-slate-500 flex-shrink-0" />
              <span className="text-sm text-slate-700 dark:text-slate-200 font-medium">
                {profile.lifestyle.noiseTolerance} Noise Tolerance
              </span>
            </div>
          </div>
        </div>

        {/* Sticky Action Dock - locked to centered container bottom */}
        <div className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-3xl bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-700 p-4 flex gap-4 pb-safe md:rounded-b-2xl md:pb-4">
          <button
            onClick={() => console.log('Pass')}
            className="flex-[1] py-4 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-bold hover:bg-slate-200 dark:hover:bg-slate-700 hover:text-slate-900 dark:hover:text-slate-50 transition-colors border border-slate-200 dark:border-slate-700"
          >
            Pass
          </button>
          <button
            onClick={handleMatchClick}
            disabled={isSubmittingLike || likeSent || isSelfProfile}
            className="flex-[2] py-4 rounded-xl bg-brand-500 text-white font-bold shadow-lg shadow-brand-500/30 hover:bg-brand-600 transition-all disabled:bg-brand-300 disabled:cursor-not-allowed disabled:shadow-none"
          >
            {isSelfProfile
              ? 'This is you'
              : isSubmittingLike
                ? 'Matching...'
                : likeSent
                  ? 'Like sent'
                  : 'Match'}
          </button>
        </div>
        {actionError && (
          <p className="fixed bottom-[5.25rem] left-1/2 z-20 w-full max-w-3xl -translate-x-1/2 px-4 text-center text-sm text-red-600 dark:text-red-300">
            {actionError}
          </p>
        )}
      </div>
    </div>
  )
}

export default ProfileDetailPage
