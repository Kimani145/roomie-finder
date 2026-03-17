import React, { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { doc, updateDoc } from 'firebase/firestore'
import { EmailAuthProvider, reauthenticateWithCredential, updatePassword } from 'firebase/auth'
import type { FirebaseError } from 'firebase/app'
import { Loader2 } from 'lucide-react'
import { toast } from 'react-hot-toast'
import { useAuth } from '@/hooks/useAuth'
import { useAuthStore } from '@/store/authStore'
import { getUserProfile } from '@/firebase/profiles'
import { db } from '@/firebase/config'
import { TUK_ZONES, TukZone } from '@/constants/zones'
import type { UserProfile, UserRole } from '@/types'

const TUK_COURSES = [
  'BSc Information Science',
  'BSc Computer Science',
  'BSc Electrical Engineering',
  'BSc Civil Engineering',
  'BA Business Administration',
  'BSc Applied Physics',
  'BSc Mechanical Engineering',
  'Diploma in ICT',
]

const ROLE_OPTIONS: Array<{ value: UserRole; label: string; description: string }> = [
  {
    value: 'HOST',
    label: 'Host',
    description: 'I have a place to share.',
  },
  {
    value: 'SEEKER',
    label: 'Seeker',
    description: 'I need a place to move into.',
  },
  {
    value: 'FLEX',
    label: 'Flex',
    description: 'Open to hosting or searching.',
  },
]

const EditProfilePage: React.FC = () => {
  const { user } = useAuth()
  const { currentUser, setCurrentUser } = useAuthStore()
  const Maps = useNavigate()

  const [profile, setProfile] = useState<UserProfile | null>(currentUser)
  const [loading, setLoading] = useState(!currentUser)

  const [role, setRole] = useState<UserRole>('FLEX')
  const [displayName, setDisplayName] = useState('')
  const [age, setAge] = useState('')
  const [course, setCourse] = useState('')
  const [courseYear, setCourseYear] = useState('')
  const [minBudget, setMinBudget] = useState('')
  const [maxBudget, setMaxBudget] = useState('')
  const [selectedZones, setSelectedZones] = useState<TukZone[]>([])

  const [isSaving, setIsSaving] = useState(false)
  const [saveError, setSaveError] = useState<string | null>(null)

  const [newPassword, setNewPassword] = useState('')
  const [currentPassword, setCurrentPassword] = useState('')
  const [passwordError, setPasswordError] = useState<string | null>(null)
  const [passwordSuccess, setPasswordSuccess] = useState<string | null>(null)
  const [isUpdatingPassword, setIsUpdatingPassword] = useState(false)

  useEffect(() => {
    if (currentUser) {
      setProfile(currentUser)
      setLoading(false)
    }
    if (!user) return

    let cancelled = false
    if (!currentUser) setLoading(true)
    ;(async () => {
      try {
        const fetched = await getUserProfile(user.uid)
        if (cancelled) return
        if (fetched) {
          setProfile(fetched)
        } else if (!currentUser) {
          setProfile(null)
        }
      } catch (err) {
        console.error('Failed to fetch profile:', err)
      } finally {
        if (!cancelled) setLoading(false)
      }
    })()

    return () => {
      cancelled = true
    }
  }, [user, currentUser])

  useEffect(() => {
    if (!profile) return
    setRole(profile.role ?? 'FLEX')
    setDisplayName(profile.displayName ?? '')
    setAge(profile.age ? String(profile.age) : '')
    setCourse(profile.school ?? '')
    setCourseYear(profile.courseYear ? String(profile.courseYear) : '')
    setMinBudget(profile.minBudget ? String(profile.minBudget) : '')
    setMaxBudget(profile.maxBudget ? String(profile.maxBudget) : '')
    setSelectedZones(profile.zones ?? [])
  }, [profile])

  const handleZoneToggle = (zone: TukZone) => {
    if (selectedZones.includes(zone)) {
      setSelectedZones(selectedZones.filter((z) => z !== zone))
      return
    }
    if (selectedZones.length >= 3 && !selectedZones.includes(zone)) return
    setSelectedZones([...selectedZones, zone])
  }

  const handleSave = async (event: React.FormEvent) => {
    event.preventDefault()
    if (!profile && !user) return

    const uid = profile?.uid ?? user?.uid
    if (!uid) return

    setIsSaving(true)
    setSaveError(null)

    const trimmedName = displayName.trim()
    const resolvedName = trimmedName || profile?.displayName || ''
    const parsedAge = age.trim() === '' ? profile?.age ?? null : Number(age)
    const resolvedAge =
      typeof parsedAge === 'number' && Number.isFinite(parsedAge)
        ? parsedAge
        : profile?.age ?? 0
    const parsedYear = courseYear.trim() === '' ? profile?.courseYear ?? null : Number(courseYear)
    const resolvedYear =
      typeof parsedYear === 'number' && Number.isFinite(parsedYear)
        ? parsedYear
        : profile?.courseYear ?? 0
    const parsedMinBudget =
      minBudget.trim() === '' ? profile?.minBudget ?? null : Number(minBudget)
    const parsedMaxBudget =
      maxBudget.trim() === '' ? profile?.maxBudget ?? null : Number(maxBudget)
    const resolvedMinBudget =
      typeof parsedMinBudget === 'number' && Number.isFinite(parsedMinBudget)
        ? parsedMinBudget
        : profile?.minBudget ?? 0
    const resolvedMaxBudget =
      typeof parsedMaxBudget === 'number' && Number.isFinite(parsedMaxBudget)
        ? parsedMaxBudget
        : profile?.maxBudget ?? 0
    const resolvedCourse = course.trim() || profile?.school || ''

    if (resolvedMinBudget < 3000) {
      setSaveError('Minimum budget must be at least 3,000 KES')
      setIsSaving(false)
      return
    }

    if (resolvedMaxBudget <= resolvedMinBudget) {
      setSaveError('Maximum budget must be greater than minimum budget')
      setIsSaving(false)
      return
    }

    const updatedData = {
      role,
      displayName: resolvedName,
      age: resolvedAge,
      school: resolvedCourse,
      courseYear: resolvedYear,
      minBudget: resolvedMinBudget,
      maxBudget: resolvedMaxBudget,
      zones: selectedZones,
    }

    try {
      await updateDoc(doc(db, 'profiles', uid), updatedData)

      if (profile) {
        setCurrentUser({
          ...profile,
          ...updatedData,
        })
      }

      toast.success('Profile updated successfully!')
      Maps('/profile')
    } catch (err) {
      const firebaseErr = err as FirebaseError
      console.error('Failed to update profile:', err)
      if (firebaseErr?.code === 'permission-denied') {
        setSaveError("You don't have permission to perform this action.")
      } else {
        setSaveError('Failed to update your profile. Please try again.')
      }
    } finally {
      setIsSaving(false)
    }
  }

  const handlePasswordUpdate = async (event: React.FormEvent) => {
    event.preventDefault()
    setPasswordError(null)
    setPasswordSuccess(null)

    if (!user) {
      setPasswordError('No authenticated user found.')
      return
    }

    if (!currentPassword.trim()) {
      setPasswordError('Please enter your current password.')
      return
    }

    if (!newPassword.trim()) {
      setPasswordError('Please enter a new password.')
      return
    }

    if (!user.email) {
      setPasswordError('No email found for this account.')
      return
    }

    setIsUpdatingPassword(true)

    try {
      const credential = EmailAuthProvider.credential(user.email, currentPassword.trim())
      await reauthenticateWithCredential(user, credential)
      await updatePassword(user, newPassword.trim())
      setCurrentPassword('')
      setNewPassword('')
      setPasswordSuccess('Password updated successfully.')
    } catch (err) {
      const firebaseErr = err as FirebaseError
      if (firebaseErr?.code === 'auth/wrong-password') {
        setPasswordError('Incorrect current password.')
      } else if (firebaseErr?.code === 'auth/requires-recent-login') {
        setPasswordError(
          'For security reasons, please log out and log back in to change your password.'
        )
      } else {
        setPasswordError('Failed to update password. Please try again.')
      }
    } finally {
      setIsUpdatingPassword(false)
    }
  }

  const inputClassName =
    'bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-3 text-slate-900 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 focus:border-blue-600 focus:ring-1 focus:ring-blue-600 outline-none'

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-900 flex items-center justify-center">
        <span className="text-sm text-slate-500 dark:text-slate-400">
          Loading profile…
        </span>
      </div>
    )
  }

  if (!profile) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-900 flex items-center justify-center px-6 text-center">
        <p className="text-sm text-slate-500 dark:text-slate-400">
          No profile found.
        </p>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900">
      <div className="max-w-4xl mx-auto w-full py-8 px-4 space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-50">
            Edit Profile
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Update your intent, vitals, and zone preferences.
          </p>
        </div>

        {saveError && (
          <div className="rounded-xl border border-red-200 dark:border-red-500/50 bg-red-50 dark:bg-red-950/40 px-4 py-3 text-sm font-medium text-red-700 dark:text-red-200">
            {saveError}
          </div>
        )}

        <form onSubmit={handleSave} className="space-y-6">
          <section className="bg-white dark:bg-slate-800 p-6 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm">
            <h2 className="text-xs font-bold tracking-wider text-slate-500 dark:text-slate-400 uppercase mb-4">
              Intent
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {ROLE_OPTIONS.map((option) => {
                const isSelected = role === option.value
                return (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() => setRole(option.value)}
                    disabled={isSaving}
                    className={[
                      'rounded-xl border px-4 py-3 text-left transition-colors',
                      isSelected
                        ? 'border-blue-600 bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-200'
                        : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900/40 text-slate-600 dark:text-slate-300 hover:border-blue-300',
                    ].join(' ')}
                  >
                    <div className="text-sm font-semibold">{option.label}</div>
                    <div className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                      {option.description}
                    </div>
                  </button>
                )
              })}
            </div>
          </section>

          <section className="bg-white dark:bg-slate-800 p-6 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm">
            <h2 className="text-xs font-bold tracking-wider text-slate-500 dark:text-slate-400 uppercase mb-4">
              Vitals
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex flex-col">
                <label className="text-sm font-bold text-slate-700 dark:text-slate-200 mb-1.5">
                  First Name
                </label>
                <input
                  type="text"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  placeholder="Joseph"
                  className={inputClassName}
                  disabled={isSaving}
                />
              </div>

              <div className="flex flex-col">
                <label className="text-sm font-bold text-slate-700 dark:text-slate-200 mb-1.5">
                  Age
                </label>
                <input
                  type="number"
                  value={age}
                  onChange={(e) => setAge(e.target.value)}
                  placeholder="21"
                  className={inputClassName}
                  disabled={isSaving}
                />
              </div>

              <div className="flex flex-col">
                <label className="text-sm font-bold text-slate-700 dark:text-slate-200 mb-1.5">
                  Course
                </label>
                <select
                  value={course}
                  onChange={(e) => setCourse(e.target.value)}
                  className={inputClassName}
                  disabled={isSaving}
                >
                  <option value="">Select course</option>
                  {TUK_COURSES.map((courseOption) => (
                    <option key={courseOption} value={courseOption}>
                      {courseOption}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex flex-col">
                <label className="text-sm font-bold text-slate-700 dark:text-slate-200 mb-1.5">
                  Year of Study
                </label>
                <input
                  type="number"
                  value={courseYear}
                  onChange={(e) => setCourseYear(e.target.value)}
                  placeholder="3"
                  className={inputClassName}
                  disabled={isSaving}
                />
              </div>
            </div>
          </section>

          <section className="bg-white dark:bg-slate-800 p-6 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm">
            <h2 className="text-xs font-bold tracking-wider text-slate-500 dark:text-slate-400 uppercase mb-2">
              Logistics
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mb-4">
              Select up to 3 preferred zones ({selectedZones.length}/3)
            </p>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
              {TUK_ZONES.map((zone) => {
                const selected = selectedZones.includes(zone)
                return (
                  <button
                    key={zone}
                    type="button"
                    onClick={() => handleZoneToggle(zone)}
                    disabled={!selected && selectedZones.length === 3}
                    className={[
                      'rounded-xl border px-3 py-2.5 text-sm font-medium transition-colors text-left',
                      selected
                        ? 'border-blue-600 bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-200'
                        : selectedZones.length === 3
                        ? 'border-slate-100 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/40 text-slate-300 dark:text-slate-500 cursor-not-allowed'
                        : 'border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/40 text-slate-700 dark:text-slate-200 hover:border-blue-300',
                    ].join(' ')}
                  >
                    {zone}
                  </button>
                )
              })}
            </div>

            <div className="mt-5 grid grid-cols-2 gap-3">
              <div className="flex flex-col">
                <label className="text-sm font-bold text-slate-700 dark:text-slate-200 mb-1.5">
                  Min Budget (KES)
                </label>
                <input
                  type="number"
                  value={minBudget}
                  onChange={(e) => setMinBudget(e.target.value)}
                  placeholder="3000"
                  className={inputClassName}
                  disabled={isSaving}
                />
              </div>

              <div className="flex flex-col">
                <label className="text-sm font-bold text-slate-700 dark:text-slate-200 mb-1.5">
                  Max Budget (KES)
                </label>
                <input
                  type="number"
                  value={maxBudget}
                  onChange={(e) => setMaxBudget(e.target.value)}
                  placeholder="12000"
                  className={inputClassName}
                  disabled={isSaving}
                />
              </div>
            </div>
          </section>

          <div className="flex flex-col sm:flex-row sm:items-center justify-end gap-3">
            <button
              type="button"
              onClick={() => Maps('/profile')}
              className="px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 text-sm font-medium hover:bg-slate-50 dark:hover:bg-slate-800"
              disabled={isSaving}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSaving}
              className="px-5 py-2.5 rounded-xl bg-blue-600 text-white text-sm font-semibold hover:bg-blue-700 disabled:opacity-60 disabled:cursor-not-allowed inline-flex items-center justify-center gap-2"
            >
              {isSaving && <Loader2 className="h-4 w-4 animate-spin" />}
              {isSaving ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </form>

        <section className="bg-white dark:bg-slate-800 p-6 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm">
          <h2 className="text-xs font-bold tracking-wider text-slate-500 dark:text-slate-400 uppercase mb-4">
            Security
          </h2>
          <div className="rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/40 p-4">
            <h3 className="text-sm font-semibold text-slate-800 dark:text-slate-100 mb-2">
              Change Password
            </h3>
            <form onSubmit={handlePasswordUpdate} className="space-y-3">
              <input
                type="password"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                placeholder="Current password"
                className={inputClassName}
                disabled={isUpdatingPassword}
              />
              <input
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="New password"
                className={inputClassName}
                disabled={isUpdatingPassword}
              />
              {passwordError && (
                <p className="text-xs font-medium text-red-600 dark:text-red-300">
                  {passwordError}
                </p>
              )}
              {passwordSuccess && (
                <p className="text-xs font-medium text-emerald-600 dark:text-emerald-300">
                  {passwordSuccess}
                </p>
              )}
              <button
                type="submit"
                disabled={isUpdatingPassword}
                className="inline-flex items-center justify-center gap-2 rounded-lg bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 px-4 py-2.5 text-sm font-semibold hover:bg-slate-800 dark:hover:bg-white disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {isUpdatingPassword && <Loader2 className="h-4 w-4 animate-spin" />}
                {isUpdatingPassword ? 'Updating...' : 'Update Password'}
              </button>
            </form>
          </div>
        </section>
      </div>
    </div>
  )
}

export default EditProfilePage
