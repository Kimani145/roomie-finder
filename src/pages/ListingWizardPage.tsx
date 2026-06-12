import React, { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  collection,
  doc,
  getDocs,
  query,
  serverTimestamp,
  where,
  writeBatch,
} from 'firebase/firestore'
import toast from 'react-hot-toast'
import { useAuth } from '@/hooks/useAuth'
import { db } from '@/firebase/config'
import { TUK_ZONES } from '@/constants/zones'
import { HOUSING_TYPES } from '@/types'
import { uploadToCloudinary } from '@/utils/uploadToCloudinary'
import type { HousingType, TukZone } from '@/types'
import { inputCls as inputClassName } from '@/utils/formStyles'

const AMENITY_OPTIONS = [
  'WiFi',
  'Water',
  'Security',
  'Parking',
  'Furnished',
  'Laundry Area',
  'Near Campus',
  'Hot Shower',
]

const ListingWizardPage: React.FC = () => {
  const navigate = useNavigate()
  const { user: currentUser } = useAuth()
  const [step, setStep] = useState(1)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState<string | null>(null)

  const [zone, setZone] = useState<TukZone | ''>('')
  const [housingType, setHousingType] = useState<HousingType | ''>('')
  const [rentTotal, setRentTotal] = useState('')
  const [roommateShare, setRoommateShare] = useState('')

  const [amenities, setAmenities] = useState<string[]>([])
  const [photos, setPhotos] = useState<File[]>([])

  const [smokingAllowed, setSmokingAllowed] = useState(false)
  const [petsAllowed, setPetsAllowed] = useState(false)
  const [guestPolicy, setGuestPolicy] = useState('')

  const rentValue = Number(rentTotal)
  const shareValue = Number(roommateShare)

  const stepOneErrors = useMemo(
    () => ({
      zone: zone ? '' : 'Zone is required.',
      housingType: housingType ? '' : 'Housing type is required.',
      rentTotal:
        !rentTotal.trim()
          ? 'Total rent is required.'
          : Number.isNaN(rentValue) || rentValue <= 0
          ? 'Total rent must be greater than 0.'
          : '',
      roommateShare:
        !roommateShare.trim()
          ? 'Match contribution is required.'
          : Number.isNaN(shareValue) || shareValue <= 0
          ? 'Match contribution must be greater than 0.'
          : shareValue >= rentValue
          ? 'Match contribution must be less than total rent.'
          : '',
    }),
    [housingType, rentTotal, rentValue, roommateShare, shareValue, zone]
  )

  const stepTwoError =
    amenities.length < 1 ? 'Select at least one amenity.' : ''
  const stepThreeError =
    photos.length < 3 || photos.length > 5
      ? 'Upload between 3 and 5 photos.'
      : ''
  const stepFourError = guestPolicy.trim()
    ? ''
    : 'Guest policy is required.'

  const isCurrentStepValid = useMemo(() => {
    if (step === 1) return Object.values(stepOneErrors).every((error) => !error)
    if (step === 2) return !stepTwoError
    if (step === 3) return !stepThreeError
    if (step === 4) return !stepFourError
    return false
  }, [step, stepFourError, stepOneErrors, stepThreeError, stepTwoError])

  const toggleAmenity = (amenity: string) => {
    setAmenities((prev) =>
      prev.includes(amenity)
        ? prev.filter((item) => item !== amenity)
        : [...prev, amenity]
    )
  }

  const handlePhotosChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const incomingFiles = Array.from(event.target.files || []).filter((file) =>
      file.type.startsWith('image/')
    )
    setPhotos(incomingFiles.slice(0, 5))
  }

  const handlePublish = async () => {
    if (photos.length === 0) {
      toast.error('Please add at least one photo of the room.')
      return
    }

    if (!currentUser?.uid) {
      toast.error('You need to be signed in to publish a listing.')
      return
    }

    setIsSubmitting(true)
    setSubmitError(null)

    try {
      let uploadedUrls: string[] = []
      try {
        uploadedUrls = await Promise.all(photos.map((file) => uploadToCloudinary(file)))
      } catch (uploadError: any) {
        const message =
          uploadError instanceof Error
            ? uploadError.message
            : 'Failed to upload one or more photos.'
        toast.error(message)
        setSubmitError(message)
        setIsSubmitting(false)
        return
      }

      const listingRef = doc(collection(db, 'listings'))
      const batch = writeBatch(db)

      const activeListingsQuery = query(
        collection(db, 'listings'),
        where('hostId', '==', currentUser.uid),
        where('status', '==', 'active')
      )

      const activeListingsSnapshot = await getDocs(activeListingsQuery)
      activeListingsSnapshot.forEach((listingDoc) => {
        batch.update(listingDoc.ref, { status: 'paused' })
      })

      const listingData = {
        id: listingRef.id,
        hostId: currentUser.uid,
        zone: zone as TukZone,
        housingType: housingType as HousingType,
        rentTotal: rentValue,
        roommateShare: shareValue,
        amenities,
        photos: uploadedUrls,
        houseRules: {
          smokingAllowed,
          petsAllowed,
          guestPolicy: guestPolicy.trim(),
        },
        createdAt: serverTimestamp(),
        status: 'active' as const,
        interestCount: 0,
        viewCount: 0,
      }

      batch.set(listingRef, listingData)
      await batch.commit()
      toast.success('Listing published successfully!')
      navigate('/my-listings')
    } catch (error) {
      console.error('Publishing error:', error)
      setSubmitError('Failed to publish listing. Please try again.')
      toast.error('Failed to publish listing. Please try again.')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleNext = async () => {
    if (!isCurrentStepValid) return
    if (step < 4) {
      setStep((prev) => prev + 1)
      return
    }

    await handlePublish()
  }

  const fieldClassName = inputClassName;
  const errorTextClassName = 'mt-1.5 text-xs font-medium text-red-600 dark:text-red-300'

  return (
    <div className="min-h-full bg-transparent pb-8">
      <div className="w-full h-1.5 bg-slate-100 dark:bg-slate-800">
        <div
          className="h-1.5 bg-brand-600 transition-all duration-300"
          style={{ width: `${(step / 4) * 100}%` }}
        />
      </div>

      <div className="max-w-3xl mx-auto px-6 py-8 md:py-12">
        {step === 1 && (
          <section>
            <h1 className="font-syne text-2xl font-bold text-slate-900 dark:text-slate-50 mb-2">
              Property Info
            </h1>
            <p className="text-sm text-slate-500 dark:text-slate-400 mb-6">
              Share the basics of your place and rent split.
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-bold text-slate-700 dark:text-slate-200 mb-1.5 block">
                  Zone
                </label>
                <select
                  value={zone}
                  onChange={(e) => setZone(e.target.value as TukZone)}
                  className={fieldClassName}
                >
                  <option value="">Select zone</option>
                  {TUK_ZONES.map((entry) => (
                    <option key={entry} value={entry}>
                      {entry}
                    </option>
                  ))}
                </select>
                {stepOneErrors.zone && <p className={errorTextClassName}>{stepOneErrors.zone}</p>}
              </div>

              <div>
                <label className="text-sm font-bold text-slate-700 dark:text-slate-200 mb-1.5 block">
                  Housing Type
                </label>
                <select
                  value={housingType}
                  onChange={(e) => setHousingType(e.target.value as HousingType)}
                  className={fieldClassName}
                >
                  <option value="">Select housing type</option>
                  {HOUSING_TYPES.map((entry) => (
                    <option key={entry} value={entry}>
                      {entry}
                    </option>
                  ))}
                </select>
                {stepOneErrors.housingType && (
                  <p className={errorTextClassName}>{stepOneErrors.housingType}</p>
                )}
              </div>

              <div>
                <label className="text-sm font-bold text-slate-700 dark:text-slate-200 mb-1.5 block">
                  Total Rent (KES)
                </label>
                <input
                  type="number"
                  value={rentTotal}
                  onChange={(e) => setRentTotal(e.target.value)}
                  className={`${fieldClassName} tabular-nums`}
                  placeholder="12000"
                />
                {stepOneErrors.rentTotal && (
                  <p className={errorTextClassName}>{stepOneErrors.rentTotal}</p>
                )}
              </div>

              <div>
                <label className="text-sm font-bold text-slate-700 dark:text-slate-200 mb-1.5 block">
                  Match Pays (KES)
                </label>
                <input
                  type="number"
                  value={roommateShare}
                  onChange={(e) => setRoommateShare(e.target.value)}
                  className={`${fieldClassName} tabular-nums`}
                  placeholder="6000"
                />
                {stepOneErrors.roommateShare && (
                  <p className={errorTextClassName}>{stepOneErrors.roommateShare}</p>
                )}
              </div>
            </div>
          </section>
        )}

        {step === 2 && (
          <section>
            <h1 className="font-syne text-2xl font-bold text-slate-900 dark:text-slate-50 mb-2">
              Amenities
            </h1>
            <p className="text-sm text-slate-500 dark:text-slate-400 mb-6">
              Select amenities available in the property.
            </p>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {AMENITY_OPTIONS.map((amenity) => {
                const selected = amenities.includes(amenity)
                return (
                  <button
                    key={amenity}
                    type="button"
                    onClick={() => toggleAmenity(amenity)}
                    className={[
                      'rounded-xl border px-3 py-2.5 text-sm font-medium transition-colors',
                      selected
                        ? 'border-brand-600 bg-brand-600/10 text-brand-600 dark:text-brand-600'
                        : 'border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/40 text-slate-700 dark:text-slate-200 hover:border-brand-600/50',
                    ].join(' ')}
                  >
                    {amenity}
                  </button>
                )
              })}
            </div>
            {stepTwoError && <p className={errorTextClassName}>{stepTwoError}</p>}
          </section>
        )}

        {step === 3 && (
          <section>
            <h1 className="font-syne text-2xl font-bold text-slate-900 dark:text-slate-50 mb-2">Photos</h1>
            <p className="text-sm text-slate-500 dark:text-slate-400 mb-6">
              Upload 3 to 5 interior photos.
            </p>

            <label className="block rounded-2xl border-2 border-dashed border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/40 px-5 py-10 text-center cursor-pointer hover:border-brand-600/50 transition-colors">
              <input
                type="file"
                accept="image/*"
                multiple
                onChange={handlePhotosChange}
                className="hidden"
              />
              <span className="text-sm font-medium text-slate-700 dark:text-slate-200">
                Click to upload images
              </span>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                Accepted: JPG/PNG/WebP (3-5 files)
              </p>
            </label>

            <div className="mt-4 space-y-2">
              {photos.map((file) => (
                <p key={file.name} className="text-xs text-slate-600 dark:text-slate-300">
                  {file.name}
                </p>
              ))}
            </div>

            {stepThreeError && <p className={errorTextClassName}>{stepThreeError}</p>}
          </section>
        )}

        {step === 4 && (
          <section>
            <h1 className="font-syne text-2xl font-bold text-slate-900 dark:text-slate-50 mb-2">
              House Rules
            </h1>
            <p className="text-sm text-slate-500 dark:text-slate-400 mb-6">
              Add basic rules to set expectations.
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-5">
              <label className="flex items-center gap-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/40 px-4 py-3 text-sm font-medium text-slate-700 dark:text-slate-200">
                <input
                  type="checkbox"
                  checked={smokingAllowed}
                  onChange={(e) => setSmokingAllowed(e.target.checked)}
                  className="h-4 w-4 text-brand-600 focus:ring-brand-600"
                />
                Smoking Allowed
              </label>
              <label className="flex items-center gap-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/40 px-4 py-3 text-sm font-medium text-slate-700 dark:text-slate-200">
                <input
                  type="checkbox"
                  checked={petsAllowed}
                  onChange={(e) => setPetsAllowed(e.target.checked)}
                  className="h-4 w-4 text-brand-600 focus:ring-brand-600"
                />
                Pets Allowed
              </label>
            </div>

            <div>
              <label className="text-sm font-bold text-slate-700 dark:text-slate-200 mb-1.5 block">
                Guest Policy
              </label>
              <input
                type="text"
                value={guestPolicy}
                onChange={(e) => setGuestPolicy(e.target.value)}
                className={fieldClassName}
                placeholder="e.g. Guests allowed with prior notice."
              />
              {stepFourError && <p className={errorTextClassName}>{stepFourError}</p>}
            </div>
          </section>
        )}

        {submitError && (
          <div className="mt-5 rounded-xl border border-red-200 dark:border-red-500/50 bg-red-50 dark:bg-red-950/40 px-4 py-3 text-sm text-red-700 dark:text-red-200">
            {submitError}
          </div>
        )}

        <div className="mt-8 flex justify-between gap-4">
          {step > 1 ? (
            <button
              type="button"
              onClick={() => setStep((prev) => Math.max(1, prev - 1))}
              disabled={isSubmitting}
              className="flex-1 py-3.5 rounded-xl border-2 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 font-bold hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors outline-none focus-visible:ring-2 focus-visible:ring-brand-600 disabled:opacity-50"
            >
              Back
            </button>
          ) : (
            <div className="flex-1" />
          )}

          <button
            type="button"
            onClick={handleNext}
            disabled={isSubmitting || !isCurrentStepValid}
            className="flex-1 py-3.5 rounded-xl bg-brand-600 text-white font-bold hover:bg-brand-700 active:scale-[0.98] transition-colors outline-none focus-visible:ring-2 focus-visible:ring-brand-600 focus-visible:ring-offset-2 focus-visible:ring-offset-white dark:focus-visible:ring-offset-slate-950 disabled:bg-slate-300 dark:disabled:bg-slate-700 disabled:text-slate-500 dark:disabled:text-slate-400 disabled:opacity-100 disabled:cursor-not-allowed"
          >
            {isSubmitting
              ? 'Creating...'
              : step === 4
              ? 'Publish Listing'
              : 'Next'}
          </button>
        </div>
      </div>
    </div>
  )
}

export default ListingWizardPage
