import { useEffect, useRef } from 'react'
import { collection, onSnapshot, query, where, orderBy } from 'firebase/firestore'
import { db } from '@/firebase/config'
import { useAuthStore } from '@/store/authStore'
import { toast } from 'react-hot-toast'
import { getUserProfile } from '@/firebase/profiles'
import { useNotificationStore } from '@/store/notificationStore'
import { subscribeToNotifications } from '@/firebase/notifications'
import { logger } from '@/utils/logger'

// BACKEND AUTHORITY: Notification CREATION is now owned by the backend (NotificationService).
// GlobalListeners only reacts to incoming Firestore changes (reads).
// It shows UI toasts for real-time awareness but no longer creates notification documents.

const isActiveChat = (data: { status?: string }) => data.status !== 'unmatched'

const GlobalListeners: React.FC = () => {
  const { currentUser } = useAuthStore()
  const {
    setUnreadMessages,
    setUnreadMatches,
    setNotifications,
  } = useNotificationStore()
  const unreadByMapRef = useRef<Record<string, boolean>>({})
  const chatsInitializedRef = useRef(false)
  const matchesInitializedRef = useRef(false)

  // ── Chat message listener ────────────────────────────────────────────────
  // Shows a toast when a new message arrives. The actual notification document
  // was already created by the backend's message handler (or will be in a future sprint).
  useEffect(() => {
    if (!currentUser) {
      unreadByMapRef.current = {}
      chatsInitializedRef.current = false
      setUnreadMessages(0)
      return
    }

    const q = query(
      collection(db, 'chats'),
      where('participants', 'array-contains', currentUser.uid),
      orderBy('updatedAt', 'desc')
    )

    const unsubscribe = onSnapshot(q, async (snapshot) => {
      const unreadCount = snapshot.docs.reduce((count, docSnap) => {
        const data = docSnap.data() as { unreadBy?: string[]; status?: string }
        if (!isActiveChat(data)) return count
        return data.unreadBy?.includes(currentUser.uid) ? count + 1 : count
      }, 0)
      setUnreadMessages(unreadCount)

      if (!chatsInitializedRef.current) {
        const initialState: Record<string, boolean> = {}
        snapshot.docs.forEach((docSnap) => {
          const data = docSnap.data() as { unreadBy?: string[]; status?: string }
          initialState[docSnap.id] =
            isActiveChat(data) && Boolean(data.unreadBy?.includes(currentUser.uid))
        })
        unreadByMapRef.current = initialState
        chatsInitializedRef.current = true
        return
      }

      for (const docChange of snapshot.docChanges()) {
        if (docChange.type === 'modified') {
          const chatData = docChange.doc.data() as { unreadBy?: string[]; status?: string; participants?: string[] }
          if (!isActiveChat(chatData)) {
            unreadByMapRef.current[docChange.doc.id] = false
            continue
          }
          const newUnreadBy: string[] = chatData.unreadBy ?? []
          const nowUnread = newUnreadBy.includes(currentUser.uid)
          const wasUnread = unreadByMapRef.current[docChange.doc.id] ?? false
          unreadByMapRef.current[docChange.doc.id] = nowUnread

          if (nowUnread && !wasUnread) {
            const participants = chatData.participants ?? []
            const otherUid = participants.find((id: string) => id !== currentUser.uid)

            if (otherUid) {
              try {
                const otherUser = await getUserProfile(otherUid)
                const senderName = otherUser?.displayName || 'Unknown'
                // Toast for real-time awareness — notification document created by backend
                toast.success(`New message from ${senderName}`, { icon: '💬' })
              } catch (error) {
                logger.error('Failed to get sender info:', error)
                toast('New message received', { icon: '💬' })
              }
            }
          }
        } else if (docChange.type === 'removed') {
          delete unreadByMapRef.current[docChange.doc.id]
        }
      }
    }, (error) => {
      logger.error('Listener permission error:', error)
    })

    return () => unsubscribe()
  }, [currentUser, setUnreadMessages])

  // ── Match listener ────────────────────────────────────────────────────────
  // Shows a toast when a new match appears. The match notification document was
  // already created by the backend MatchService (NotificationService).
  useEffect(() => {
    if (!currentUser) {
      matchesInitializedRef.current = false
      setUnreadMatches(0)
      return
    }

    const q = query(
      collection(db, 'matches'),
      where('participants', 'array-contains', currentUser.uid),
      where('status', '==', 'matched')
    )

    const unsubscribe = onSnapshot(q, async (snapshot) => {
      if (!matchesInitializedRef.current) {
        matchesInitializedRef.current = true
        return
      }

      let newMatchCount = 0
      for (const docChange of snapshot.docChanges()) {
        if (docChange.type === 'added') {
          newMatchCount += 1
          // Toast for real-time awareness — notification document created by MatchService
          toast.success('🎉 New Match!')
        }
      }

      if (newMatchCount > 0) {
        setUnreadMatches(useNotificationStore.getState().unreadMatches + newMatchCount)
      }
    }, (error) => {
      logger.error('Listener permission error:', error)
    })

    return () => unsubscribe()
  }, [currentUser, setUnreadMatches])

  // ── Notification bell listener ────────────────────────────────────────────
  useEffect(() => {
    if (!currentUser) {
      setNotifications([])
      return
    }

    const unsubscribe = subscribeToNotifications(
      currentUser.uid,
      (notifications) => {
        setNotifications(notifications)
      },
      (error) => {
        logger.error('Listener permission error:', error)
      }
    )

    return () => unsubscribe()
  }, [currentUser, setNotifications])

  return null
}

export default GlobalListeners
