import {
  doc,
  collection,
  getDoc,
  setDoc,
  serverTimestamp,
  increment,
  updateDoc,
} from 'firebase/firestore'
import { toast } from 'react-hot-toast'
import { db } from './config'
import type { Like, Match } from '@/types'
import { getUserProfile } from '@/firebase/profiles'

const LIKES_COLLECTION = 'likes'
const MATCHES_COLLECTION = 'matches'

// ─── Like a profile ───────────────────────────────────────────────────────────
export async function likeProfile(
  fromUid: string,
  toUid: string,
  listingId?: string | null
): Promise<{ matched: boolean; matchId?: string }> {
  if (fromUid === toUid) return { matched: false }

  // Record the like. If it already exists, Firestore rules reject the implicit
  // update; treat that case as "already liked" and continue.
  const likeId = `${fromUid}_${toUid}`
  const likeRef = doc(db, LIKES_COLLECTION, likeId)
  let createdLike = false

  try {
    await setDoc(likeRef, {
      fromUid,
      toUid,
      createdAt: serverTimestamp(),
    } as Omit<Like, 'createdAt'> & { createdAt: ReturnType<typeof serverTimestamp> })
    createdLike = true
  } catch (error: any) {
    if (error?.code !== 'permission-denied') throw error

    try {
      const existingLike = await getDoc(likeRef)
      if (!existingLike.exists()) throw error
    } catch (readError) {
      console.error('Fallback getDoc likeRef failed:', readError);
      throw error; // Throw original
    }
  }

  if (createdLike && listingId) {
    try {
      await updateDoc(doc(db, 'listings', listingId), {
        interestCount: increment(1),
      })
    } catch (error) {
      console.error('Failed to update listing interest count:', error)
    }
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

  // --- Start Notification Grouping Injection ---
  if (!reverseExists && createdLike) {
    try {
      const fromUser = await getUserProfile(fromUid)
      const actorName = fromUser?.displayName || 'Someone'
      const notifRef = doc(collection(db, 'notifications'))
      
      await setDoc(notifRef, {
        recipientId: toUid,
        type: 'like',
        actorId: fromUid,
        latestActorName: actorName,
        title: 'New Like!',
        body: `${actorName} liked your profile. Tap to view and match!`,
        link: `/profile/${fromUid}`,
        createdAt: serverTimestamp(),
        isRead: false,
        priority: 'high'
      })
    } catch (err) {
      console.error('Failed to send like notification:', err)
    }
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

    try {
      await setDoc(
        doc(db, 'chats', matchId),
        {
          participants: [userA, userB],
          status: 'matched',
          lastMessage: '',
          unreadBy: [],
          updatedAt: serverTimestamp(),
        },
        { merge: true }
      )
    } catch (error) {
      console.error('Failed to initialize chat thread for match:', error)
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
