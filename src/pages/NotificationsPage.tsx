import React from 'react'
import { Bell, CheckCheck, Heart } from 'lucide-react'
import { Link, useNavigate } from 'react-router-dom'
import { useNotificationStore } from '@/store/notificationStore'
import { markAllNotificationsRead, markNotificationRead } from '@/firebase/notifications'

const NotificationsPage: React.FC = () => {
  const navigate = useNavigate()
  const {
    notifications,
    markNotificationReadLocal,
    markAllNotificationsReadLocal,
  } = useNotificationStore()

  const handleNotificationClick = async (notification: {
    id: string
    link: string
    isRead: boolean
  }) => {
    try {
      if (!notification.isRead) {
        await markNotificationRead(notification.id)
        markNotificationReadLocal(notification.id)
      }
    } catch (error) {
      console.error('Failed to mark notification as read:', error)
    } finally {
      navigate(notification.link)
    }
  }

  const handleMarkAllRead = async () => {
    try {
      await markAllNotificationsRead(
        notifications.map((item) => ({ id: item.id, isRead: item.isRead }))
      )
      markAllNotificationsReadLocal()
    } catch (error) {
      console.error('Failed to mark all notifications as read:', error)
    }
  }

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full">
      <div className="flex items-center justify-between mb-6 gap-3">
        <h1 className="text-2xl font-syne font-bold text-slate-900 dark:text-slate-50">
          Notifications
        </h1>
        {notifications.length > 0 && (
          <button
            type="button"
            onClick={handleMarkAllRead}
            className="inline-flex items-center gap-2 rounded-xl border border-slate-200 dark:border-slate-700 px-3 py-2 text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
          >
            <CheckCheck className="h-4 w-4" />
            Mark all read
          </button>
        )}
      </div>

      {notifications.length === 0 ? (
        <div className="rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-10 text-center">
          <Bell className="h-10 w-10 mx-auto text-slate-400 dark:text-slate-500 mb-3" />
          <p className="text-slate-600 dark:text-slate-300">No notifications yet.</p>
          <Link
            to="/discover"
            className="inline-flex mt-4 rounded-xl bg-blue-500 text-white px-4 py-2 text-sm font-semibold hover:bg-blue-600"
          >
            Back to Discover
          </Link>
        </div>
      ) : (
        <div className="rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 overflow-hidden">
          {notifications.map((notification) => (
            <div
              key={notification.id}
              onClick={() => handleNotificationClick(notification)}
              className={`p-4 flex gap-4 cursor-pointer transition-colors border-b border-slate-200 dark:border-slate-800 ${
                !notification.isRead
                  ? 'bg-blue-50/50 dark:bg-blue-900/10 border-l-4 border-l-brand-500'
                  : 'bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800'
              }`}
            >
              {!notification.isRead && (
                <div className="w-2 h-2 rounded-full bg-brand-500 mt-2 shrink-0" />
              )}
              {notification.type === 'like_summary' && (
                 <div className="p-2 bg-pink-100 dark:bg-pink-500/20 text-pink-500 rounded-full shrink-0 flex items-center justify-center">
                   <Heart className="w-4 h-4 fill-current" />
                 </div>
              )}
              <div className="min-w-0 w-full">
                <div className="flex items-start justify-between gap-3">
                  <h4
                    className={`text-sm ${
                      !notification.isRead
                        ? 'font-bold text-slate-900 dark:text-white'
                        : 'font-medium text-slate-700 dark:text-slate-300'
                    }`}
                  >
                    {notification.title}
                  </h4>
                  <span className="text-xs text-slate-500 dark:text-slate-400 shrink-0">
                    {new Date(notification.createdAt).toLocaleTimeString([], {
                      hour: 'numeric',
                      minute: '2-digit',
                    })}
                  </span>
                </div>
                <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
                  {notification.body}
                </p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

export default NotificationsPage
