import { writeBatch, doc, serverTimestamp } from 'firebase/firestore'
import { db } from '@/firebase/config'
import { TUK_ZONES } from '@/constants/zones'
import { HOUSING_TYPES } from '@/types'
import type {
  Gender,
  SleepTime,
  NoiseTolerance,
  GuestFrequency,
  CleanlinessLevel,
  StudyStyle,
  HousingType,
  ProfileStatus,
  TukZone,
  UserRole,
  Listing,
} from '@/types'

const COURSES = [
  'BSc Information Science',
  'BSc Electrical Engineering',
  'BSc Computer Science',
  'BA Business Administration',
  'BSc Civil Engineering',
  'BSc Applied Physics',
  'BSc Mechanical Engineering',
  'Diploma in ICT',
]

const FIRST_NAMES = [
  'Brian',
  'Amina',
  'Kevin',
  'Grace',
  'Dennis',
  'Faith',
  'Elijah',
  'Ivy',
  'Farouk',
  'Tiffany',
  'George',
  'Yvonne',
  'Harrison',
  'Hannah',
  'Ian',
  'Mary',
  'James',
  'Olivia',
  'Kelvin',
  'Sharon',
  'Leonard',
  'Ruth',
  'Newton',
  'Diana',
  'Oscar',
  'Janet',
  'Patrick',
  'Linda',
  'Ronald',
  'Priscilla',
  'Samuel',
  'Nancy',
  'Victor',
  'Ursula',
  'Wilfred',
  'Zipporah',
]

const LAST_NAMES = [
  'Otieno',
  'Mwangi',
  'Kamau',
  'Waweru',
  'Hassan',
  'Kimani',
  'Odhiambo',
  'Njuguna',
  'Cheruiyot',
  'Mutua',
  'Wekesa',
  'Njoroge',
  'Omondi',
  'Kiprotich',
  'Gitau',
  'Barasa',
  'Achieng',
  'Muthoni',
  'Chelangat',
  'Akinyi',
  'Njeri',
  'Wairimu',
  'Kemunto',
  'Moraa',
  'Nekesa',
  'Atieno',
  'Wambui',
  'Cherono',
  'Mumbi',
  'Adhiambo',
]

const GENDERS: Gender[] = ['Male', 'Female', 'Non-binary']
const USER_ROLES: UserRole[] = ['HOST', 'SEEKER', 'FLEX']
const PROFILE_STATUSES: ProfileStatus[] = ['active', 'active', 'active', 'paused', 'inactive']
const SLEEP_TIMES: SleepTime[] = ['Early', 'Late', 'Flexible']
const NOISE_LEVELS: NoiseTolerance[] = ['Low', 'Medium', 'High']
const GUEST_FREQS: GuestFrequency[] = ['Rare', 'Sometimes', 'Often']
const CLEANLINESS: CleanlinessLevel[] = ['Relaxed', 'Moderate', 'Strict']
const STUDY_STYLES: StudyStyle[] = ['Silent', 'Background noise ok']
const HOUSING_POOL: HousingType[] = [...HOUSING_TYPES]
const LISTING_AMENITIES = [
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
const LISTING_STATUSES: Listing['status'][] = ['active', 'active', 'paused', 'filled']

function pick<T>(arr: readonly T[]): T {
  return arr[Math.floor(Math.random() * arr.length)]
}

function pickUnique<T>(arr: readonly T[], count: number): T[] {
  const shuffled = [...arr].sort(() => Math.random() - 0.5)
  return shuffled.slice(0, Math.min(count, arr.length))
}

function randInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min
}

function getHousingRentRange(housingType: HousingType): [number, number] {
  switch (housingType) {
    case 'Single Room':
      return [6000, 12000]
    case 'Bedsitter':
      return [8000, 16000]
    case 'Studio':
      return [10000, 20000]
    case 'Double Room':
      return [12000, 20000]
    case '1 Bedroom':
      return [15000, 28000]
    case '2 Bedroom':
      return [24000, 42000]
    case '3 Bedroom':
      return [32000, 60000]
  }
}

function randomRentTotal(housingType: HousingType): number {
  const [min, max] = getHousingRentRange(housingType)
  return randInt(min / 1000, max / 1000) * 1000
}

function randomMoveInMonth(): string {
  return `2026-${String(randInt(1, 12)).padStart(2, '0')}`
}

function avatarUrl(displayName: string): string {
  const encoded = encodeURIComponent(displayName)
  return `https://ui-avatars.com/api/?name=${encoded}&background=3b82f6&color=fff&size=256&bold=true`
}

