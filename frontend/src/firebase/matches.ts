/**
 * matches.ts — Frontend match interactions.
 *
 * BACKEND AUTHORITY: All write operations (like, match, chat, notification creation)
 * are performed exclusively by the backend via the Admin SDK.
 *
 * The frontend:
 *   - Calls POST /api/v1/matches/like via likeProfile()
 *   - Reads like status via hasLiked() (read-only Firestore access)
 *   - Receives matches and chats reactively via Firestore onSnapshot
 *
 * DO NOT add any Firestore write operations to this file.
 */
import { doc, getDoc } from 'firebase/firestore'
import { db } from './config'
import { fetchWithAuth } from '@/services/apiClient'
import { logger } from '@/utils/logger'

const LIKES_COLLECTION = 'likes'

// ─── Types ───────────────────────────────────────────────────────────────────

export interface LikeApiResult {
  matched: boolean
  alreadyLiked?: boolean
  matchId?: string
  chatId?: string
}

// ─── Like Profile (via Backend API) ──────────────────────────────────────────

/**
 * Send a like to a profile.
 *
 * Delegates to POST /api/v1/matches/like — the backend atomically creates
 * the Like document, and if mutual: the Match, Chat, and Notifications.
 *
 * @throws Error with a user-friendly message on failure.
 */
export async function likeProfile(
  fromUid: string,
  toUid: string,
  listingId?: string | null
): Promise<LikeApiResult> {
  if (fromUid === toUid) {
    logger.warn('[matches] Attempted self-like, ignoring')
    return { matched: false }
  }

  try {
    const response = await fetchWithAuth('/api/v1/matches/like', {
      method: 'POST',
      body: JSON.stringify({
        targetUid: toUid,
        ...(listingId ? { listingId } : {}),
      }),
    })

    return response as LikeApiResult
  } catch (error: any) {
    // 409 Conflict = already liked — not a hard error
    if (error?.message?.includes('Already liked') || error?.status === 409) {
      logger.info('[matches] Already liked this profile')
      return { matched: false, alreadyLiked: true }
    }

    logger.error('[matches] likeProfile API call failed', error)
    throw error
  }
}

// ─── Check if already liked (read-only) ──────────────────────────────────────

/**
 * Check if fromUid has already liked toUid.
 * Read-only Firestore access — safe to call from frontend.
 */
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
