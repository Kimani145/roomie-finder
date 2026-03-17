import React, { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { collection, doc, serverTimestamp, setDoc } from 'firebase/firestore'
import toast from 'react-hot-toast'
import { useAuth } from '@/hooks/useAuth'
import { db } from '@/firebase/config'
import { TUK_ZONES } from '@/constants/zones'
import { HOUSING_TYPES } from '@/types'
import type { HousingType, TukZone } from '@/types'

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

const CLOUDINARY_CLOUD_NAME =
  import.meta.env.VITE_CLOUDINARY_CLOUD_NAME || 'dhdh8lq9'
const CLOUDINARY_UPLOAD_PRESET =
  import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET || 'roomie_unsigned'

const uploadToCloudinary = async (file: File): Promise<string> => {
  const formData = new FormData()
  formData.append('file', file)
  formData.append('upload_preset', CLOUDINARY_UPLOAD_PRESET)

  console.log("Cloud Name being used:", CLOUDINARY_CLOUD_NAME);
  console.log("Preset being used:", CLOUDINARY_UPLOAD_PRESET);
  
  const response = await fetch(
    `https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/image/upload`,
    {
      method: 'POST',
      body: formData,
    }
  )

  if (!response.ok) {
    const errorData = await response.json()
    console.error('Cloudinary Error Details:', errorData)
    throw new Error('Failed to upload image')
  }

  const data = (await response.json()) as { secure_url?: string }
  if (!data.secure_url) throw new Error('Missing secure image URL from Cloudinary')

  return data.secure_url
}

const ListingWizardPage: React.FC = () => {
  const navigate = useNavigate()
  const { user } = useAuth()
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
          ? 'Roommate contribution is required.'
          : Number.isNaN(shareValue) || shareValue <= 0
          ? 'Roommate contribution must be greater than 0.'
          : shareValue >= rentValue
          ? 'Roommate contribution must be less than total rent.'
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

    if (!user) {
      toast.error('You need to be signed in to publish a listing.')
      return
    }

    setIsSubmitting(true)
    setSubmitError(null)

    try {
      const uploadedUrls = await Promise.all(photos.map((file) => uploadToCloudinary(file)))

      const listingRef = doc(collection(db, 'listings'))
      const listingData = {
        id: listingRef.id,
        hostId: user.uid,
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
      }

      await setDoc(listingRef, listingData)
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

  const fieldClassName =
    'w-full bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-3 text-slate-900 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-600'
  const errorTextClassName = 'mt-1.5 text-xs font-medium text-red-600 dark:text-red-300'

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 pb-8">
      <div className="w-full h-1.5 bg-slate-100 dark:bg-slate-800">
        <div
          className="h-1.5 bg-blue-600 transition-all duration-300"
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
                  Roommate Pays (KES)
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
                        ? 'border-blue-600 bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-200'
                        : 'border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/40 text-slate-700 dark:text-slate-200 hover:border-blue-300',
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

            <label className="block rounded-2xl border-2 border-dashed border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/40 px-5 py-10 text-center cursor-pointer hover:border-blue-400 transition-colors">
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
                  className="h-4 w-4 text-blue-600"
                />
                Smoking Allowed
              </label>
              <label className="flex items-center gap-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/40 px-4 py-3 text-sm font-medium text-slate-700 dark:text-slate-200">
                <input
                  type="checkbox"
                  checked={petsAllowed}
                  onChange={(e) => setPetsAllowed(e.target.checked)}
                  className="h-4 w-4 text-blue-600"
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
              className="flex-1 py-3.5 rounded-xl border-2 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 font-bold hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors disabled:opacity-50"
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
            className="flex-1 py-3.5 rounded-xl bg-blue-600 text-white font-bold hover:bg-blue-700 transition-colors disabled:opacity-50"
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
