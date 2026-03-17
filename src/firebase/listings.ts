import { collection, getDocs } from 'firebase/firestore'
import { db } from './config'
import type { Listing } from '@/types'

const LISTINGS_COLLECTION = 'listings'

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
    createdAt:
      typeof data.createdAt === 'string'
        ? data.createdAt
        : new Date().toISOString(),
    status: data.status ?? 'active',
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
    listingsByHostId[listing.hostId] = listing
  })

  return listingsByHostId
}
