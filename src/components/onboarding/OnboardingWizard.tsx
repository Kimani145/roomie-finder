import React, { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { doc, serverTimestamp, setDoc } from 'firebase/firestore'
import type { FirebaseError } from 'firebase/app'
import { useAuth } from '@/hooks/useAuth'
import { saveUserProfile, getUserProfile } from '@/firebase/profiles'
import { useAuthStore } from '@/store/authStore'
import { db } from '@/firebase/config'
import { TUK_ZONES, TukZone } from '@/constants/zones'
import type { Gender, UserRole } from '@/types'

const GENDERS: Gender[] = ['Male', 'Female', 'Non-binary', 'Prefer not to say']
const NAME_REGEX = /^[A-Za-z]+(?:[ '-][A-Za-z]+)*$/
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

const ROLE_OPTIONS: Array<{
  role: UserRole
  title: string
  subtitle: string
}> = [
  {
    role: 'HOST',
    title: 'I have a place',
    subtitle: 'I have a room or house and need a colonymate to split costs.',
  },
  {
    role: 'SEEKER',
    title: 'I am looking for a place',
    subtitle: 'I am looking for a room to move into with someone.',
  },
  {
    role: 'FLEX',
    title: 'I am open to either',
    subtitle:
      "I'm looking for colonymates to hunt for a new place together, or open to moving into theirs.",
  },
]

export const OnboardingWizard: React.FC = () => {
  const Maps = useNavigate()
  const { user, reloadUser } = useAuth()
  const { setCurrentUser } = useAuthStore()
  const [currentStep, setCurrentStep] = useState(1)
  const [isSaving, setIsSaving] = useState(false)
  const [saveError, setSaveError] = useState<string | null>(null)
  const [role, setRole] = useState<UserRole | null>(null)

  const [firstName, setFirstName] = useState('')
  const [age, setAge] = useState('')
  const [gender, setGender] = useState<Gender | ''>('')
  const [course, setCourse] = useState('')
  const [yearOfStudy, setYearOfStudy] = useState('')
  const [bioQuote, setBioQuote] = useState('')

  const [zones, setZones] = useState<TukZone[]>([])
  const [minBudget, setMinBudget] = useState('')
  const [maxBudget, setMaxBudget] = useState('')

  const [sleepSchedule, setSleepSchedule] = useState<'Early' | 'Late' | ''>('')
  const [cleanliness, setCleanliness] = useState<'Relaxed' | 'Strict' | ''>('')
  const [noiseTolerance, setNoiseTolerance] = useState<'Low' | 'High' | ''>('')

  const [nonSmoker, setNonSmoker] = useState(false)
  const [noAlcohol, setNoAlcohol] = useState(false)
  const [noPets, setNoPets] = useState(false)

  useEffect(() => {
    const refreshAuthToken = async () => {
      if (user) {
        await reloadUser('ONBOARDING_MOUNT')
      }
    }

    refreshAuthToken()
  }, [user, reloadUser])

  const progressPct = useMemo(() => (currentStep / 5) * 100, [currentStep])

  const ageValue = Number(age)
  const yearValue = Number(yearOfStudy)
  const minBudgetValue = Number(minBudget)
  const maxBudgetValue = Number(maxBudget)

  const vitalsErrors = useMemo(
    () => ({
      firstName:
        !firstName.trim()
          ? 'First name is required.'
          : firstName.trim().length < 3
          ? 'Name must be at least 3 characters.'
          : !NAME_REGEX.test(firstName.trim())
          ? 'Name can only include letters, spaces, apostrophes, and hyphens.'
          : '',
      age:
        !age.trim()
          ? 'Age is required.'
          : Number.isNaN(ageValue) || !Number.isFinite(ageValue)
          ? 'Age must be a number.'
          : ageValue < 18 || ageValue > 25
          ? 'Age must be between 18 and 25.'
          : '',
      gender: gender ? '' : 'Gender is required.',
      course: course ? '' : 'Course is required.',
      yearOfStudy:
        !yearOfStudy.trim()
          ? 'Year of study is required.'
          : Number.isNaN(yearValue) || !Number.isFinite(yearValue)
          ? 'Year of study must be a number.'
          : yearValue < 1 || yearValue > 6
          ? 'Year of study must be between 1 and 6.'
          : '',
    }),
    [age, ageValue, course, firstName, gender, yearOfStudy, yearValue]
  )

  const logisticsErrors = useMemo(
    () => ({
      zones:
        zones.length < 1
          ? 'Select at least one preferred zone.'
          : zones.length > 3
          ? 'You can select a maximum of 3 zones.'
          : '',
      budget:
        !minBudget.trim()
          ? 'Both minimum and maximum budget are required.'
          : !maxBudget.trim()
          ? 'Both minimum and maximum budget are required.'
          : Number.isNaN(minBudgetValue) || Number.isNaN(maxBudgetValue)
          ? 'Budget values must be valid numbers.'
          : minBudgetValue < 3000
          ? 'Minimum budget must be at least 3,000 KES'
          : maxBudgetValue <= minBudgetValue
          ? 'Maximum budget must be greater than minimum budget'
          : '',
    }),
    [maxBudget, maxBudgetValue, minBudget, minBudgetValue, zones.length]
  )

  const lifestyleErrors = useMemo(
    () => ({
      sleepSchedule: sleepSchedule ? '' : 'Sleep schedule selection is required.',
      cleanliness: cleanliness ? '' : 'Cleanliness selection is required.',
      noiseTolerance: noiseTolerance ? '' : 'Noise tolerance selection is required.',
    }),
    [cleanliness, noiseTolerance, sleepSchedule]
  )

  const isRoleStepValid = useMemo(() => role !== null, [role])
  const isVitalsStepValid = useMemo(
    () => Object.values(vitalsErrors).every((error) => !error),
    [vitalsErrors]
  )
  const isLogisticsStepValid = useMemo(
    () => Object.values(logisticsErrors).every((error) => !error),
    [logisticsErrors]
  )
  const isLifestyleStepValid = useMemo(
    () => Object.values(lifestyleErrors).every((error) => !error),
    [lifestyleErrors]
  )

  const isStepValid = useMemo(() => {
    if (currentStep === 1) return isRoleStepValid
    if (currentStep === 2) return isVitalsStepValid
    if (currentStep === 3) return isLogisticsStepValid
    if (currentStep === 4) return isLifestyleStepValid
    return true
  }, [
    currentStep,
    isLifestyleStepValid,
    isLogisticsStepValid,
    isRoleStepValid,
    isVitalsStepValid,
  ])

  const isNextDisabled = isSaving || !isStepValid

  const handleNext = async () => {
    if (!isStepValid) return

    if (currentStep < 5) {
      setCurrentStep((prev) => prev + 1)
      return
    }

    if (!user) return
    setIsSaving(true)
    setSaveError(null)

    try {
      const profile = {
        displayName: firstName.trim(),
        photoURL: null,
        role: role || 'FLEX',
        gender: gender as Gender,
        age: Number(age),
        school: 'Technical University of Kenya',
        courseYear: Number(yearOfStudy),
        bioQuote: bioQuote.trim().slice(0, 100),
        minBudget: Number(minBudget),
        maxBudget: Number(maxBudget),
        zones,
        preferredRoomType: 'Single Room' as const,
        lifestyle: {
          sleepTime: sleepSchedule as 'Early' | 'Late' | 'Flexible',
          noiseTolerance: noiseTolerance as 'Low' | 'Medium' | 'High',
          guestFrequency: 'Sometimes' as const,
          cleanlinessLevel: cleanliness as 'Relaxed' | 'Moderate' | 'Strict',
          studyStyle: 'Background noise ok' as const,
          smoking: !nonSmoker,
          alcohol: !noAlcohol,
        },
        dealBreakers: {
          noSmokingRequired: nonSmoker,
          noAlcoholRequired: noAlcohol,
          mustHaveWiFi: true,
          femaleOnly: false,
          maleOnly: false,
        },
        status: 'active' as const,
        bio: '',
      }

      // Critical: Save profile to Firestore, then navigate
      await saveUserProfile(user.uid, profile)

      await reloadUser('ONBOARDING_SUBMIT')

      await setDoc(
        doc(db, 'users', user.uid),
        {
          role: profile.role,
          profileCompleted: true,
          updatedAt: serverTimestamp(),
        },
        { merge: true }
      )

      // Re-fetch if possible; fall back to local profile when read is denied by rules.
      const saved = await getUserProfile(user.uid)
      if (saved) {
        setCurrentUser(saved)
      } else {
        setCurrentUser({
          uid: user.uid,
          ...profile,
          lastActive: new Date(),
          createdAt: new Date(),
        })
      }

      // Navigate to discovery (replace to prevent back button loop)
      Maps('/discover', { replace: true })
    } catch (err) {
      const firebaseErr = err as FirebaseError
      console.error('Failed to save profile:', err)
      if (firebaseErr?.code === 'permission-denied') {
        setSaveError("You don't have permission to perform this action.")
      } else {
        setSaveError('Failed to save your profile. Please try again.')
      }
    } finally {
      setIsSaving(false)
    }
  }

  const handleBack = () => {
    setCurrentStep((prev) => Math.max(1, prev - 1))
  }

  const inputClassName =
    'bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-3 text-slate-900 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 focus:border-blue-600 focus:ring-1 focus:ring-blue-600 outline-none'
  const inputErrorClassName = 'border-red-500 focus:border-red-600 focus:ring-red-600'
  const errorTextClassName = 'mt-1.5 text-xs font-medium text-red-600 dark:text-red-300'

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900 pb-10">
      {/* Progress Bar */}
      <div className="w-full h-1.5 bg-slate-100 dark:bg-slate-800">
        <div
          className="h-1.5 bg-blue-600 transition-all duration-300"
          style={{ width: `${progressPct}%` }}
        />
      </div>

      <div className="max-w-4xl mx-auto min-h-screen flex flex-col px-6 py-8 md:py-12 bg-white dark:bg-slate-800">
        {/* Step 1: Role Selection */}
        {currentStep === 1 && (
          <div>
            <h1 className="font-syne text-2xl font-bold text-slate-900 dark:text-slate-50 mb-2">
              Role Selection
            </h1>
            <p className="text-slate-500 dark:text-slate-400 text-sm mb-6">
              Choose how you want to use Colony.
            </p>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {ROLE_OPTIONS.map((option) => {
                const selected = role === option.role
                return (
                  <button
                    key={option.role}
                    type="button"
                    onClick={() => setRole(option.role)}
                    className={[
                      'rounded-2xl border p-5 text-left transition-colors',
                      selected
                        ? 'border-blue-600 bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-200'
                        : 'border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/40 text-slate-700 dark:text-slate-200 hover:border-blue-300',
                    ].join(' ')}
                  >
                    <h2 className="font-syne text-lg font-bold mb-2">{option.title}</h2>
                    <p className="text-sm leading-relaxed">{option.subtitle}</p>
                  </button>
                )
              })}
            </div>
          </div>
        )}

        {/* Step 2: Vitals */}
        {currentStep === 2 && (
          <div>
            <h1 className="font-syne text-2xl font-bold text-slate-900 dark:text-slate-50 mb-2">
              Tell us about you
            </h1>
            <p className="text-slate-500 dark:text-slate-400 text-sm mb-6">
              Basic details to personalize your matches.
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex flex-col">
                <label className="text-sm font-bold text-slate-700 dark:text-slate-200 mb-1.5">
                  First Name
                </label>
                <input
                  type="text"
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  minLength={2}
                  placeholder="Lucky"
                  className={[
                    inputClassName,
                    vitalsErrors.firstName ? inputErrorClassName : '',
                  ].join(' ')}
                />
                {vitalsErrors.firstName && (
                  <p className={errorTextClassName}>{vitalsErrors.firstName}</p>
                )}
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
                  className={[
                    inputClassName,
                    vitalsErrors.age ? inputErrorClassName : '',
                  ].join(' ')}
                />
                {vitalsErrors.age && <p className={errorTextClassName}>{vitalsErrors.age}</p>}
              </div>

              <div className="flex flex-col">
                <label className="text-sm font-bold text-slate-700 dark:text-slate-200 mb-1.5">
                  Gender
                </label>
                <select
                  value={gender}
                  onChange={(e) => setGender(e.target.value as Gender)}
                  className={[
                    inputClassName,
                    vitalsErrors.gender ? inputErrorClassName : '',
                  ].join(' ')}
                >
                  <option value="">Select gender</option>
                  {GENDERS.map((g) => (
                    <option key={g} value={g}>{g}</option>
                  ))}
                </select>
                {vitalsErrors.gender && (
                  <p className={errorTextClassName}>{vitalsErrors.gender}</p>
                )}
              </div>

              <div className="flex flex-col">
                <label className="text-sm font-bold text-slate-700 dark:text-slate-200 mb-1.5">
                  Course
                </label>
                <select
                  value={course}
                  onChange={(e) => setCourse(e.target.value)}
                  className={[
                    inputClassName,
                    vitalsErrors.course ? inputErrorClassName : '',
                  ].join(' ')}
                >
                  <option value="">Select course</option>
                  {TUK_COURSES.map((courseOption) => (
                    <option key={courseOption} value={courseOption}>
                      {courseOption}
                    </option>
                  ))}
                </select>
                {vitalsErrors.course && <p className={errorTextClassName}>{vitalsErrors.course}</p>}
              </div>

              <div className="flex flex-col md:col-span-1">
                <label className="text-sm font-bold text-slate-700 dark:text-slate-200 mb-1.5">
                  Year of Study
                </label>
                <input
                  type="number"
                  value={yearOfStudy}
                  onChange={(e) => setYearOfStudy(e.target.value)}
                  placeholder="3"
                  className={[
                    inputClassName,
                    vitalsErrors.yearOfStudy ? inputErrorClassName : '',
                  ].join(' ')}
                />
                {vitalsErrors.yearOfStudy && (
                  <p className={errorTextClassName}>{vitalsErrors.yearOfStudy}</p>
                )}
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
                  placeholder="Looking for a respectful roommate with a similar routine."
                  className={inputClassName}
                />
                <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                  {bioQuote.length}/100
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Step 3: Logistics */}
        {currentStep === 3 && (
          <div>
            <h1 className="font-syne text-2xl font-bold text-slate-900 dark:text-slate-50 mb-2">
              Logistics
            </h1>
            <p className="text-slate-500 dark:text-slate-400 text-sm mb-6">
              Set your hard constraints so we match precisely.
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex flex-col md:col-span-2">
                <label className="text-sm font-bold text-slate-700 dark:text-slate-200 mb-1.5">
                  Preferred Zones
                </label>
                <p className="text-xs text-slate-500 dark:text-slate-400 mb-3">
                  Select up to 3 preferred zones ({zones.length}/3)
                </p>
                {logisticsErrors.zones && (
                  <p className={`${errorTextClassName} mb-3`}>{logisticsErrors.zones}</p>
                )}
                <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                  {TUK_ZONES.map((z) => {
                    const selected = zones.includes(z)
                    return (
                      <button
                        key={z}
                        type="button"
                        onClick={() => {
                          if (selected) {
                            setZones(zones.filter((s) => s !== z))
                          } else if (zones.length < 3) {
                            setZones([...zones, z])
                          }
                        }}
                        className={[
                          'rounded-xl border px-3 py-2.5 text-sm font-medium transition-colors text-left',
                          selected
                            ? 'border-blue-600 bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-200'
                            : zones.length === 3
                            ? 'border-slate-100 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/40 text-slate-300 dark:text-slate-500 cursor-not-allowed'
                            : 'border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/40 text-slate-700 dark:text-slate-200 hover:border-blue-300',
                        ].join(' ')}
                        disabled={!selected && zones.length === 3}
                      >
                        {z}
                      </button>
                    )
                  })}
                </div>
              </div>

              <div className="flex flex-col md:col-span-2">
                <label className="text-sm font-bold text-slate-700 dark:text-slate-200 mb-1.5">
                  Budget Range (KES)
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <input
                    type="number"
                    value={minBudget}
                    onChange={(e) => setMinBudget(e.target.value)}
                    placeholder="Min"
                    className={[
                      inputClassName,
                      logisticsErrors.budget ? inputErrorClassName : '',
                      'tabular-nums',
                    ].join(' ')}
                  />
                  <input
                    type="number"
                    value={maxBudget}
                    onChange={(e) => setMaxBudget(e.target.value)}
                    placeholder="Max"
                    className={[
                      inputClassName,
                      logisticsErrors.budget ? inputErrorClassName : '',
                      'tabular-nums',
                    ].join(' ')}
                  />
                </div>
                {logisticsErrors.budget && (
                  <p className={errorTextClassName}>{logisticsErrors.budget}</p>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Step 4: Lifestyle */}
        {currentStep === 4 && (
          <div>
            <h1 className="font-syne text-2xl font-bold text-slate-900 dark:text-slate-50 mb-2">
              Lifestyle Preferences
            </h1>
            <p className="text-slate-500 dark:text-slate-400 text-sm mb-6">
              Tell us how you live so we can find a good fit.
            </p>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="flex flex-col gap-3">
                <label className="text-sm font-bold text-slate-700 dark:text-slate-200 mb-1.5">
                  Sleep Schedule
                </label>
                <div className="flex gap-3">
                  {['Early', 'Late'].map((option) => (
                    <label
                      key={option}
                      className={[
                        'flex-1 rounded-xl border px-4 py-3 text-sm font-medium cursor-pointer transition-colors',
                        sleepSchedule === option
                          ? 'border-blue-600 bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-200'
                          : 'border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/40 text-slate-700 dark:text-slate-200',
                      ].join(' ')}
                    >
                      <input
                        type="radio"
                        name="sleepSchedule"
                        value={option}
                        checked={sleepSchedule === option}
                        onChange={(e) =>
                          setSleepSchedule(
                            e.target.value as 'Early' | 'Late'
                          )
                        }
                        className="sr-only"
                      />
                      {option}
                    </label>
                  ))}
                </div>
                {lifestyleErrors.sleepSchedule && (
                  <p className={errorTextClassName}>{lifestyleErrors.sleepSchedule}</p>
                )}
              </div>

              <div className="flex flex-col gap-3">
                <label className="text-sm font-bold text-slate-700 dark:text-slate-200 mb-1.5">
                  Cleanliness
                </label>
                <div className="flex gap-3">
                  {['Relaxed', 'Strict'].map((option) => (
                    <label
                      key={option}
                      className={[
                        'flex-1 rounded-xl border px-4 py-3 text-sm font-medium cursor-pointer transition-colors',
                        cleanliness === option
                          ? 'border-blue-600 bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-200'
                          : 'border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/40 text-slate-700 dark:text-slate-200',
                      ].join(' ')}
                    >
                      <input
                        type="radio"
                        name="cleanliness"
                        value={option}
                        checked={cleanliness === option}
                        onChange={(e) =>
                          setCleanliness(
                            e.target.value as 'Relaxed' | 'Strict'
                          )
                        }
                        className="sr-only"
                      />
                      {option}
                    </label>
                  ))}
                </div>
                {lifestyleErrors.cleanliness && (
                  <p className={errorTextClassName}>{lifestyleErrors.cleanliness}</p>
                )}
              </div>

              <div className="flex flex-col gap-3">
                <label className="text-sm font-bold text-slate-700 dark:text-slate-200 mb-1.5">
                  Noise Tolerance
                </label>
                <div className="flex gap-3">
                  {['Low', 'High'].map((option) => (
                    <label
                      key={option}
                      className={[
                        'flex-1 rounded-xl border px-4 py-3 text-sm font-medium cursor-pointer transition-colors',
                        noiseTolerance === option
                          ? 'border-blue-600 bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-200'
                          : 'border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/40 text-slate-700 dark:text-slate-200',
                      ].join(' ')}
                    >
                      <input
                        type="radio"
                        name="noiseTolerance"
                        value={option}
                        checked={noiseTolerance === option}
                        onChange={(e) =>
                          setNoiseTolerance(
                            e.target.value as 'Low' | 'High'
                          )
                        }
                        className="sr-only"
                      />
                      {option}
                    </label>
                  ))}
                </div>
                {lifestyleErrors.noiseTolerance && (
                  <p className={errorTextClassName}>{lifestyleErrors.noiseTolerance}</p>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Step 5: Deal Breakers */}
        {currentStep === 5 && (
          <div>
            <h1 className="font-syne text-2xl font-bold text-slate-900 dark:text-slate-50 mb-2">
              Deal Breakers
            </h1>
            <p className="text-slate-500 dark:text-slate-400 text-sm mb-6">
              These preferences will be enforced as hard constraints.
            </p>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <label className="flex items-center gap-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/40 px-4 py-3 text-sm font-medium text-slate-700 dark:text-slate-200">
                <input
                  type="checkbox"
                  checked={nonSmoker}
                  onChange={(e) => setNonSmoker(e.target.checked)}
                  className="h-4 w-4 text-blue-600"
                />
                Non-Smoker
              </label>
              <label className="flex items-center gap-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/40 px-4 py-3 text-sm font-medium text-slate-700 dark:text-slate-200">
                <input
                  type="checkbox"
                  checked={noAlcohol}
                  onChange={(e) => setNoAlcohol(e.target.checked)}
                  className="h-4 w-4 text-blue-600"
                />
                No Alcohol
              </label>
              <label className="flex items-center gap-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/40 px-4 py-3 text-sm font-medium text-slate-700 dark:text-slate-200">
                <input
                  type="checkbox"
                  checked={noPets}
                  onChange={(e) => setNoPets(e.target.checked)}
                  className="h-4 w-4 text-blue-600"
                />
                No Pets
              </label>
            </div>
          </div>
        )}

        {/* Save Error */}
        {saveError && (
          <div className="mt-4 rounded-xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-500/50 px-4 py-3 text-sm text-red-700 dark:text-red-200 font-medium">
            {saveError}
          </div>
        )}

        {/* Navigation Controls */}
        <div className="mt-auto pt-6 flex justify-between gap-4">
          {currentStep > 1 ? (
            <button
              onClick={handleBack}
              disabled={isSaving}
              className="flex-1 py-3.5 rounded-xl border-2 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 font-bold hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors outline-none focus-visible:ring-2 focus-visible:ring-blue-600 disabled:opacity-50"
            >
              Back
            </button>
          ) : (
            <div className="flex-1" />
          )}
          <button
            onClick={handleNext}
            disabled={isNextDisabled}
            className="flex-1 py-3.5 rounded-xl bg-blue-600 text-white font-bold shadow-lg shadow-blue-600/25 hover:bg-blue-700 transition-colors outline-none focus-visible:ring-2 focus-visible:ring-blue-600 focus-visible:ring-offset-2 focus-visible:ring-offset-white dark:focus-visible:ring-offset-slate-950 disabled:bg-slate-300 dark:disabled:bg-slate-700 disabled:text-slate-500 dark:disabled:text-slate-400 disabled:shadow-none disabled:cursor-not-allowed"
          >
            {isSaving
              ? 'Saving…'
              : currentStep === 5
              ? 'Complete Profile'
              : 'Next'}
          </button>
        </div>
      </div>
    </div>
  )
}
