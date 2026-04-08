import { useEffect, useRef } from 'react'
import { collection, onSnapshot, query, where, orderBy } from 'firebase/firestore'
import { db } from '@/firebase/config'
import { useAuthStore } from '@/store/authStore'
import { toast } from 'react-hot-toast'
import { getUserProfile } from '@/firebase/profiles'
import { useNotificationStore } from '@/store/notificationStore'
import { createNotification, subscribeToNotifications } from '@/firebase/notifications'

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
                // Only trigger active screen popups for Medium and High priority events.
                // Low priority events (like passive profile likes) should only silently increment the Notification Bell counter.
                toast.success(`New message from ${senderName}`, { icon: '💬' })
                await createNotification({
                  recipientId: currentUser.uid,
                  type: 'message',
                  title: 'New message',
                  body: `${senderName} sent you a new message.`,
                  link: `/chat/${docChange.doc.id}`,
                })
              } catch (error) {
                console.error('Failed to get sender info:', error)
                // Only trigger active screen popups for Medium and High priority events.
                // Only trigger active screen popups for Medium and High priority events.
                toast('New message received', { icon: '💬' })
              }
            }
          }
        } else if (docChange.type === 'removed') {
          delete unreadByMapRef.current[docChange.doc.id]
        }
      }
    }, (error) => {
      console.error('Listener permission error:', error)
    })

    return () => unsubscribe()
  }, [currentUser, setUnreadMessages])

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
          // Only trigger active screen popups for Medium and High priority events.
          // Low priority events (like passive profile likes) should only silently increment the Notification Bell counter.
          // Only trigger active screen popups for Medium and High priority events.
          // Low priority events (like passive profile likes) should only silently increment the Notification Bell counter.
          toast.success('🎉 New Match!')
          try {
            const matchData = docChange.doc.data() as {
              userA?: string
              userB?: string
            }
            const otherUid =
              matchData.userA === currentUser.uid ? matchData.userB : matchData.userA
            let otherUserName = 'someone'
            if (otherUid) {
              const otherUser = await getUserProfile(otherUid)
              otherUserName = otherUser?.displayName || 'someone'
            }
            await createNotification({
              recipientId: currentUser.uid,
              type: 'match',
              title: 'New Match!',
              body: `You and ${otherUserName} liked each other.`,
              link: `/matches`,
            })
          } catch (error) {
            console.error('Failed to persist match notification:', error)
          }
        }
      }

      if (newMatchCount > 0) {
        setUnreadMatches(useNotificationStore.getState().unreadMatches + newMatchCount)
      }
    }, (error) => {
      console.error('Listener permission error:', error)
    })

    return () => unsubscribe()
  }, [currentUser, setUnreadMatches])

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
        console.error('Listener permission error:', error)
      }
    )

    return () => unsubscribe()
  }, [currentUser, setNotifications])

  return null
}

export default GlobalListeners
