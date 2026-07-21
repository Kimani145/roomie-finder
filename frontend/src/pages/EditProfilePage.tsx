import React, { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
// Removed doc, updateDoc
import type { FirebaseError } from 'firebase/app'
import { Loader2 } from 'lucide-react'
import { toast } from 'react-hot-toast'
import { useAuth } from '@/hooks/useAuth'
import { useAuthStore } from '@/store/authStore'
import { fetchWithAuth } from '@/utils/api'
import { getUserProfile } from '@/firebase/profiles'
// Removed db import
import { TUK_ZONES, TukZone } from '@/constants/zones'
import type { UserProfile, HousingRole } from '@/types'
import { uploadToCloudinary } from '@/utils/uploadToCloudinary'
import FullScreenLoader from '@/components/ui/FullScreenLoader'
import { inputCls as inputClassName } from '@/utils/formStyles'
import { logger } from '@/utils/logger'

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

const ROLE_OPTIONS: Array<{ value: HousingRole; label: string; description: string }> = [
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

  const [role, setRole] = useState<HousingRole>('FLEX')
  const [displayName, setDisplayName] = useState('')
  const [age, setAge] = useState('')
  const [course, setCourse] = useState('')
  const [courseYear, setCourseYear] = useState('')
  const [bioQuote, setBioQuote] = useState('')
  const [minBudget, setMinBudget] = useState('')
  const [maxBudget, setMaxBudget] = useState('')
  const [selectedZones, setSelectedZones] = useState<TukZone[]>([])
  const [avatarFile, setAvatarFile] = useState<File | null>(null)
  const [isUploading, setIsUploading] = useState(false)

  const [isSaving, setIsSaving] = useState(false)
  const [saveError, setSaveError] = useState<string | null>(null)

  const [preferredGender, setPreferredGender] = useState<'Male' | 'Female' | 'Any'>('Any')

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
        logger.error('Failed to fetch profile:', err)
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
    setBioQuote(profile.bioQuote ?? '')
    setMinBudget(profile.minBudget ? String(profile.minBudget) : '')
    setMaxBudget(profile.maxBudget ? String(profile.maxBudget) : '')
    setSelectedZones(profile.zones ?? [])
    if (profile.dealBreakers) {
      if (profile.dealBreakers.femaleOnly) {
        setPreferredGender('Female')
      } else if (profile.dealBreakers.maleOnly) {
        setPreferredGender('Male')
      } else {
        setPreferredGender('Any')
      }
    } else {
      setPreferredGender('Any')
    }
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
    const resolvedBioQuote = bioQuote.trim().slice(0, 100)
    const intent = role

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

    if ((intent === 'SEEKER' || intent === 'FLEX') && !currentUser?.photoURL && !avatarFile) {
      toast.error('A profile photo is required for Seekers and Flex users.')
      setIsSaving(false)
      return
    }

    const updatedData: Partial<UserProfile> = {
      role,
      displayName: resolvedName,
      age: resolvedAge,
      school: resolvedCourse,
      bioQuote: resolvedBioQuote,
      courseYear: resolvedYear,
      minBudget: resolvedMinBudget,
      maxBudget: resolvedMaxBudget,
      zones: selectedZones,
      dealBreakers: {
        ...(profile?.dealBreakers ?? {
          noSmokingRequired: false,
          noAlcoholRequired: false,
          noPetsRequired: false,
          mustHaveWiFi: false,
        }),
        femaleOnly: preferredGender === 'Female',
        maleOnly: preferredGender === 'Male',
      },
    }

    try {
      if (avatarFile) {
        setIsUploading(true)
        try {
          const uploadedPhotoUrl = await uploadToCloudinary(avatarFile)
          updatedData.photoURL = uploadedPhotoUrl
        } catch (uploadError) {
          const message =
            uploadError instanceof Error
              ? uploadError.message
              : 'Could not upload profile photo.'
          toast.error(message)
          setSaveError(message)
          return
        }
      }

      await fetchWithAuth('/api/v1/profiles/me', {
        method: 'PUT',
        body: JSON.stringify(updatedData)
      })

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
      logger.error('Failed to update profile:', err)
      if (firebaseErr?.code === 'permission-denied') {
        setSaveError("You don't have permission to perform this action.")
      } else {
        setSaveError('Failed to update your profile. Please try again.')
      }
    } finally {
      setIsUploading(false)
      setIsSaving(false)
    }
  }

  if (loading) {
    return <FullScreenLoader />
  }

  if (!profile) {
    return (
      <div className="min-h-full bg-transparent flex items-center justify-center px-6 text-center">
        <p className="text-sm text-slate-500 dark:text-slate-400">
          No profile found.
        </p>
      </div>
    )
  }

  return (
    <div className="min-h-full bg-transparent">
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
          <section className="card-surface card-surface-thatch rounded-2xl p-6">
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
                        ? 'border-brand-600 bg-brand-600/10 text-brand-600 dark:text-brand-600'
                        : 'border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/40 text-slate-700 dark:text-slate-200 hover:border-brand-600/50',
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

            <div className="card-surface-soft card-surface-cello mt-8 rounded-2xl p-6">
              <h3 className="text-sm font-bold text-slate-900 dark:text-white mb-2">
                Profile Photo {role === 'HOST' ? '(Optional)' : '(Required)'}
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mb-4">
                {role === 'HOST'
                  ? 'You will upload your room photos later in the Listing Wizard.'
                  : 'Hosts need to see who they are matching with. Please upload a clear photo of yourself.'}
              </p>

              <input
                type="file"
                accept="image/*"
                onChange={(e) => setAvatarFile(e.target.files?.[0] || null)}
                className="block w-full text-sm text-slate-600 dark:text-slate-300 file:mr-4 file:rounded-lg file:border-0 file:bg-slate-200 dark:file:bg-slate-700 file:px-3 file:py-2 file:text-sm file:font-semibold file:text-slate-800 dark:file:text-slate-100 hover:file:bg-slate-300 dark:hover:file:bg-slate-600"
                disabled={isSaving}
              />
              {avatarFile && (
                <p className="mt-2 text-xs text-slate-500 dark:text-slate-400">
                  Selected: {avatarFile.name}
                </p>
              )}
            </div>
          </section>

          <section className="card-surface card-surface-wine rounded-2xl p-6">
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

              <div className="flex flex-col md:col-span-2">
                <label className="text-sm font-bold text-slate-700 dark:text-slate-200 mb-1.5 block">
                  The Headline
                </label>
                <p className="text-xs text-slate-500 dark:text-slate-400 mb-2">
                  In one sentence, what are you looking for? (Max 100 chars)
                </p>
                <input
                  type="text"
                  value={bioQuote}
                  onChange={(e) => setBioQuote(e.target.value.slice(0, 100))}
                  maxLength={100}
                  placeholder="Looking for a calm, tidy roommate near campus."
                  className={inputClassName}
                  disabled={isSaving}
                />
                <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                  {bioQuote.length}/100
                </p>
              </div>
            </div>
          </section>

          <section className="card-surface card-surface-dingley rounded-2xl p-6">
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
                        ? 'border-brand-600 bg-brand-600/10 text-brand-600 dark:text-brand-600'
                        : selectedZones.length === 3
                        ? 'border-slate-100 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/40 text-slate-300 dark:text-slate-500 cursor-not-allowed'
                        : 'border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/40 text-slate-700 dark:text-slate-200 hover:border-brand-600/50',
                    ].join(' ')}
                  >
                    {zone}
                  </button>
                )
              })}
            </div>

            <div className="mt-5 grid grid-cols-1 sm:grid-cols-3 gap-3">
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

              <div className="flex flex-col">
                <label className="text-sm font-bold text-slate-700 dark:text-slate-200 mb-1.5">
                  Roommate Gender Preference
                </label>
                <select
                  value={preferredGender}
                  onChange={(e) => setPreferredGender(e.target.value as 'Male' | 'Female' | 'Any')}
                  className={inputClassName}
                  disabled={isSaving}
                >
                  <option value="Any">Any Gender</option>
                  <option value="Male">Male Only</option>
                  <option value="Female">Female Only</option>
                </select>
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
              disabled={isSaving || isUploading}
              className="px-5 py-2.5 rounded-xl bg-brand-600 text-white text-sm font-semibold hover:bg-brand-700 disabled:opacity-60 disabled:cursor-not-allowed inline-flex items-center justify-center gap-2 active:scale-[0.98] transition-all"
            >
              {isSaving && <Loader2 className="h-4 w-4 animate-spin" />}
              {isUploading ? 'Uploading photo...' : isSaving ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </form>


      </div>
    </div>
  )
}

export default EditProfilePage
