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
  orderBy,
  limit,
} from 'firebase/firestore'
import { db } from './config'
import type { UserProfile, Zone } from '@/types'

const PROFILES_COLLECTION = 'profiles'

// ─── Fetch candidates (Hard Filters applied server-side) ──────────────────────
export async function fetchCandidatesByZone(
  zone: Zone,
  limitCount = 200
): Promise<UserProfile[]> {
  const q = query(
    collection(db, PROFILES_COLLECTION),
    where('zone', '==', zone),
    where('status', '==', 'active'),
    orderBy('lastActive', 'desc'),
    limit(limitCount)
  )

  const snapshot = await getDocs(q)
  return snapshot.docs.map((doc) => ({
    ...(doc.data() as UserProfile),
    uid: doc.id,
    lastActive: doc.data().lastActive?.toDate(),
    createdAt: doc.data().createdAt?.toDate(),
  }))
}

// ─── Get single profile ───────────────────────────────────────────────────────
export async function getUserProfile(uid: string): Promise<UserProfile | null> {
  const ref = doc(db, PROFILES_COLLECTION, uid)
  const snap = await getDoc(ref)
  if (!snap.exists()) return null
  const data = snap.data()
  return {
    ...(data as UserProfile),
    uid: snap.id,
    lastActive: data.lastActive?.toDate(),
    createdAt: data.createdAt?.toDate(),
  }
}

// ─── Create / Update profile ──────────────────────────────────────────────────
export async function saveUserProfile(
  uid: string,
  profile: Omit<UserProfile, 'uid' | 'createdAt' | 'lastActive'>
): Promise<void> {
  const ref = doc(db, PROFILES_COLLECTION, uid)
  await setDoc(
    ref,
    {
      ...profile,
      lastActive: serverTimestamp(),
      createdAt: serverTimestamp(),
    },
    { merge: true }
  )
}

// ─── Update last active ───────────────────────────────────────────────────────
export async function updateLastActive(uid: string): Promise<void> {
  const ref = doc(db, PROFILES_COLLECTION, uid)
  await updateDoc(ref, { lastActive: serverTimestamp() })
}
