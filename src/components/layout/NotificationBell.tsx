import React, { useMemo, useState } from 'react'
import { Bell } from 'lucide-react'
import { Link } from 'react-router-dom'
import { useNotificationStore } from '@/store/notificationStore'
import { markNotificationRead } from '@/firebase/notifications'

export const NotificationBell: React.FC = () => {
  const [open, setOpen] = useState(false)
  const {
    unreadMessages,
    unreadMatches,
    unreadNotifications,
    notifications,
    markNotificationReadLocal,
  } = useNotificationStore()

  const totalCount = unreadMessages + unreadMatches + unreadNotifications
  const recentNotifications = useMemo(() => notifications.slice(0, 5), [notifications])

  return (
    <div className="relative overflow-visible">
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        className="relative p-2 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors text-slate-600 dark:text-slate-300"
        aria-label="Open notifications"
      >
        <Bell className="h-5 w-5" />
        {totalCount > 0 && (
          <span className="absolute -top-1 -right-1 min-w-5 h-5 px-1 rounded-full bg-red-500 text-white text-[10px] font-bold flex items-center justify-center">
            {totalCount > 99 ? '99+' : totalCount}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 mt-2 w-80 sm:w-96 z-[999] bg-white dark:bg-slate-800 shadow-2xl rounded-2xl border border-slate-200 dark:border-slate-700 flex flex-col overflow-hidden">
          <div className="px-4 py-3 border-b border-slate-100 dark:border-slate-700">
            <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">Notifications</p>
          </div>

          {recentNotifications.length === 0 ? (
            <p className="px-4 py-6 text-sm text-slate-500 dark:text-slate-400">No notifications yet.</p>
          ) : (
            <div className="max-h-72 overflow-y-auto">
              {recentNotifications.map((notification) => (
                <Link
                  key={notification.id}
                  to={notification.link}
                  onClick={async () => {
                    if (!notification.isRead) {
                      try {
                        await markNotificationRead(notification.id)
                        markNotificationReadLocal(notification.id)
                      } catch (error) {
                        console.error('Failed to mark notification as read:', error)
                      }
                    }
                    setOpen(false)
                  }}
                  className={[
                    'block px-4 py-3 border-b border-slate-100 dark:border-slate-700',
                    'hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors',
                    notification.isRead
                      ? 'bg-white dark:bg-slate-900'
                      : 'bg-blue-50/50 dark:bg-blue-900/10',
                  ].join(' ')}
                >
                  <p className="text-sm font-medium text-slate-900 dark:text-slate-100">
                    {notification.title}
                  </p>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                    {notification.body}
                  </p>
                </Link>
              ))}
            </div>
          )}

          <Link
            to="/notifications"
            onClick={() => setOpen(false)}
            className="block px-4 py-3 text-sm font-semibold text-blue-600 dark:text-blue-400 hover:bg-slate-50 dark:hover:bg-slate-800"
          >
            View all notifications
          </Link>
        </div>
      )}
    </div>
  )
}
