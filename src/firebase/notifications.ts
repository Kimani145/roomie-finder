import {
  collection,
  doc,
  getDocs,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  setDoc,
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
  senderId?: string
  isRead: boolean
  createdAt?: { toDate?: () => Date } | null
}

export const createNotification = async (params: {
  recipientId: string
  type: AppNotificationType
  title: string
  body: string
  link: string
  matchId?: string
  senderId?: string
}) => {
  await setDoc(doc(collection(db, 'notifications')), {
    recipientId: params.recipientId,
    type: params.type,
    title: params.title,
    body: params.body,
    link: params.link,
    ...(params.matchId ? { matchId: params.matchId } : {}),
    ...(params.senderId ? { senderId: params.senderId } : {}),
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
