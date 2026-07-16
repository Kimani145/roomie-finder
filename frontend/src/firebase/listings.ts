import { collection, doc, getDoc, getDocs, query, where } from 'firebase/firestore'
import { db } from './config'
import type { Listing } from '@/types'
import { generateDeterministicProfile } from './profiles'

const TUK_ZONES = [
  'Ruiru',
  'Juja',
  'Kahawa',
  'Kahawa Sukari',
  'Thika',
  'Roysambu',
  'Kasarani',
  'South B',
  'Pangani',
  'Muthaiga',
  'Ngara',
]

const HOUSING_TYPES = [
  'Single Room',
  'Bedsitter',
  'Studio',
  'Double Room',
  '1 Bedroom',
  '2 Bedroom',
  '3 Bedroom',
]

const AMENITIES = [
  'WiFi',
  'Water',
  'Security',
  'Parking',
  'Furnished',
  'Laundry Area',
  'Near Campus',
  'Hot Shower',
]

const GUEST_POLICIES = [
  'No overnight guests',
  'Guests allowed until 9PM',
  'Guests allowed with prior notice',
  'Weekend guests allowed',
]

const MOCK_INTERIOR_PHOTOS = [
  'https://images.unsplash.com/photo-1505693416388-ac5ce068fe85?auto=format&fit=crop&w=1200&q=80',
  'https://images.unsplash.com/photo-1493666438817-866a91353ca9?auto=format&fit=crop&w=1200&q=80',
  'https://images.unsplash.com/photo-1484101403633-562f891dc89a?auto=format&fit=crop&w=1200&q=80',
  'https://images.unsplash.com/photo-1493809842364-78817add7ffb?auto=format&fit=crop&w=1200&q=80',
  'https://images.unsplash.com/photo-1505691938895-1758d7feb511?auto=format&fit=crop&w=1200&q=80',
  'https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?auto=format&fit=crop&w=1200&q=80',
  'https://images.unsplash.com/photo-1484154218962-a197022b5858?auto=format&fit=crop&w=1200&q=80',
]

export function generateDeterministicListing(hostId: string): Listing {
  const numId = parseInt(hostId.replace('seed-user-', ''), 10) || 1
  let seed = numId + 500
  const rand = () => {
    seed = (seed * 9301 + 49297) % 233280
    return seed / 233280
  }

  const pick = <T>(arr: T[]): T => arr[Math.floor(rand() * arr.length)]
  const randInt = (min: number, max: number) => Math.floor(rand() * (max - min + 1)) + min
  const pickUnique = <T>(arr: T[], count: number): T[] => {
    const shuffled = [...arr].sort(() => rand() - 0.5)
    return shuffled.slice(0, count)
  }

  const housingType = pick(HOUSING_TYPES)
  let rentTotal = 10000
  switch (housingType) {
    case 'Single Room': rentTotal = randInt(6, 12) * 1000; break
    case 'Bedsitter': rentTotal = randInt(8, 16) * 1000; break
    case 'Studio': rentTotal = randInt(10, 20) * 1000; break
    case 'Double Room': rentTotal = randInt(12, 20) * 1000; break
    case '1 Bedroom': rentTotal = randInt(15, 28) * 1000; break
    case '2 Bedroom': rentTotal = randInt(24, 42) * 1000; break
    case '3 Bedroom': rentTotal = randInt(32, 60) * 1000; break
  }

  return {
    id: `listing-${hostId}`,
    hostId,
    zone: pick(TUK_ZONES) as any,
    housingType: housingType as any,
    rentTotal,
    roommateShare: Math.floor(rentTotal / 2),
    amenities: pickUnique(AMENITIES, randInt(3, 6)),
    photos: pickUnique(MOCK_INTERIOR_PHOTOS, randInt(3, 5)),
    houseRules: {
      smokingAllowed: rand() < 0.25,
      petsAllowed: rand() < 0.3,
      guestPolicy: pick(GUEST_POLICIES),
    },
    createdAt: new Date().toISOString(),
    status: 'active',
    interestCount: randInt(1, 15),
    viewCount: randInt(20, 150),
  }
}

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

  const listingsByHostId: Record<string, Listing> = {}

  // Chunk hostIds into sizes of 10
  const chunks: string[][] = []
  for (let i = 0; i < hostIds.length; i += 10) {
    chunks.push(hostIds.slice(i, i + 10))
  }

  // Query each chunk in parallel
  const queryPromises = chunks.map(async (chunk) => {
    const q = query(
      collection(db, LISTINGS_COLLECTION),
      where('hostId', 'in', chunk),
      where('status', '==', 'active')
    )
    return getDocs(q)
  })

  const snapshots = await Promise.all(queryPromises)

  snapshots.forEach((snapshot) => {
    snapshot.forEach((listingDoc) => {
      const listing = toListing(listingDoc.data(), listingDoc.id)
      if (!listing) return

      const existingListing = listingsByHostId[listing.hostId]
      if (
        !existingListing ||
        new Date(listing.createdAt).getTime() >= new Date(existingListing.createdAt).getTime()
      ) {
        listingsByHostId[listing.hostId] = listing
      }
    })
  })

  // Inject deterministic listings for mock seed hosts
  hostIds.forEach((hostId) => {
    if (hostId.startsWith('seed-user-') && !listingsByHostId[hostId]) {
      const profile = generateDeterministicProfile(hostId)
      if (profile.role === 'HOST') {
        listingsByHostId[hostId] = generateDeterministicListing(hostId)
      }
    }
  })

  return listingsByHostId
}

export async function getListingById(listingId: string): Promise<Listing | null> {
  if (listingId.startsWith('listing-seed-user-')) {
    const hostId = listingId.replace('listing-', '')
    return generateDeterministicListing(hostId)
  }
  const listingSnap = await getDoc(doc(db, LISTINGS_COLLECTION, listingId))
  if (!listingSnap.exists()) return null

  return toListing(listingSnap.data(), listingSnap.id)
}
