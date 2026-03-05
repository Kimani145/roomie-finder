import React, { useEffect, useState } from 'react'
import { useAuth } from '@/hooks/useAuth'
import { useAuthStore } from '@/store/authStore'
import { getUserProfile } from '@/firebase/profiles'
import { seedMockUsers } from '@/utils/seedDatabase'
import type { UserProfile } from '@/types'
import { MapPin, BookOpen, Wallet, Moon, Sparkles, ShieldCheck, LogOut } from 'lucide-react'

const ProfilePage: React.FC = () => {
  const { user, logout } = useAuth()
  const { currentUser } = useAuthStore()
  const [profile, setProfile] = useState<UserProfile | null>(currentUser)
  const [loading, setLoading] = useState(!currentUser)
  const [seeding, setSeeding] = useState(false)
  const [seeded, setSeeded] = useState(false)

  const handleSeed = async () => {
    if (seeded) return
    setSeeding(true)
    try {
      await seedMockUsers()
      setSeeded(true)
      alert('✓ Mock users seeded to Firestore')
    } catch (err) {
      console.error('Seeding failed:', err)
      alert('Seeding failed — check console for details.')
    } finally {
      setSeeding(false)
    }
  }

  // Fetch from Firestore if authStore doesn't have the profile yet
  useEffect(() => {
    if (currentUser) {
      setProfile(currentUser)
      setLoading(false)
      return
    }
    if (!user) return

    let cancelled = false
    ;(async () => {
      try {
        const fetched = await getUserProfile(user.uid)
        if (!cancelled) setProfile(fetched)
      } catch (err) {
        console.error('Failed to fetch profile:', err)
      } finally {
        if (!cancelled) setLoading(false)
      }
    })()

    return () => { cancelled = true }
  }, [user, currentUser])

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <span className="text-sm text-slate-500">Loading profile…</span>
      </div>
    )
  }

  if (!profile) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center px-6 text-center">
        <p className="text-sm text-slate-500">No profile found.</p>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-slate-50 pb-24">
      {/* Header card */}
      <div className="bg-white border-b border-slate-200 px-6 pt-8 pb-6">
        <div className="max-w-md mx-auto flex items-center gap-4">
          <div className="h-16 w-16 rounded-full bg-brand-100 flex items-center justify-center text-2xl font-bold text-brand-600">
            {profile.displayName?.charAt(0)?.toUpperCase() || '?'}
          </div>
          <div>
            <h1 className="font-syne text-xl font-bold text-slate-900">
              {profile.displayName}
            </h1>
            <p className="text-sm text-slate-500">
              {profile.gender} · {profile.age} yrs · Year {profile.courseYear}
            </p>
            <p className="text-xs text-slate-400 mt-0.5">{user?.email}</p>
          </div>
        </div>
      </div>

      <div className="max-w-md mx-auto px-6 py-6 space-y-5">
        {/* Bio */}
        {profile.bio && (
          <div className="rounded-xl border border-slate-200 bg-white p-4">
            <p className="text-sm text-slate-700 leading-relaxed">{profile.bio}</p>
          </div>
        )}

        {/* Logistics */}
        <section className="rounded-xl border border-slate-200 bg-white p-4 space-y-3">
          <h2 className="font-syne text-sm font-bold text-slate-900 uppercase tracking-wider">
            Logistics
          </h2>
          <div className="flex items-center gap-2 text-sm text-slate-700">
            <MapPin className="h-4 w-4 text-brand-500" />
            <span>{profile.zones?.join(', ') || '—'}</span>
          </div>
          <div className="flex items-center gap-2 text-sm text-slate-700">
            <Wallet className="h-4 w-4 text-brand-500" />
            <span>KES {profile.minBudget?.toLocaleString()} – {profile.maxBudget?.toLocaleString()}</span>
          </div>
          <div className="flex items-center gap-2 text-sm text-slate-700">
            <BookOpen className="h-4 w-4 text-brand-500" />
            <span>{profile.school} · {profile.preferredRoomType}</span>
          </div>
        </section>

        {/* Lifestyle */}
        <section className="rounded-xl border border-slate-200 bg-white p-4 space-y-3">
          <h2 className="font-syne text-sm font-bold text-slate-900 uppercase tracking-wider">
            Lifestyle
          </h2>
          <div className="flex flex-wrap gap-2">
            {[
              { icon: Moon, label: `Sleep: ${profile.lifestyle.sleepTime}` },
              { icon: Sparkles, label: `Clean: ${profile.lifestyle.cleanlinessLevel}` },
              { icon: Sparkles, label: `Noise: ${profile.lifestyle.noiseTolerance}` },
              { icon: Sparkles, label: `Guests: ${profile.lifestyle.guestFrequency}` },
              { icon: Sparkles, label: `Study: ${profile.lifestyle.studyStyle}` },
            ].map(({ icon: Icon, label }) => (
              <span
                key={label}
                className="inline-flex items-center gap-1.5 rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-medium text-slate-600"
              >
                <Icon className="h-3 w-3 text-brand-500" />
                {label}
              </span>
            ))}
          </div>
        </section>

        {/* Deal Breakers */}
        <section className="rounded-xl border border-slate-200 bg-white p-4 space-y-3">
          <h2 className="font-syne text-sm font-bold text-slate-900 uppercase tracking-wider">
            Deal Breakers
          </h2>
          <div className="flex flex-wrap gap-2">
            {[
              profile.dealBreakers.noSmokingRequired && 'No Smoking',
              profile.dealBreakers.noAlcoholRequired && 'No Alcohol',
              profile.dealBreakers.mustHaveWiFi && 'Must Have WiFi',
              profile.dealBreakers.femaleOnly && 'Female Only',
              profile.dealBreakers.maleOnly && 'Male Only',
            ]
              .filter(Boolean)
              .map((label) => (
                <span
                  key={label as string}
                  className="inline-flex items-center gap-1.5 rounded-full border border-red-200 bg-red-50 px-3 py-1 text-xs font-medium text-red-600"
                >
                  <ShieldCheck className="h-3 w-3" />
                  {label}
                </span>
              ))}
            {![
              profile.dealBreakers.noSmokingRequired,
              profile.dealBreakers.noAlcoholRequired,
              profile.dealBreakers.mustHaveWiFi,
              profile.dealBreakers.femaleOnly,
              profile.dealBreakers.maleOnly,
            ].some(Boolean) && (
              <span className="text-xs text-slate-400">None set</span>
            )}
          </div>
        </section>

        {/* Sign out */}
        <button
          onClick={logout}
          className="w-full rounded-xl border-2 border-slate-200 py-3 text-sm font-bold text-slate-600 hover:bg-slate-50 transition-colors flex items-center justify-center gap-2"
        >
          <LogOut className="h-4 w-4" />
          Sign Out
        </button>

        {/* Dev-only seed trigger */}
        {import.meta.env.DEV && (
          <div className="pt-4 text-center">
            <button
              onClick={handleSeed}
              disabled={seeding || seeded}
              className="text-xs text-slate-300 hover:text-slate-500 disabled:text-slate-200 disabled:cursor-not-allowed transition-colors"
            >
              {seeded ? '✓ Users seeded' : seeding ? 'Seeding…' : 'Seed Test Users'}
            </button>
          </div>
        )}
      </div>
    </div>
  )
}

export default ProfilePage
