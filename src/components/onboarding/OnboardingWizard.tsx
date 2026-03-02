import React, { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '@/hooks/useAuth'
import { saveUserProfile, getUserProfile } from '@/firebase/profiles'
import { useAuthStore } from '@/store/authStore'
import { TUK_ZONES, TukZone } from '@/constants/zones';
import type { Gender } from '@/types';

const GENDERS: Gender[] = ['Male', 'Female', 'Non-binary', 'Prefer not to say']

export const OnboardingWizard: React.FC = () => {
  const navigate = useNavigate()
  const { user } = useAuth()
  const { setCurrentUser } = useAuthStore()
  const [currentStep, setCurrentStep] = useState(1)
  const [isSaving, setIsSaving] = useState(false)
  const [saveError, setSaveError] = useState<string | null>(null)

  const [firstName, setFirstName] = useState('')
  const [age, setAge] = useState('')
  const [gender, setGender] = useState<Gender | ''>('')
  const [course, setCourse] = useState('')
  const [yearOfStudy, setYearOfStudy] = useState('')

  const [zone, setZone] = useState<TukZone | ''>('')
  const [minBudget, setMinBudget] = useState('')
  const [maxBudget, setMaxBudget] = useState('')

  const [sleepSchedule, setSleepSchedule] = useState<'Early' | 'Late' | ''>('')
  const [cleanliness, setCleanliness] = useState<'Relaxed' | 'Strict' | ''>('')
  const [noiseTolerance, setNoiseTolerance] = useState<'Low' | 'High' | ''>('')

  const [nonSmoker, setNonSmoker] = useState(false)
  const [noAlcohol, setNoAlcohol] = useState(false)
  const [noPets, setNoPets] = useState(false)

  const progressPct = useMemo(() => (currentStep / 4) * 100, [currentStep])

  const handleNext = async () => {
    if (currentStep < 4) {
      setCurrentStep((prev) => prev + 1)
      return
    }

    if (!user) return
    setIsSaving(true)
    setSaveError(null)

    try {
      const profile = {
        displayName: firstName,
        photoURL: null,
        gender: (gender || 'Prefer not to say') as Gender,
        age: age ? Number(age) : 18,
        school: 'Technical University of Kenya',
        courseYear: yearOfStudy ? Number(yearOfStudy) : 1,
        minBudget: minBudget ? Number(minBudget) : 5000,
        maxBudget: maxBudget ? Number(maxBudget) : 15000,
        zone: (zone || 'Juja') as TukZone,
        preferredRoomType: 'Single Room' as const,
        lifestyle: {
          sleepTime: (sleepSchedule || 'Flexible') as 'Early' | 'Late' | 'Flexible',
          noiseTolerance: (noiseTolerance || 'Medium') as 'Low' | 'Medium' | 'High',
          guestFrequency: 'Sometimes' as const,
          cleanlinessLevel: (cleanliness || 'Moderate') as 'Relaxed' | 'Moderate' | 'Strict',
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

      await saveUserProfile(user.uid, profile)

      // Re-fetch the full profile (with server timestamps) and load into store
      const saved = await getUserProfile(user.uid)
      if (saved) setCurrentUser(saved)

      navigate('/discover', { replace: true })
    } catch (err) {
      console.error('Failed to save profile:', err)
      setSaveError('Failed to save your profile. Please try again.')
    } finally {
      setIsSaving(false)
    }
  }

  const handleBack = () => {
    setCurrentStep((prev) => Math.max(1, prev - 1))
  }

  const inputClassName =
    'bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 focus:border-brand-500 focus:ring-1 focus:ring-brand-500 outline-none'

  return (
    <div className="min-h-screen bg-white pb-10">
      {/* Progress Bar */}
      <div className="w-full h-1.5 bg-slate-100">
        <div
          className="h-1.5 bg-brand-500 transition-all duration-300"
          style={{ width: `${progressPct}%` }}
        />
      </div>

      <div className="max-w-md mx-auto min-h-screen flex flex-col px-6 py-8 bg-white">
        {/* Step 1: Vitals */}
        {currentStep === 1 && (
          <div>
            <h1 className="font-syne text-2xl font-bold text-slate-900 mb-2">
              Tell us about you
            </h1>
            <p className="text-slate-500 text-sm mb-6">
              Basic details to personalize your matches.
            </p>

            <div className="flex flex-col gap-4">
              <div className="flex flex-col">
                <label className="text-sm font-bold text-slate-700 mb-1.5">
                  First Name
                </label>
                <input
                  type="text"
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  placeholder="Joseph"
                  className={inputClassName}
                />
              </div>

              <div className="flex flex-col">
                <label className="text-sm font-bold text-slate-700 mb-1.5">
                  Age
                </label>
                <input
                  type="number"
                  value={age}
                  onChange={(e) => setAge(e.target.value)}
                  placeholder="21"
                  className={inputClassName}
                />
              </div>

              <div className="flex flex-col">
                <label className="text-sm font-bold text-slate-700 mb-1.5">
                  Gender
                </label>
                <select
                  value={gender}
                  onChange={(e) => setGender(e.target.value as Gender)}
                  className={inputClassName}
                >
                  <option value="">Select gender</option>
                  {GENDERS.map((g) => (
                    <option key={g} value={g}>{g}</option>
                  ))}
                </select>
              </div>

              <div className="flex flex-col">
                <label className="text-sm font-bold text-slate-700 mb-1.5">
                  Course
                </label>
                <input
                  type="text"
                  value={course}
                  onChange={(e) => setCourse(e.target.value)}
                  placeholder="BSc Information Science"
                  className={inputClassName}
                />
              </div>

              <div className="flex flex-col">
                <label className="text-sm font-bold text-slate-700 mb-1.5">
                  Year of Study
                </label>
                <input
                  type="number"
                  value={yearOfStudy}
                  onChange={(e) => setYearOfStudy(e.target.value)}
                  placeholder="3"
                  className={inputClassName}
                />
              </div>
            </div>
          </div>
        )}

        {/* Step 2: Logistics */}
        {currentStep === 2 && (
          <div>
            <h1 className="font-syne text-2xl font-bold text-slate-900 mb-2">
              Logistics
            </h1>
            <p className="text-slate-500 text-sm mb-6">
              Set your hard constraints so we match precisely.
            </p>

            <div className="flex flex-col gap-4">
              <div className="flex flex-col">
                <label className="text-sm font-bold text-slate-700 mb-1.5">
                  Preferred Zone
                </label>
                <select
                  value={zone}
                  onChange={(e) => setZone(e.target.value as TukZone | '')}
                  className={inputClassName}
                >
                  <option value="">Select a zone</option>
                  {TUK_ZONES.map((zoneOption) => (
                    <option key={zoneOption} value={zoneOption}>
                      {zoneOption}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex flex-col">
                <label className="text-sm font-bold text-slate-700 mb-1.5">
                  Budget Range (KES)
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <input
                    type="number"
                    value={minBudget}
                    onChange={(e) => setMinBudget(e.target.value)}
                    placeholder="Min"
                    className={inputClassName}
                  />
                  <input
                    type="number"
                    value={maxBudget}
                    onChange={(e) => setMaxBudget(e.target.value)}
                    placeholder="Max"
                    className={inputClassName}
                  />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Step 3: Lifestyle */}
        {currentStep === 3 && (
          <div>
            <h1 className="font-syne text-2xl font-bold text-slate-900 mb-2">
              Lifestyle Preferences
            </h1>
            <p className="text-slate-500 text-sm mb-6">
              Tell us how you live so we can find a good fit.
            </p>

            <div className="flex flex-col gap-6">
              <div className="flex flex-col gap-3">
                <label className="text-sm font-bold text-slate-700 mb-1.5">
                  Sleep Schedule
                </label>
                <div className="flex gap-3">
                  {['Early', 'Late'].map((option) => (
                    <label
                      key={option}
                      className={[
                        'flex-1 rounded-xl border px-4 py-3 text-sm font-medium cursor-pointer transition-colors',
                        sleepSchedule === option
                          ? 'border-brand-500 bg-brand-50 text-brand-700'
                          : 'border-slate-200 bg-slate-50 text-slate-700',
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
              </div>

              <div className="flex flex-col gap-3">
                <label className="text-sm font-bold text-slate-700 mb-1.5">
                  Cleanliness
                </label>
                <div className="flex gap-3">
                  {['Relaxed', 'Strict'].map((option) => (
                    <label
                      key={option}
                      className={[
                        'flex-1 rounded-xl border px-4 py-3 text-sm font-medium cursor-pointer transition-colors',
                        cleanliness === option
                          ? 'border-brand-500 bg-brand-50 text-brand-700'
                          : 'border-slate-200 bg-slate-50 text-slate-700',
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
              </div>

              <div className="flex flex-col gap-3">
                <label className="text-sm font-bold text-slate-700 mb-1.5">
                  Noise Tolerance
                </label>
                <div className="flex gap-3">
                  {['Low', 'High'].map((option) => (
                    <label
                      key={option}
                      className={[
                        'flex-1 rounded-xl border px-4 py-3 text-sm font-medium cursor-pointer transition-colors',
                        noiseTolerance === option
                          ? 'border-brand-500 bg-brand-50 text-brand-700'
                          : 'border-slate-200 bg-slate-50 text-slate-700',
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
              </div>
            </div>
          </div>
        )}

        {/* Step 4: Deal Breakers */}
        {currentStep === 4 && (
          <div>
            <h1 className="font-syne text-2xl font-bold text-slate-900 mb-2">
              Deal Breakers
            </h1>
            <p className="text-slate-500 text-sm mb-6">
              These preferences will be enforced as hard constraints.
            </p>

            <div className="flex flex-col gap-4">
              <label className="flex items-center gap-3 rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-medium text-slate-700">
                <input
                  type="checkbox"
                  checked={nonSmoker}
                  onChange={(e) => setNonSmoker(e.target.checked)}
                  className="h-4 w-4 text-brand-500"
                />
                Non-Smoker
              </label>
              <label className="flex items-center gap-3 rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-medium text-slate-700">
                <input
                  type="checkbox"
                  checked={noAlcohol}
                  onChange={(e) => setNoAlcohol(e.target.checked)}
                  className="h-4 w-4 text-brand-500"
                />
                No Alcohol
              </label>
              <label className="flex items-center gap-3 rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-medium text-slate-700">
                <input
                  type="checkbox"
                  checked={noPets}
                  onChange={(e) => setNoPets(e.target.checked)}
                  className="h-4 w-4 text-brand-500"
                />
                No Pets
              </label>
            </div>
          </div>
        )}

        {/* Save Error */}
        {saveError && (
          <div className="mt-4 rounded-xl bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700 font-medium">
            {saveError}
          </div>
        )}

        {/* Navigation Controls */}
        <div className="mt-auto pt-6 flex justify-between gap-4">
          {currentStep > 1 ? (
            <button
              onClick={handleBack}
              disabled={isSaving}
              className="flex-1 py-3.5 rounded-xl border-2 border-slate-200 text-slate-600 font-bold hover:bg-slate-50 transition-colors outline-none focus-visible:ring-2 focus-visible:ring-brand-500 disabled:opacity-50"
            >
              Back
            </button>
          ) : (
            <div className="flex-1" />
          )}
          <button
            onClick={handleNext}
            disabled={isSaving}
            className="flex-1 py-3.5 rounded-xl bg-brand-500 text-white font-bold shadow-lg shadow-brand-500/25 hover:bg-brand-600 transition-colors outline-none focus-visible:ring-2 focus-visible:ring-brand-500 focus-visible:ring-offset-2 disabled:opacity-50"
          >
            {isSaving
              ? 'Saving…'
              : currentStep === 4
              ? 'Complete Profile'
              : 'Next'}
          </button>
        </div>
      </div>
    </div>
  )
}
