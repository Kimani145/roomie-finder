import { useEffect, useState } from 'react'
import {
  addDoc,
  arrayRemove,
  collection,
  doc,
  getDoc,
  onSnapshot,
  query,
  serverTimestamp,
  setDoc,
  updateDoc,
  where,
} from 'firebase/firestore'
import { db } from '@/firebase/config'

export const getChatParticipants = (chatId: string): string[] =>
  chatId.split('_').filter(Boolean)

const isActiveChat = (data: { status?: string }) => data.status !== 'unmatched'

export const getOtherParticipantUid = (
  chatId: string,
  currentUserUid: string
): string | undefined => getChatParticipants(chatId).find((id) => id !== currentUserUid)

export const sendChatMessage = async (params: {
  chatId: string
  currentUserUid: string
  text: string
}) => {
  const trimmed = params.text.trim()
  if (!trimmed) return

  const participants = getChatParticipants(params.chatId)
  const recipientUid = participants.find((id) => id !== params.currentUserUid)
  const chatRef = doc(db, 'chats', params.chatId)
  const existingChatSnap = await getDoc(chatRef)
  const existingChat = existingChatSnap.data() as { status?: string } | undefined

  if (existingChat?.status === 'unmatched') {
    throw new Error('chat-unmatched')
  }

  await setDoc(
    chatRef,
    {
      status: existingChat?.status ?? 'matched',
      participants,
      lastMessage: trimmed,
      updatedAt: serverTimestamp(),
      lastMessageTime: serverTimestamp(),
      unreadBy: recipientUid ? [recipientUid] : [],
    },
    { merge: true }
  )

  await addDoc(collection(db, 'chats', params.chatId, 'messages'), {
    senderUid: params.currentUserUid,
    text: trimmed,
    createdAt: serverTimestamp(),
  })
}

export const markChatAsRead = async (chatId: string, currentUserUid: string) => {
  await updateDoc(doc(db, 'chats', chatId), {
    unreadBy: arrayRemove(currentUserUid),
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
