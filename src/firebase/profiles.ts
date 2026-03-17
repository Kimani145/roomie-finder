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

  return snapshot.docs
    .map((docRef) => toUserProfile(docRef.data(), docRef.id))
    .filter((candidate) => candidate.uid !== viewerUid)
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
