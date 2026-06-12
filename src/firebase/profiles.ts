import {
  collection,
  doc,
  getDoc,
  getDocs,
  query,
  where,
  setDoc,
  updateDoc,
  serverTimestamp,
  QueryConstraint,
  limit,
} from 'firebase/firestore'
import { db } from './config'
import type { DiscoveryFilters, UserProfile, Zone } from '@/types'

const PROFILES_COLLECTION = 'profiles'
const USERS_COLLECTION = 'users'

export interface DiscoveryQueryParams {
  viewerUid: string
  viewerZones?: Zone[]
  filters: DiscoveryFilters
  limitCount?: number
}

function toUserProfile(data: any, id: string): UserProfile {
  return {
    ...(data as UserProfile),
    uid: id,
    role: data.role ?? 'FLEX',
    lastActive: data.lastActive?.toDate?.() ?? new Date(),
    createdAt: data.createdAt?.toDate?.() ?? new Date(),
  }
}

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

const GENDERS = ['Male', 'Female', 'Non-binary']
const USER_ROLES = ['HOST', 'SEEKER', 'FLEX']
const HOUSING_TYPES = [
  'Single Room',
  'Bedsitter',
  'Studio',
  'Double Room',
  '1 Bedroom',
  '2 Bedroom',
  '3 Bedroom',
]
const COURSES = [
  'BSc Information Science',
  'BSc Computer Science',
  'BSc Electrical Engineering',
  'BSc Civil Engineering',
  'BA Business Administration',
  'BSc Applied Physics',
  'BSc Mechanical Engineering',
  'Diploma in ICT',
]
const SLEEP_TIMES = ['Early', 'Late', 'Flexible']
const NOISE_LEVELS = ['Low', 'Medium', 'High']
const GUEST_FREQS = ['Rare', 'Sometimes', 'Often']
const CLEANLINESS_LEVELS = ['Relaxed', 'Moderate', 'Strict']
const STUDY_STYLES = ['Silent', 'Background noise ok']

const FIRST_NAMES = [
  'Brian', 'Amina', 'Kevin', 'Grace', 'Dennis', 'Faith', 'Elijah', 'Ivy', 'Farouk', 'Tiffany',
  'George', 'Yvonne', 'Harrison', 'Hannah', 'Ian', 'Mary', 'James', 'Olivia', 'Kelvin', 'Sharon',
  'Leonard', 'Ruth', 'Newton', 'Diana', 'Oscar', 'Janet', 'Patrick', 'Linda', 'Ronald', 'Priscilla',
  'Samuel', 'Nancy', 'Victor', 'Ursula', 'Wilfred', 'Zipporah'
]

const LAST_NAMES = [
  'Otieno', 'Mwangi', 'Kamau', 'Waweru', 'Hassan', 'Kimani', 'Odhiambo', 'Njuguna', 'Cheruiyot',
  'Mutua', 'Wekesa', 'Njoroge', 'Omondi', 'Kiprotich', 'Gitau', 'Barasa', 'Achieng', 'Muthoni',
  'Chelangat', 'Akinyi', 'Njeri', 'Wairimu', 'Kemunto', 'Moraa', 'Nekesa', 'Atieno', 'Wambui',
  'Cherono', 'Mumbi', 'Adhiambo'
]

const MALE_PORTRAITS = [
  'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?auto=format&fit=crop&w=256&h=256&q=80',
  'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=256&h=256&q=80',
  'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=256&h=256&q=80',
  'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?auto=format&fit=crop&w=256&h=256&q=80',
  'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&w=256&h=256&q=80',
  'https://images.unsplash.com/photo-1492562080023-ab3db95bfbce?auto=format&fit=crop&w=256&h=256&q=80',
  'https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?auto=format&fit=crop&w=256&h=256&q=80',
  'https://images.unsplash.com/photo-1501196354995-cbb51c65aaea?auto=format&fit=crop&w=256&h=256&q=80'
]

const FEMALE_PORTRAITS = [
  'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=256&h=256&q=80',
  'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?auto=format&fit=crop&w=256&h=256&q=80',
  'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=256&h=256&q=80',
  'https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=256&h=256&q=80',
  'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=256&h=256&q=80',
  'https://images.unsplash.com/photo-1488426862026-3ee34a7d66df?auto=format&fit=crop&w=256&h=256&q=80',
  'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?auto=format&fit=crop&w=256&h=256&q=80',
  'https://images.unsplash.com/photo-1508214751196-bcfd4ca60f91?auto=format&fit=crop&w=256&h=256&q=80'
]

