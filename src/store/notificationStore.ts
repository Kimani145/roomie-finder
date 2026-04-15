import { create } from 'zustand'

export type AppNotificationType = 'message' | 'match' | 'like_summary' | 'like_summary'

export interface AppNotification {
  id: string
  type: AppNotificationType
  title: string
  body: string
  link: string
  createdAt: number
  isRead: boolean
}

interface NotificationState {
  unreadMessages: number
  unreadMatches: number
  unreadNotifications: number
  notifications: AppNotification[]
  setUnreadMessages: (count: number) => void
  setUnreadMatches: (count: number) => void
  setNotifications: (notifications: AppNotification[]) => void
  clearUnreadMatches: () => void
  markNotificationReadLocal: (id: string) => void
  markAllNotificationsReadLocal: () => void
  markNotificationsReadForMatchLocal: (matchId: string) => void
}

export const useNotificationStore = create<NotificationState>((set) => ({
  unreadMessages: 0,
  unreadMatches: 0,
  unreadNotifications: 0,
  notifications: [],

  setUnreadMessages: (count) =>
    set({ unreadMessages: Math.max(0, Number.isFinite(count) ? count : 0) }),

  setUnreadMatches: (count) =>
    set({ unreadMatches: Math.max(0, Number.isFinite(count) ? count : 0) }),

  setNotifications: (notifications) =>
    set({
      notifications,
      unreadNotifications: notifications.filter((item) => !item.isRead).length,
    }),

  clearUnreadMatches: () => set({ unreadMatches: 0 }),

  markNotificationReadLocal: (id) =>
    set((state) => {
      return {
        notifications: state.notifications.map((item) =>
          item.id === id ? { ...item, isRead: true } : item
        ),
        unreadNotifications: Math.max(
          0,
          state.notifications.filter((item) => !item.isRead && item.id !== id).length
        ),
      }
    }),

  markAllNotificationsReadLocal: () =>
    set((state) => ({
      notifications: state.notifications.map((item) => ({ ...item, isRead: true })),
      unreadNotifications: 0,
    })),

  markNotificationsReadForMatchLocal: (matchId) =>
    set((state) => {
      const nextNotifications = state.notifications.map((item) => {
        if (item.isRead) return item

        const isMatchNotification =
          item.link === `/chat/${matchId}` || item.link === `/messages/${matchId}`

        return isMatchNotification ? { ...item, isRead: true } : item
      })

      return {
        notifications: nextNotifications,
        unreadNotifications: nextNotifications.filter((item) => !item.isRead).length,
      }
    }),
}))
