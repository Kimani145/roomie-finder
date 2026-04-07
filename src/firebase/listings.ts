import { collection, doc, getDoc, getDocs } from 'firebase/firestore'
import { db } from './config'
import type { Listing } from '@/types'

const LISTINGS_COLLECTION = 'listings'

function toIsoString(value: unknown): string {
  if (typeof value === 'string') return value
  if (value instanceof Date) return value.toISOString()
  if (
    value &&
    typeof value === 'object' &&
    'toDate' in value &&
    typeof value.toDate === 'function'
  ) {
    return value.toDate().toISOString()
  }

  return new Date().toISOString()
}

function toListing(data: any, id: string): Listing | null {
  if (!data?.hostId || !data?.zone || !data?.housingType) return null

  return {
    id,
    hostId: data.hostId,
    zone: data.zone,
    housingType: data.housingType,
    rentTotal: Number(data.rentTotal ?? 0),
    roommateShare: Number(data.roommateShare ?? 0),
    amenities: Array.isArray(data.amenities) ? data.amenities : [],
    photos: Array.isArray(data.photos) ? data.photos : [],
    houseRules: {
      smokingAllowed: !!data?.houseRules?.smokingAllowed,
      petsAllowed: !!data?.houseRules?.petsAllowed,
      guestPolicy: data?.houseRules?.guestPolicy ?? '',
    },
    createdAt: toIsoString(data.createdAt),
    status: data.status ?? 'active',
    interestCount: Number(data.interestCount ?? 0),
    viewCount: Number(data.viewCount ?? 0),
  }
}

export async function fetchListingsByHostIds(
  hostIds: string[]
): Promise<Record<string, Listing>> {
  if (!hostIds.length) return {}

  const hostIdSet = new Set(hostIds)
  const snapshot = await getDocs(collection(db, LISTINGS_COLLECTION))
  const listingsByHostId: Record<string, Listing> = {}

  snapshot.forEach((listingDoc) => {
    const listing = toListing(listingDoc.data(), listingDoc.id)
    if (!listing) return
    if (!hostIdSet.has(listing.hostId)) return
    if (listing.status !== 'active') return

    const existingListing = listingsByHostId[listing.hostId]
    if (
      !existingListing ||
      new Date(listing.createdAt).getTime() >= new Date(existingListing.createdAt).getTime()
    ) {
      listingsByHostId[listing.hostId] = listing
    }
  })

  return listingsByHostId
}

export async function getListingById(listingId: string): Promise<Listing | null> {
  const listingSnap = await getDoc(doc(db, LISTINGS_COLLECTION, listingId))
  if (!listingSnap.exists()) return null

  return toListing(listingSnap.data(), listingSnap.id)
}
