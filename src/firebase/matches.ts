import {
  collection,
  doc,
  getDoc,
  getDocs,
  query,
  where,
  setDoc,
  serverTimestamp,
} from 'firebase/firestore'
import { db } from './config'
import type { Like, Match } from '@/types'

const LIKES_COLLECTION = 'likes'
const MATCHES_COLLECTION = 'matches'

// ─── Like a profile ───────────────────────────────────────────────────────────
export async function likeProfile(
  fromUid: string,
  toUid: string
): Promise<{ matched: boolean; matchId?: string }> {
  // Record the like
  const likeId = `${fromUid}_${toUid}`
  await setDoc(doc(db, LIKES_COLLECTION, likeId), {
    fromUid,
    toUid,
    createdAt: serverTimestamp(),
  } as Omit<Like, 'createdAt'> & { createdAt: ReturnType<typeof serverTimestamp> })

  // Check if the other person already liked us (mutual match)
  const reverseLikeId = `${toUid}_${fromUid}`
  const reverseSnap = await getDoc(doc(db, LIKES_COLLECTION, reverseLikeId))

  if (reverseSnap.exists()) {
    // Create a match
    const matchId = [fromUid, toUid].sort().join('_')
    await setDoc(doc(db, MATCHES_COLLECTION, matchId), {
      id: matchId,
      participants: [fromUid, toUid],
      createdAt: serverTimestamp(),
      chatUnlocked: true,
    } as Omit<Match, 'id' | 'createdAt'> & {
      id: string
      createdAt: ReturnType<typeof serverTimestamp>
    })
    return { matched: true, matchId }
  }

  return { matched: false }
}

// ─── Get matches for a user ───────────────────────────────────────────────────
export async function getUserMatches(uid: string): Promise<Match[]> {
  const q = query(
    collection(db, MATCHES_COLLECTION),
    where('participants', 'array-contains', uid)
  )
  const snap = await getDocs(q)
  return snap.docs.map((d) => ({
    ...(d.data() as Match),
    id: d.id,
    createdAt: d.data().createdAt?.toDate(),
  }))
}

// ─── Check if already liked ───────────────────────────────────────────────────
export async function hasLiked(fromUid: string, toUid: string): Promise<boolean> {
  const ref = doc(db, LIKES_COLLECTION, `${fromUid}_${toUid}`)
  const snap = await getDoc(ref)
  return snap.exists()
}
