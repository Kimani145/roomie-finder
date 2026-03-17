import {
  doc,
  getDoc,
  setDoc,
  serverTimestamp,
} from 'firebase/firestore'
import { toast } from 'react-hot-toast'
import { db } from './config'
import type { Like, Match } from '@/types'

const LIKES_COLLECTION = 'likes'
const MATCHES_COLLECTION = 'matches'

// ─── Like a profile ───────────────────────────────────────────────────────────
export async function likeProfile(
  fromUid: string,
  toUid: string
): Promise<{ matched: boolean; matchId?: string }> {
  if (fromUid === toUid) return { matched: false }

  // Record the like. If it already exists, Firestore rules reject the implicit
  // update; treat that case as "already liked" and continue.
  const likeId = `${fromUid}_${toUid}`
  const likeRef = doc(db, LIKES_COLLECTION, likeId)

  try {
    await setDoc(likeRef, {
      fromUid,
      toUid,
      createdAt: serverTimestamp(),
    } as Omit<Like, 'createdAt'> & { createdAt: ReturnType<typeof serverTimestamp> })
  } catch (error: any) {
    if (error?.code !== 'permission-denied') throw error

    // Under immutable-like rules, an existing doc throws permission-denied.
    // Confirm existence before suppressing.
    const existingLike = await getDoc(likeRef)
    if (!existingLike.exists()) throw error
  }

  // Check if the other person already liked us (mutual match)
  const reverseLikeId = `${toUid}_${fromUid}`
  const reverseRef = doc(db, LIKES_COLLECTION, reverseLikeId)
  let reverseExists = false

  try {
    const reverseSnap = await getDoc(reverseRef)
    reverseExists = reverseSnap.exists()
  } catch (error: any) {
    if (error?.code !== 'permission-denied') throw error
    // Current rules can deny reads on missing docs; treat this as "no reverse like".
    reverseExists = false
  }

  if (reverseExists) {
    const [userA, userB] = [fromUid, toUid].sort()
    const matchId = `${userA}_${userB}`
    const matchRef = doc(db, MATCHES_COLLECTION, matchId)

    try {
      await setDoc(matchRef, {
        id: matchId,
        userA,
        userB,
        participants: [userA, userB],
        status: 'matched',
        compatibilityVersion: 1,
        createdAt: serverTimestamp(),
        chatUnlocked: true,
      } as Omit<Match, 'id' | 'createdAt'> & {
        id: string
        createdAt: ReturnType<typeof serverTimestamp>
      })
    } catch (error: any) {
      if (error?.code !== 'permission-denied') throw error

      // Existing immutable match docs reject updates; allow if doc already exists.
      const existingMatch = await getDoc(matchRef)
      if (!existingMatch.exists()) throw error
    }

    toast.success('🎉 You have a new match!')
    return { matched: true, matchId }
  }

  return { matched: false }
}

// ─── Check if already liked ───────────────────────────────────────────────────
export async function hasLiked(fromUid: string, toUid: string): Promise<boolean> {
  const ref = doc(db, LIKES_COLLECTION, `${fromUid}_${toUid}`)
  try {
    const snap = await getDoc(ref)
    return snap.exists()
  } catch (error: any) {
    if (error?.code === 'permission-denied' || error?.code === 'not-found') {
      return false
    }
    throw error
  }
}
