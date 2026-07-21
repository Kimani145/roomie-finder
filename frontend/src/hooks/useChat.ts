import { useEffect, useState } from 'react'
import {
  collection,
  onSnapshot,
  query,
  where,
} from 'firebase/firestore'
import { db } from '@/firebase/config'
import type { LocalMessage, MessageStatus } from '@/types'
import { fetchWithAuth } from '@/services/apiClient'


export const getChatParticipants = (chatId: string): string[] =>
  chatId.split('_').filter(Boolean)

const isActiveChat = (data: { status?: string }) => data.status !== 'unmatched'

export const getOtherParticipantUid = (
  chatId: string,
  currentUserUid: string
): string | undefined => getChatParticipants(chatId).find((id) => id !== currentUserUid)

// Legacy sendChatMessage for backward compatibility
export const sendChatMessage = async (params: {
  chatId: string
  currentUserUid: string
  text: string
}) => {
  const trimmed = params.text.trim()
  if (!trimmed) return

  await fetchWithAuth(`/api/v1/chats/${params.chatId}/messages`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ text: trimmed }),
  })
}

// Enhanced sendChatMessageWithOptimism: returns a LocalMessage for immediate UI feedback
export const sendChatMessageWithOptimism = async (params: {
  chatId: string
  currentUserUid: string
  text: string
  tempId: string
  onOptimisticMessage?: (msg: LocalMessage) => void
}): Promise<{ success: boolean; serverMessageId?: string; error?: string }> => {
  const trimmed = params.text.trim()
  if (!trimmed) return { success: false, error: 'Empty message' }

  // Return optimistic message immediately for UI feedback
  if (params.onOptimisticMessage) {
    params.onOptimisticMessage({
      id: params.tempId,
      tempId: params.tempId,
      matchId: params.chatId,
      senderUid: params.currentUserUid,
      text: trimmed,
      createdAt: new Date(),
      read: false,
      status: 'LOCAL_PENDING' as MessageStatus,
    })
  }

  try {
    const res = await fetchWithAuth(`/api/v1/chats/${params.chatId}/messages`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-idempotency-key': params.tempId, // Ensure idempotency for retries
      },
      body: JSON.stringify({ text: trimmed }),
    })

    const data = await res.json()

    if (!res.ok) {
      return { success: false, error: data.error || 'Failed to send message' }
    }

    return { success: true, serverMessageId: data.messageId }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    return { success: false, error: errorMessage }
  }
}

// Retry a failed message
export const retryFailedMessage = async (params: {
  chatId: string
  currentUserUid: string
  text: string
  tempId: string
}): Promise<{ success: boolean; serverMessageId?: string; error?: string }> => {
  return sendChatMessageWithOptimism({
    ...params,
    onOptimisticMessage: undefined, // Don't re-show optimistic on retry
  })
}

export const markChatAsRead = async (chatId: string) => {
  await fetchWithAuth(`/api/v1/chats/${chatId}/read`, {
    method: 'POST',
  }).catch(() => {
    // Silently ignore errors here to avoid interrupting UI, backend handles it
  })
}

export const useUnreadChatCount = (uid?: string | null) => {
  const [unreadCount, setUnreadCount] = useState(0)

  useEffect(() => {
    if (!uid) {
      setUnreadCount(0)
      return
    }

    const q = query(
      collection(db, 'chats'),
      where('participants', 'array-contains', uid)
    )

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const count = snapshot.docs.reduce((acc, docSnap) => {
        const data = docSnap.data() as { unreadBy?: string[]; status?: string }
        if (!isActiveChat(data)) return acc
        return data.unreadBy?.includes(uid) ? acc + 1 : acc
      }, 0)

      setUnreadCount(count)
    })

    return () => unsubscribe()
  }, [uid])

  return unreadCount
}
