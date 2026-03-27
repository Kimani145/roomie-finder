import { create } from 'zustand'

export type AppNotificationType = 'message' | 'match'

export interface AppNotification {
  id: string
  type: AppNotificationType
  title: string
  actionPath: string
  createdAt: number
  read: boolean
}

interface NotificationState {
  unreadMessages: number
  unreadMatches: number
  notifications: AppNotification[]
  setUnreadMessages: (count: number) => void
  setUnreadMatches: (count: number) => void
  clearUnreadMatches: () => void
  pushNotification: (notification: Omit<AppNotification, 'read'>) => void
  markNotificationRead: (id: string) => void
  markAllNotificationsRead: () => void
}

export const useNotificationStore = create<NotificationState>((set) => ({
  unreadMessages: 0,
  unreadMatches: 0,
  notifications: [],

  setUnreadMessages: (count) =>
    set({ unreadMessages: Math.max(0, Number.isFinite(count) ? count : 0) }),

  setUnreadMatches: (count) =>
    set({ unreadMatches: Math.max(0, Number.isFinite(count) ? count : 0) }),

  clearUnreadMatches: () => set({ unreadMatches: 0 }),

  pushNotification: (notification) =>
    set((state) => {
      if (state.notifications.some((item) => item.id === notification.id)) {
        return state
      }

      return {
        notifications: [{ ...notification, read: false }, ...state.notifications].slice(0, 50),
      }
    }),

  markNotificationRead: (id) =>
    set((state) => ({
      notifications: state.notifications.map((item) =>
        item.id === id ? { ...item, read: true } : item
      ),
    })),

  markAllNotificationsRead: () =>
    set((state) => ({
      notifications: state.notifications.map((item) => ({ ...item, read: true })),
    })),
}))
