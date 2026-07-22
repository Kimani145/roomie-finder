import { useEffect, useState, useCallback } from 'react'
import { fetchWithAuth } from '@/services/apiClient'
import { logger } from '@/utils/logger'

export interface NotificationItem {
  id: string
  recipientId: string
  type: string
  title: string
  body: string
  isRead: boolean
  metadata?: Record<string, any>
  createdAt?: string | null
}

export function useNotifications(initialType?: string) {
  const [notifications, setNotifications] = useState<NotificationItem[]>([])
  const [unreadCount, setUnreadCount] = useState(0)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchNotifications = useCallback(async (typeFilter?: string) => {
    try {
      setLoading(true)
      setError(null)
      const url = typeFilter && typeFilter !== 'all'
        ? `/api/v1/notifications?type=${typeFilter}`
        : '/api/v1/notifications'
      const data = await fetchWithAuth(url)
      setNotifications(data.notifications ?? [])
      setUnreadCount(data.unreadCount ?? 0)
    } catch (err: any) {
      logger.error('Failed to fetch notifications:', err)
      setError('Could not load notifications.')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchNotifications(initialType)
  }, [fetchNotifications, initialType])

  const markAsRead = async (id: string) => {
    try {
      await fetchWithAuth(`/api/v1/notifications/${id}/read`, { method: 'PATCH' })
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, isRead: true } : n))
      )
      setUnreadCount((prev) => Math.max(0, prev - 1))
    } catch (err) {
      logger.error('Failed to mark notification as read:', err)
    }
  }

  const markAllAsRead = async () => {
    try {
      await fetchWithAuth('/api/v1/notifications/read-all', { method: 'PATCH' })
      setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })))
      setUnreadCount(0)
    } catch (err) {
      logger.error('Failed to mark all as read:', err)
    }
  }

  const deleteNotification = async (id: string) => {
    try {
      await fetchWithAuth(`/api/v1/notifications/${id}`, { method: 'DELETE' })
      setNotifications((prev) => {
        const item = prev.find((n) => n.id === id)
        if (item && !item.isRead) {
          setUnreadCount((cnt) => Math.max(0, cnt - 1))
        }
        return prev.filter((n) => n.id !== id)
      })
    } catch (err) {
      logger.error('Failed to delete notification:', err)
    }
  }

  return {
    notifications,
    unreadCount,
    loading,
    error,
    refetch: fetchNotifications,
    markAsRead,
    markAllAsRead,
    deleteNotification,
  }
}
