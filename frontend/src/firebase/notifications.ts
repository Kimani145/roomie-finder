/**
 * notifications.ts — Frontend notification reads.
 *
 * BACKEND AUTHORITY: Notification CREATION is owned by the backend (NotificationService).
 * This file only contains read operations and user interaction (mark as read).
 *
 * DO NOT add createNotification() or any write operation to this file.
 * All notification creation goes through the backend API.
 */
import {
  collection,
  doc,
  getDocs,
  onSnapshot,
  orderBy,
  query,
  updateDoc,
  writeBatch,
  where,
} from 'firebase/firestore'
import { db } from './config'
import type { AppNotification, AppNotificationType } from '@/store/notificationStore'

type FirestoreNotification = {
  recipientId: string
  type: AppNotificationType
  title: string
  body: string
  link: string
  matchId?: string
  senderId: string
  isRead: boolean
  createdAt?: { toDate?: () => Date } | null
}

// ─── Subscribe to Notifications (Real-time) ───────────────────────────────────

export const subscribeToNotifications = (
  recipientId: string,
  onData: (notifications: AppNotification[]) => void,
  onError?: (error: Error) => void
) => {
  const q = query(
    collection(db, 'notifications'),
    where('recipientId', '==', recipientId),
    orderBy('createdAt', 'desc')
  )

  return onSnapshot(
    q,
    (snapshot) => {
      const notifications = snapshot.docs.map((docSnap) => {
        const data = docSnap.data() as FirestoreNotification
        const createdAt =
          data.createdAt && typeof data.createdAt.toDate === 'function'
            ? data.createdAt.toDate().getTime()
            : Date.now()
        return {
          id: docSnap.id,
          type: data.type,
          title: data.title,
          body: data.body,
          link: data.link,
          isRead: data.isRead ?? false,
          createdAt,
        }
      })
      onData(notifications)
    },
    (error) => {
      onError?.(error as Error)
    }
  )
}

// ─── Mark Individual Notification Read ────────────────────────────────────────

export const markNotificationRead = async (notificationId: string) => {
  await updateDoc(doc(db, 'notifications', notificationId), { isRead: true })
}

// ─── Mark All Notifications Read ─────────────────────────────────────────────

export const markAllNotificationsRead = async (
  notifications: Array<{ id: string; isRead: boolean }>
) => {
  await Promise.all(
    notifications.filter((item) => !item.isRead).map((item) => markNotificationRead(item.id))
  )
}

// ─── Mark Match Notifications Read ───────────────────────────────────────────

export const markAllNotificationsReadForMatch = async (params: {
  recipientId: string
  matchId: string
  senderId?: string
}) => {
  const q = query(
    collection(db, 'notifications'),
    where('recipientId', '==', params.recipientId),
    where('isRead', '==', false)
  )

  const snapshot = await getDocs(q)
  if (snapshot.empty) return

  const batch = writeBatch(db)

  snapshot.docs.forEach((docSnap) => {
    const data = docSnap.data() as FirestoreNotification
    const matchesByLink =
      data.link === `/chat/${params.matchId}` || data.link === `/messages/${params.matchId}`
    const matchesByMatchId = data.matchId === params.matchId
    const matchesBySender = Boolean(params.senderId) && data.senderId === params.senderId

    if (matchesByLink || matchesByMatchId || matchesBySender) {
      batch.update(doc(db, 'notifications', docSnap.id), { isRead: true })
    }
  })

  await batch.commit()
}
