import React from 'react'
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

// Mock data for development
const MOCK_PROFILES: Record<string, any> = {
  'mock-user-1': {
    uid: 'mock-user-1',
    displayName: 'Joseph Kimani',
    photoURL: null,
    gender: 'Male',
    age: 21,
    school: 'TUK',
    courseYear: 3,
    course: 'BSc Information Science',
    minBudget: 5000,
    maxBudget: 8000,
    zone: 'Ruiru',
    preferredRoomType: 'Bedsitter',
    lifestyle: {
      sleepTime: 'Early',
      noiseTolerance: 'Low',
      guestFrequency: 'Rare',
      cleanlinessLevel: 'Moderate',
      studyStyle: 'Silent',
      smoking: false,
      alcohol: false,
    },
    dealBreakers: {
      noSmokingRequired: true,
      noAlcoholRequired: false,
      mustHaveWiFi: true,
      femaleOnly: false,
      maleOnly: false,
    },
    lastActive: new Date(),
    bio: 'Final year engineering student. Looking for a quiet, focused roommate. Early bird who values cleanliness and focused study time.',
  },
}

const ProfileDetailPage: React.FC = () => {
  const { uid } = useParams<{ uid: string }>()
  const navigate = useNavigate()

  // Use mock data for now
  const profile = uid ? MOCK_PROFILES[uid] : null

  if (!profile) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <p className="text-slate-600">Profile not found</p>
          <button
            onClick={() => navigate('/discover')}
            className="mt-4 text-blue-500 font-medium hover:text-blue-600"
          >
            Back to Discovery
          </button>
        </div>
      </div>
    )
  }

  // Helper functions
  function getActivityStatus(lastActive: Date): string {
    const now = new Date()
    const diffMs = now.getTime() - new Date(lastActive).getTime()
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60))

    if (diffHours === 0) return 'Active now'
    if (diffHours < 24) return `Active ${diffHours}h ago`
    const diffDays = Math.floor(diffHours / 24)
    if (diffDays === 1) return 'Active yesterday'
    return `Active ${diffDays}d ago`
  }

  function getInitials(name: string): string {
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
          className="absolute top-4 left-4 w-10 h-10 rounded-full bg-white/90 backdrop-blur-sm flex items-center justify-center shadow-md hover:bg-white transition-colors outline-none focus-visible:ring-2 focus-visible:ring-blue-400"
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
              {profile.course} • {profile.school}
            </p>
          </div>

          {/* Compatibility Badge */}
          <div className="flex-shrink-0 bg-emerald-100 rounded-full px-3 py-1.5 text-center">
            <div className="font-bold text-emerald-700">76%</div>
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

        <div className="space-y-4">
          <ProgressBar
            label="Budget Overlap"
            percentage={100}
            color="emerald"
          />
          <ProgressBar
            label="Lifestyle Match"
            percentage={80}
            color="emerald"
          />
          <ProgressBar
            label="Noise Tolerance"
            percentage={50}
            color="amber"
          />
        </div>
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
          className="flex-1 py-3.5 rounded-xl border-2 border-slate-200 text-slate-600 font-bold hover:bg-slate-50 transition-colors outline-none focus-visible:ring-2 focus-visible:ring-blue-400"
        >
          Pass
        </button>
        <button
          onClick={() => console.log('Match')}
          className="flex-[2] py-3.5 rounded-xl bg-blue-500 text-white font-bold shadow-lg shadow-blue-500/25 hover:bg-blue-600 transition-colors outline-none focus-visible:ring-2 focus-visible:ring-blue-400 focus-visible:ring-offset-2"
        >
          Match
        </button>
      </div>
    </div>
  )
}

export default ProfileDetailPage
