import { useEffect, useRef } from 'react'
import { collection, onSnapshot, query, where, orderBy } from 'firebase/firestore'
import { db } from '@/firebase/config'
import { useAuthStore } from '@/store/authStore'
import { toast } from 'react-hot-toast'
import { getUserProfile } from '@/firebase/profiles'
import { useNotificationStore } from '@/store/notificationStore'

const isActiveChat = (data: { status?: string }) => data.status !== 'unmatched'

const GlobalListeners: React.FC = () => {
  const { currentUser } = useAuthStore()
  const {
    setUnreadMessages,
    setUnreadMatches,
    pushNotification,
  } = useNotificationStore()
  const unreadByMapRef = useRef<Record<string, boolean>>({})
  const chatsInitializedRef = useRef(false)
  const matchesInitializedRef = useRef(false)

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
                toast(`New message from ${senderName}`, { icon: '💬' })
                pushNotification({
                  id: `message-${docChange.doc.id}-${Date.now()}`,
                  type: 'message',
                  title: `New message from ${senderName}`,
                  actionPath: `/chat/${docChange.doc.id}`,
                  createdAt: Date.now(),
                })
              } catch (error) {
                console.error('Failed to get sender info:', error)
                toast('New message received', { icon: '💬' })
              }
            }
          }
        } else if (docChange.type === 'removed') {
          delete unreadByMapRef.current[docChange.doc.id]
        }
      }
    }, (error) => {
      console.error('Failed to listen to chats:', error)
    })

    return () => unsubscribe()
  }, [currentUser, pushNotification, setUnreadMessages])

  useEffect(() => {
    if (!currentUser) {
      matchesInitializedRef.current = false
      setUnreadMatches(0)
      return
    }

    const q = query(
      collection(db, 'matches'),
      where('recipientId', '==', currentUser.uid)
    )

    const unsubscribe = onSnapshot(q, (snapshot) => {
      if (!matchesInitializedRef.current) {
        matchesInitializedRef.current = true
        return
      }

      let newMatchCount = 0
      for (const docChange of snapshot.docChanges()) {
        if (docChange.type === 'added') {
          newMatchCount += 1
          toast.success('🎉 New Match!')
          pushNotification({
            id: `match-${docChange.doc.id}-${Date.now()}`,
            type: 'match',
            title: '🎉 New Match!',
            actionPath: '/matches',
            createdAt: Date.now(),
          })
        }
      }

      if (newMatchCount > 0) {
        setUnreadMatches(useNotificationStore.getState().unreadMatches + newMatchCount)
      }
    }, (error) => {
      console.error('Failed to listen to matches:', error)
    })

    return () => unsubscribe()
  }, [currentUser, pushNotification, setUnreadMatches])

  return null
}

export default GlobalListeners
