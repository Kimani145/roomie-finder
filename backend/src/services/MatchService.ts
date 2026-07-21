import { adminDb } from '../config/firebase'
import { FieldValue, Transaction } from 'firebase-admin/firestore'
import { EventBus } from '../events/EventBus'
import { Events } from '../events/EventCatalogue'
import { auditService } from './AuditService'
import { logger } from '../utils/logger'

// ─── Result Types ─────────────────────────────────────────────────────────────

export interface LikeResult {
  matched: boolean
  alreadyLiked?: boolean
  matchId?: string
  chatId?: string
}

// ─── Deterministic ID helpers ─────────────────────────────────────────────────

/** Returns a consistent, lexicographically ordered pair string for two UIDs */
function sortedPair(a: string, b: string): string {
  return [a, b].sort().join('_')
}

function matchId(uidA: string, uidB: string): string {
  return `match_${sortedPair(uidA, uidB)}`
}

function chatId(uidA: string, uidB: string): string {
  return `chat_${sortedPair(uidA, uidB)}`
}

/**
 * MatchService — owns the full Like → Match → Chat → Notification → Audit workflow.
 *
 * Every write is performed by the backend (Firebase Admin SDK).
 * The frontend never creates likes, matches, chats, or notifications.
 *
 * Transaction safety:
 *   - Single adminDb.runTransaction() covers like creation + match creation + chat creation.
 *   - Notifications are created AFTER the transaction commits (they do not need
 *     to be atomic with the match — they are idempotent and fire-and-forget).
 *   - Audit log is also written after commit for the same reason.
 *
 * Idempotency:
 *   - Like doc ID: likes/{fromUid}_{toUid}
 *   - Match doc ID: matches/match_{sorted(uidA, uidB)}
 *   - Chat doc ID: chats/chat_{sorted(uidA, uidB)}
 *   - Deterministic IDs prevent duplicates even if the endpoint is called twice.
 */
export class MatchService {
  async likeProfile(params: {
    fromUid: string
    toUid: string
    listingId?: string
    requestId?: string
    ip?: string
  }): Promise<LikeResult> {
    const { fromUid, toUid, listingId, requestId, ip } = params

    // ── Validation ──────────────────────────────────────────────────────────
    if (fromUid === toUid) {
      throw new Error('SELF_LIKE: Cannot like your own profile')
    }

    // ── Document refs ────────────────────────────────────────────────────────
    const likeRef = adminDb.collection('likes').doc(`${fromUid}_${toUid}`)
    const reverseLikeRef = adminDb.collection('likes').doc(`${toUid}_${fromUid}`)
    const matchRef = adminDb.collection('matches').doc(matchId(fromUid, toUid))
    const chatRef = adminDb.collection('chats').doc(chatId(fromUid, toUid))

    const computedMatchId = matchId(fromUid, toUid)
    const computedChatId = chatId(fromUid, toUid)

    let result: LikeResult

    try {
      result = await adminDb.runTransaction(async (tx: Transaction) => {
        // 1. Read current state
        const [likeSnap, reverseLikeSnap, matchSnap] = await Promise.all([
          tx.get(likeRef),
          tx.get(reverseLikeRef),
          tx.get(matchRef),
        ])

        // 2. Idempotency check — already liked
        if (likeSnap.exists) {
          logger.info({ msg: 'MatchService: duplicate like ignored', fromUid, toUid, requestId })
          if (matchSnap.exists) {
            return { matched: true, alreadyLiked: true, matchId: computedMatchId, chatId: computedChatId }
          }
          return { matched: false, alreadyLiked: true }
        }

        // 3. Create the Like document
        tx.create(likeRef, {
          fromUid,
          toUid,
          listingId: listingId ?? null,
          createdAt: FieldValue.serverTimestamp(),
        })

        // 4. Check for mutual like
        if (!reverseLikeSnap.exists) {
          // No reverse like — pending state
          return { matched: false }
        }

        // 5. Mutual like detected → create Match + Chat atomically
        if (!matchSnap.exists) {
          const participants = [fromUid, toUid].sort() as [string, string]

          tx.create(matchRef, {
            userA: participants[0],
            userB: participants[1],
            participants,
            status: 'matched',
            chatUnlocked: true,
            compatibilityVersion: 1,
            createdAt: FieldValue.serverTimestamp(),
          })

          // Create or merge the chat document
          tx.set(chatRef, {
            matchId: computedMatchId,
            participants,
            createdAt: FieldValue.serverTimestamp(),
            lastMessage: null,
            lastMessageAt: null,
          }, { merge: true })
        }

        return { matched: true, matchId: computedMatchId, chatId: computedChatId }
      })
    } catch (error: any) {
      logger.error({
        msg: 'MatchService: transaction failed',
        fromUid,
        toUid,
        error: error?.message,
        code: error?.code,
        requestId,
      })
      throw error
    }

    // ── Post-commit side effects (fire-and-forget) ────────────────────────────
    // These run after the transaction succeeds. They are intentionally outside the
    // transaction so a notification failure doesn't roll back the match.

    this._postCommitEffects(result, fromUid, toUid, listingId, requestId, ip).catch((err) => {
      logger.error({ msg: 'MatchService: post-commit side effects failed', err, fromUid, toUid })
    })

    return result
  }

  private async _postCommitEffects(
    result: LikeResult,
    fromUid: string,
    toUid: string,
    listingId?: string,
    requestId?: string,
    ip?: string,
  ): Promise<void> {
    if (result.alreadyLiked) return

    if (result.matched && result.matchId) {
      // Fetch display names for notification bodies (best-effort)
      let fromName = 'Someone'
      let toName = 'Someone'
      try {
        const [fromSnap, toSnap] = await Promise.all([
          adminDb.collection('users').doc(fromUid).get(),
          adminDb.collection('users').doc(toUid).get(),
        ])
        fromName = fromSnap.data()?.displayName ?? 'Someone'
        toName = toSnap.data()?.displayName ?? 'Someone'
      } catch {
        // Non-fatal — use generic names
      }

      EventBus.publish(Events.MATCH_CREATED, {
        matchId: result.matchId,
        userA: fromUid,
        userB: toUid,
      })

      await auditService.log({
        action: 'match_created',
        actorUid: fromUid,
        targetUid: toUid,
        details: { matchId: result.matchId, chatId: result.chatId, listingId },
        requestId,
        ip,
        status: 'success',
      })
    } else {
      await auditService.log({
        action: 'like',
        actorUid: fromUid,
        targetUid: toUid,
        details: { listingId },
        requestId,
        ip,
        status: 'success',
      })
      EventBus.publish(Events.PROFILE_LIKED, { fromUid, toUid })
    }

    // Increment listing interest count (best-effort — never fails the like)
    if (listingId) {
      adminDb.collection('listings').doc(listingId).update({
        interestCount: FieldValue.increment(1),
      }).catch((err) => {
        logger.warn({ msg: 'MatchService: Failed to increment interestCount', listingId, err })
      })
    }
  }
}

export const matchService = new MatchService()