function seedUid(index: number): string {
  return `seed-user-${String(index + 1).padStart(3, '0')}`
}

function seedDisplayName(index: number): string {
  const first = FIRST_NAMES[index % FIRST_NAMES.length]
  const last = LAST_NAMES[(index * 7) % LAST_NAMES.length]
  return `${first} ${last}`
}

/**
 * Client seeder for development.
 * Requires Firestore rules to allow the signed-in dev user
 * to write seed IDs (`seed-user-###` and `listing-seed-user-###`).
 */
export async function seedMockUsers(maxUsers = 100): Promise<void> {
  const SAFE_MAX = Math.max(1, Math.min(100, Math.floor(maxUsers)))
  const PROFILES_COLLECTION = 'profiles'
  const USERS_COLLECTION = 'users'
  const LISTINGS_COLLECTION = 'listings'
  const ZONES_COLLECTION = 'zones'

  const batch = writeBatch(db)
  let profileCount = 0
  let listingCount = 0

  for (let index = 0; index < SAFE_MAX; index += 1) {
    const uid = seedUid(index)
    const displayName = seedDisplayName(index)
    const gender = pick(GENDERS)
    const role = pick(USER_ROLES)
    const minBudget = randInt(4000, 10000)
    const maxBudget = minBudget + randInt(2000, 9000)
    const zones: TukZone[] = pickUnique(TUK_ZONES, randInt(1, 3))
    const course = pick(COURSES)
    const yearOfStudy = randInt(1, 4)
    const smoking = Math.random() < 0.2
    const alcohol = Math.random() < 0.3
    const status = pick(PROFILE_STATUSES)

    const profile = {
      uid,
      displayName,
      photoURL: avatarUrl(displayName),
      role,
      gender,
      age: randInt(18, 25),
      school: 'Technical University of Kenya',
      courseYear: yearOfStudy,
      minBudget,
      maxBudget,
      zones,
      preferredRoomType: pick(HOUSING_POOL),
      lifestyle: {
        sleepTime: pick(SLEEP_TIMES),
        noiseTolerance: pick(NOISE_LEVELS),
        guestFrequency: pick(GUEST_FREQS),
        cleanlinessLevel: pick(CLEANLINESS),
        studyStyle: pick(STUDY_STYLES),
        smoking,
        alcohol,
      },
      dealBreakers: {
        noSmokingRequired: !smoking && Math.random() < 0.55,
        noAlcoholRequired: !alcohol && Math.random() < 0.4,
        mustHaveWiFi: Math.random() < 0.8,
        femaleOnly: gender === 'Female' && Math.random() < 0.2,
        maleOnly: gender === 'Male' && Math.random() < 0.15,
      },
      bio: `${course} student at TUK, Year ${yearOfStudy}. Looking for a compatible roomie in ${zones[0]}.`,
      moveInMonth: Math.random() < 0.8 ? randomMoveInMonth() : null,
      status,
      lastActive: serverTimestamp(),
      createdAt: serverTimestamp(),
    }

    batch.set(doc(db, USERS_COLLECTION, uid), {
      role,
      profileCompleted: true,
      updatedAt: serverTimestamp(),
    })

    batch.set(doc(db, PROFILES_COLLECTION, uid), profile)
    profileCount++

    if (role === 'HOST') {
      const housingType = pick(HOUSING_POOL)
      const rentTotal = randomRentTotal(housingType)
      const listingId = `listing-${uid}`
      const listing: Listing = {
        id: listingId,
        hostId: uid,
        zone: pick(zones),
        housingType,
        rentTotal,
        roommateShare: Math.floor(rentTotal / 2),
        amenities: pickUnique(LISTING_AMENITIES, randInt(3, 6)),
        photos: pickUnique(MOCK_INTERIOR_PHOTOS, randInt(3, 5)),
        houseRules: {
          smokingAllowed: Math.random() < 0.3,
          petsAllowed: Math.random() < 0.35,
          guestPolicy: pick(GUEST_POLICIES),
        },
        createdAt: new Date().toISOString(),
        status: pick(LISTING_STATUSES),
      }

      batch.set(doc(db, LISTINGS_COLLECTION, listingId), listing)
      listingCount++
    }
  }

  for (const zone of TUK_ZONES) {
    const zoneRef = doc(db, ZONES_COLLECTION, zone.toLowerCase().replace(/\s+/g, '-'))
    batch.set(zoneRef, { name: zone }, { merge: true })
  }

  await batch.commit()
  console.info(
    `✓ Seeded ${profileCount} profiles and ${listingCount} listings using client seeder.`
  )
}
