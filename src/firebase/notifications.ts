import {
  collection,
  doc,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  setDoc,
  updateDoc,
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
  isRead: boolean
  createdAt?: { toDate?: () => Date } | null
}

export const createNotification = async (params: {
  recipientId: string
  type: AppNotificationType
  title: string
  body: string
  link: string
}) => {
  await setDoc(doc(collection(db, 'notifications')), {
    recipientId: params.recipientId,
    type: params.type,
    title: params.title,
    body: params.body,
    link: params.link,
    isRead: false,
    createdAt: serverTimestamp(),
  })
}

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

export const markNotificationRead = async (notificationId: string) => {
  await updateDoc(doc(db, 'notifications', notificationId), { isRead: true })
}

export const markAllNotificationsRead = async (
  notifications: Array<{ id: string; isRead: boolean }>
) => {
  await Promise.all(
    notifications.filter((item) => !item.isRead).map((item) => markNotificationRead(item.id))
  )
}
