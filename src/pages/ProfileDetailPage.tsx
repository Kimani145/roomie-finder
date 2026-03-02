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
import { calculateCompatibilityScore, getCompatibilityPercentage } from '@/engine/compatibilityEngine'
import type { UserProfile, ScoreBreakdown } from '@/types'

const ProfileDetailPage: React.FC = () => {
  const { uid } = useParams<{ uid: string }>()
  const navigate = useNavigate()
  const { currentUser } = useAuthStore()

  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [loading, setLoading] = useState<boolean>(true)
  const [error, setError] = useState<string | null>(null)
  const [scoreBreakdown, setScoreBreakdown] = useState<ScoreBreakdown | null>(null)
  const [compatibilityScore, setCompatibilityScore] = useState<number>(0)

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
      <div className="flex justify-center items-center min-h-screen text-brand-500 font-syne font-bold">
        Loading profile...
      </div>
    )
  }

  if (error || !profile) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <p className="text-slate-600">{error || 'Profile not found'}</p>
          <button
            onClick={() => navigate('/discover')}
            className="mt-4 text-brand-600 font-bold hover:text-brand-700"
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

  return (
    <div className="min-h-screen bg-white pb-24">
      {/* Back Button & Hero Image */}
      <div className="relative w-full h-80 bg-slate-200">
        {profile.photoURL ? (
          <img
            src={profile.photoURL}
            alt={profile.displayName}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-slate-200 to-slate-300">
            <span className="text-6xl font-bold text-slate-400">
              {getInitials(profile.displayName)}
            </span>
          </div>
        )}

        {/* Back Button (floating overlay) */}
        <button
          onClick={() => navigate('/discover')}
          className="absolute top-4 left-4 w-10 h-10 rounded-full bg-white/90 backdrop-blur-sm flex items-center justify-center shadow-md hover:bg-white transition-colors outline-none focus-visible:ring-2 focus-visible:ring-brand-400"
          aria-label="Go back"
        >
          <ChevronLeft className="w-5 h-5 text-slate-900" />
        </button>
      </div>

      {/* Vitals Block */}
      <div className="px-6 pt-6 pb-4 border-b border-slate-100">
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1">
            <h1 className="font-syne text-2xl font-bold text-slate-900">
              {profile.displayName}, {profile.age}
            </h1>
            <p className="text-sm text-emerald-600 font-medium flex items-center gap-1.5 mt-1">
              <span className="w-2 h-2 rounded-full bg-emerald-500" />
              {activityStatus}
            </p>
            <p className="text-sm text-slate-500 mt-1">
              Year {profile.courseYear} • {profile.school}
            </p>
          </div>

          {/* Compatibility Badge */}
          <div className="flex-shrink-0 bg-emerald-100 rounded-full px-3 py-1.5 text-center">
            <div className="font-bold text-emerald-700">{compatibilityScore}%</div>
            <div className="text-xs text-emerald-600 font-medium">
              Compatible
            </div>
          </div>
        </div>
      </div>

      {/* Budget & Zone Block */}
      <div className="px-6 py-4 border-b border-slate-100">
        <div className="flex items-center justify-between text-sm">
          <div>
            <p className="text-slate-500 font-medium">Budget</p>
            <p className="font-bold text-slate-900 text-lg">
              {formatBudget(profile.minBudget, profile.maxBudget)}
            </p>
          </div>
          <div className="text-right">
            <p className="text-slate-500 font-medium">Zone</p>
            <p className="font-bold text-slate-900 text-lg">{profile.zone}</p>
          </div>
        </div>
      </div>

      {/* Compatibility Breakdown */}
      <div className="px-6 pt-6 pb-4">
        <h2 className="font-syne text-lg font-bold text-slate-900 mb-4">
          Compatibility Breakdown
        </h2>

        {scoreBreakdown ? (
          <div className="space-y-4">
            <ProgressBar
              label="Budget Overlap"
              percentage={scoreBreakdown.budgetOverlap ? 100 : 0}
              color={scoreBreakdown.budgetOverlap ? "emerald" : "amber"}
            />
            {scoreBreakdown.zoneMatch > 0 && (
              <ProgressBar
                label="Zone Match"
                percentage={(scoreBreakdown.zoneMatch / 20) * 100}
                color="emerald"
              />
            )}
            <ProgressBar
              label="Cleanliness Match"
              percentage={(scoreBreakdown.cleanlinessMatch / 20) * 100}
              color="emerald"
            />
            <ProgressBar
              label="Sleep Schedule"
              percentage={(scoreBreakdown.sleepMatch / 15) * 100}
              color="emerald"
            />
            <ProgressBar
              label="Noise Tolerance"
              percentage={(scoreBreakdown.noiseMatch / 10) * 100}
              color="emerald"
            />
          </div>
        ) : (
          <p className="text-sm text-slate-500">Sign in to see full compatibility</p>
        )}
      </div>

      {/* Bio Section */}
      {profile.bio && (
        <div className="px-6 py-4 border-b border-slate-100">
          <h3 className="font-syne text-sm font-bold text-slate-900 mb-2">
            About
          </h3>
          <p className="text-sm text-slate-600 leading-relaxed">
            {profile.bio}
          </p>
        </div>
      )}

      {/* Living Habits & Preferences */}
      <div className="px-6 py-6">
        <h2 className="font-syne text-lg font-bold text-slate-900 mb-4">
          Living Habits & Preferences
        </h2>

        <div className="space-y-3">
          {!profile.lifestyle.smoking && (
            <div className="flex items-center gap-3">
              <CheckCircle className="w-5 h-5 text-emerald-500 flex-shrink-0" />
              <span className="text-sm text-slate-700 font-medium">
                Non-Smoker
              </span>
            </div>
          )}

          {!profile.lifestyle.alcohol && (
            <div className="flex items-center gap-3">
              <Wine className="w-5 h-5 text-emerald-500 flex-shrink-0" />
              <span className="text-sm text-slate-700 font-medium">
                No Alcohol
              </span>
            </div>
          )}

          <div className="flex items-center gap-3">
            <Moon className="w-5 h-5 text-slate-400 flex-shrink-0" />
            <span className="text-sm text-slate-700 font-medium">
              {profile.lifestyle.sleepTime} Bird
            </span>
          </div>

          <div className="flex items-center gap-3">
            <Zap className="w-5 h-5 text-slate-400 flex-shrink-0" />
            <span className="text-sm text-slate-700 font-medium">
              {profile.lifestyle.cleanlinessLevel} Cleanliness Standard
            </span>
          </div>

          <div className="flex items-center gap-3">
            <Wind className="w-5 h-5 text-slate-400 flex-shrink-0" />
            <span className="text-sm text-slate-700 font-medium">
              {profile.lifestyle.noiseTolerance} Noise Tolerance
            </span>
          </div>
        </div>
      </div>

      {/* Sticky Action Dock */}
      <div className="fixed bottom-0 left-0 right-0 max-w-md mx-auto bg-white border-t border-slate-200 p-4 flex gap-4 pb-safe">
        <button
          onClick={() => console.log('Pass')}
          className="flex-1 py-3.5 rounded-xl border-2 border-slate-200 text-slate-600 font-bold hover:bg-slate-50 transition-colors outline-none focus-visible:ring-2 focus-visible:ring-brand-400"
        >
          Pass
        </button>
        <button
          onClick={() => console.log('Match')}
          className="flex-[2] py-3.5 rounded-xl bg-brand-500 text-white font-bold shadow-lg shadow-brand-500/25 hover:bg-brand-600 transition-colors outline-none focus-visible:ring-2 focus-visible:ring-brand-400 focus-visible:ring-offset-2"
        >
          Match
        </button>
      </div>
    </div>
  )
}

export default ProfileDetailPage