const MALE_BIOS = [
  "Final year TUK student looking for a clean, study-focused roommate. I mostly code or play video games on weekends.",
  "Very clean and organized. Looking for someone quiet to share a bedsitter or single room near Roysambu.",
  "Outgoing student. Love football, music, and occasional gaming. Cleanliness is important to me.",
  "Early bird and study-focused. Looking for a neat space with stable WiFi and water supply."
]

const FEMALE_BIOS = [
  "TUK Information Science major. Clean, respects boundaries, and values a quiet study environment.",
  "Looking for a friendly female roommate to share a neat 1-bedroom. I enjoy cooking and quiet evenings.",
  "Organized and friendly. I study most of the day and prefer a clean, peaceful space to relax afterward.",
  "Very tidy and quiet student. Searching for a roommate who respects privacy and values hygiene."
]

const OTHER_BIOS = [
  "Looking for a roommate who is clean, respectful, and communicates well. Easygoing and focused on studies."
]

export function generateDeterministicProfile(uid: string): UserProfile {
  const numId = parseInt(uid.replace('seed-user-', ''), 10) || 1
  let seed = numId
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

  const displayName = `${FIRST_NAMES[numId % FIRST_NAMES.length]} ${LAST_NAMES[(numId * 7) % LAST_NAMES.length]}`
  const gender = pick(GENDERS)
  const role = pick(USER_ROLES)
  const minBudget = randInt(4, 10) * 1000
  const maxBudget = minBudget + randInt(2, 9) * 1000
  const zones = pickUnique(TUK_ZONES, randInt(1, 3))
  const smoking = rand() < 0.2
  const alcohol = rand() < 0.35
  const status = 'active'
  const course = pick(COURSES)
  const courseYear = randInt(1, 4)

  const photoURL = gender === 'Male' 
    ? MALE_PORTRAITS[numId % MALE_PORTRAITS.length]
    : gender === 'Female'
      ? FEMALE_PORTRAITS[numId % FEMALE_PORTRAITS.length]
      : `https://ui-avatars.com/api/?name=${encodeURIComponent(displayName)}&background=3b82f6&color=fff&size=256&bold=true`

  const bio = gender === 'Male'
    ? MALE_BIOS[numId % MALE_BIOS.length] + ` Course: ${course}. Preferred zone: ${zones[0]}.`
    : gender === 'Female'
      ? FEMALE_BIOS[numId % FEMALE_BIOS.length] + ` Course: ${course}. Preferred zone: ${zones[0]}.`
      : OTHER_BIOS[0] + ` Course: ${course}. Preferred zone: ${zones[0]}.`

  return {
    uid,
    displayName,
    photoURL,
    role: role as any,
    gender: gender as any,
    age: randInt(18, 25),
    school: 'Technical University of Kenya',
    courseYear,
    minBudget,
    maxBudget,
    zones: zones as any,
    preferredRoomType: pick(HOUSING_TYPES) as any,
    lifestyle: {
      sleepTime: pick(SLEEP_TIMES) as any,
      noiseTolerance: pick(NOISE_LEVELS) as any,
      guestFrequency: pick(GUEST_FREQS) as any,
      cleanlinessLevel: pick(CLEANLINESS_LEVELS) as any,
      studyStyle: pick(STUDY_STYLES) as any,
      smoking,
      alcohol,
    },
    dealBreakers: {
      noSmokingRequired: !smoking && rand() < 0.6,
      noAlcoholRequired: !alcohol && rand() < 0.45,
      mustHaveWiFi: rand() < 0.8,
      femaleOnly: gender === 'Female' && rand() < 0.2,
      maleOnly: gender === 'Male' && rand() < 0.15,
    },
    status: status as any,
    lastActive: new Date(),
    createdAt: new Date(),
    bio,
    moveInMonth: rand() < 0.8 ? `2026-${String(randInt(1, 12)).padStart(2, '0')}` : null,
  }
}

export function getDeterministicSeedProfiles(): UserProfile[] {
  const list: UserProfile[] = []
  for (let i = 1; i <= 100; i++) {
    list.push(generateDeterministicProfile(`seed-user-${String(i).padStart(3, '0')}`))
  }
  return list
}

