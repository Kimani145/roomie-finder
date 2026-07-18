import {
  doc,
  collection,
  getDoc,
  setDoc,
  serverTimestamp,
  increment,
  updateDoc,
  runTransaction
} from 'firebase/firestore'
import { toast } from 'react-hot-toast'
import { db } from './config'
import type { Like, Match } from '@/types'
import { getUserProfile } from '@/firebase/profiles'
import { logger } from '@/utils/logger'

const LIKES_COLLECTION = 'likes'
const MATCHES_COLLECTION = 'matches'

export async function likeProfile(
  fromUid: string,
  toUid: string,
  listingId?: string | null
): Promise<{ matched: boolean; matchId?: string }> {
  if (fromUid === toUid) return { matched: false }

  const likeId = `${fromUid}_${toUid}`
  const likeRef = doc(db, LIKES_COLLECTION, likeId)
  const reverseLikeId = `${toUid}_${fromUid}`
  const reverseRef = doc(db, LIKES_COLLECTION, reverseLikeId)

  const [userA, userB] = [fromUid, toUid].sort()
  const matchId = `${userA}_${userB}`
  const matchRef = doc(db, MATCHES_COLLECTION, matchId)
  const chatRef = doc(db, 'chats', matchId)

  let createdLike = false
  let matched = false

  try {
    await runTransaction(db, async (transaction) => {
      // --- ALL READS ---
      const likeSnap = await transaction.get(likeRef)
      const reverseSnap = await transaction.get(reverseRef)
      const reverseExists = reverseSnap.exists()
      
      let matchSnap = null
      if (reverseExists) {
        matchSnap = await transaction.get(matchRef)
      }

      // --- ALL WRITES ---
      if (likeSnap.exists()) {
        createdLike = false
      } else {
        transaction.set(likeRef, {
          fromUid,
          toUid,
          createdAt: serverTimestamp(),
        } as Omit<Like, 'createdAt'> & { createdAt: ReturnType<typeof serverTimestamp> })
        createdLike = true
      }

      if (reverseExists) {
        if (matchSnap && !matchSnap.exists()) {
          transaction.set(matchRef, {
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
        }
        
        transaction.set(
          chatRef,
          {
            participants: [userA, userB],
            status: 'matched',
            lastMessage: '',
            unreadBy: [],
            updatedAt: serverTimestamp(),
          },
          { merge: true }
        )
        
        matched = true
      }
    })
  } catch (error: any) {
    if (error?.code === 'permission-denied') {
      logger.error('Permission denied in likeProfile transaction', error)
      return { matched: false }
    }
    logger.error('Failed likeProfile transaction:', error)
    throw error
  }

  if (createdLike && listingId) {
    try {
      await updateDoc(doc(db, 'listings', listingId), {
        interestCount: increment(1),
      })
    } catch (error) {
      logger.error('Failed to update listing interest count:', error)
    }
  }

  // --- Start Notification Grouping Injection ---
  if (!matched && createdLike) {
    try {
      const fromUser = await getUserProfile(fromUid)
      const actorName = fromUser?.displayName || 'Someone'
      const notifRef = doc(collection(db, 'notifications'))
      
      await setDoc(notifRef, {
        recipientId: toUid,
        type: 'like',
        senderId: fromUid,
        latestActorName: actorName,
        title: 'New Like!',
        body: `${actorName} liked your profile. Tap to view and match!`,
        link: `/profile/${fromUid}`,
        createdAt: serverTimestamp(),
        isRead: false,
        priority: 'high'
      })
    } catch (err) {
      logger.error('Failed to send like notification:', err)
    }
  }

  if (matched) {
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