export async function fetchDiscoveryCandidates({
  viewerUid,
  viewerZones = [],
  filters,
  limitCount = 200,
}: DiscoveryQueryParams): Promise<UserProfile[]> {
  const constraints: QueryConstraint[] = [
    where('status', '==', 'active'),
    limit(limitCount),
  ]

  const effectiveZones = filters.zones?.length ? filters.zones : viewerZones
  if (effectiveZones.length === 1) {
    constraints.push(where('zones', 'array-contains', effectiveZones[0]))
  } else if (effectiveZones.length > 1) {
    constraints.push(where('zones', 'array-contains-any', effectiveZones.slice(0, 10)))
  }

  if (filters.gender) {
    constraints.push(where('gender', '==', filters.gender))
  }

  if (filters.minBudget !== null) {
    constraints.push(where('maxBudget', '>=', filters.minBudget))
  }

  if (filters.maxBudget !== null) {
    constraints.push(where('minBudget', '<=', filters.maxBudget))
  }

  if (filters.courseYear !== null) {
    constraints.push(where('courseYear', '==', filters.courseYear))
  }

  if (filters.moveInMonth) {
    constraints.push(where('moveInMonth', '==', filters.moveInMonth))
  }

  const q = query(collection(db, PROFILES_COLLECTION), ...constraints)
  const snapshot = await getDocs(q)

  const dbCandidates = snapshot.docs
    .map((docRef) => toUserProfile(docRef.data(), docRef.id))
    .filter((candidate) => candidate.uid !== viewerUid)

  const dbUids = new Set(dbCandidates.map(c => c.uid))
  
  // Apply the same filters in JS to the 100 mock profiles
  const allMockProfiles = getDeterministicSeedProfiles()
  const filteredMocks = allMockProfiles.filter((mock) => {
    if (mock.uid === viewerUid) return false
    if (dbUids.has(mock.uid)) return false
    
    if (effectiveZones.length > 0) {
      const hasMatchingZone = mock.zones.some(z => effectiveZones.includes(z))
      if (!hasMatchingZone) return false
    }
    
    if (filters.gender && mock.gender !== filters.gender) return false
    if (filters.minBudget !== null && mock.maxBudget < filters.minBudget) return false
    if (filters.maxBudget !== null && mock.minBudget > filters.maxBudget) return false
    if (filters.courseYear !== null && mock.courseYear !== filters.courseYear) return false
    if (filters.moveInMonth && mock.moveInMonth !== filters.moveInMonth) return false
    
    return true
  })

  return [...dbCandidates, ...filteredMocks]
}

// ─── Fetch candidates (Hard Filters applied server-side) ──────────────────────
export async function fetchCandidatesByZone(
  zone: Zone,
  excludeUid?: string,
  limitCount = 200
): Promise<UserProfile[]> {
  return fetchDiscoveryCandidates({
    viewerUid: excludeUid ?? '',
    viewerZones: [zone],
    filters: {
      zones: [zone],
      gender: null,
      minBudget: null,
      maxBudget: null,
      courseYear: null,
      moveInMonth: null,
      sleepTime: null,
      cleanlinessLevel: null,
      noiseTolerance: null,
      guestFrequency: null,
      hideDealBreakerConflicts: true,
      noSmokingRequired: false,
      noAlcoholRequired: false,
    },
    limitCount,
  })
}

// ─── Get single profile ───────────────────────────────────────────────────────
export async function getUserProfile(uid: string): Promise<UserProfile | null> {
  if (uid.startsWith('seed-user-')) {
    return generateDeterministicProfile(uid)
  }
  try {
    const ref = doc(db, PROFILES_COLLECTION, uid)
    const snap = await getDoc(ref)
    if (snap.exists()) return toUserProfile(snap.data(), snap.id)
  } catch (error: any) {
    const code = error?.code as string | undefined
    if (code === 'permission-denied' || code === 'failed-precondition') {
      console.warn('[getUserProfile] Profile read blocked by rules:', uid)
      return null
    }
    throw error
  }

  return null
}

// ─── Create / Update profile ──────────────────────────────────────────────────
export async function saveUserProfile(
  uid: string,
  profile: Omit<UserProfile, 'uid' | 'createdAt' | 'lastActive'>
): Promise<void> {
  const profileRef = doc(db, PROFILES_COLLECTION, uid)
  const userRef = doc(db, USERS_COLLECTION, uid)

  const payload = {
    ...profile,
    lastActive: serverTimestamp(),
    createdAt: serverTimestamp(),
  }

  await setDoc(profileRef, payload, { merge: true })

  await setDoc(
    userRef,
    {
      role: profile.role,
      profileCompleted: true,
      updatedAt: serverTimestamp(),
    },
    { merge: true }
  )
}

// ─── Update last active ───────────────────────────────────────────────────────
export async function updateLastActive(uid: string): Promise<void> {
  const ref = doc(db, PROFILES_COLLECTION, uid)
  await updateDoc(ref, { lastActive: serverTimestamp() })
}
