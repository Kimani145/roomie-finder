import React from 'react'
import { Bell, CheckCheck } from 'lucide-react'
import { Link, useNavigate } from 'react-router-dom'
import { useNotificationStore } from '@/store/notificationStore'

const NotificationsPage: React.FC = () => {
  const navigate = useNavigate()
  const { notifications, markNotificationRead, markAllNotificationsRead } = useNotificationStore()

  const handleNotificationClick = (id: string, actionPath: string) => {
    markNotificationRead(id)
    navigate(actionPath)
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
            onClick={markAllNotificationsRead}
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
            <button
              key={notification.id}
              type="button"
              onClick={() => handleNotificationClick(notification.id, notification.actionPath)}
              className={[
                'w-full text-left px-4 py-4 border-b border-slate-100 dark:border-slate-700',
                'hover:bg-slate-50 dark:hover:bg-slate-700/40 transition-colors',
                notification.read ? 'bg-white dark:bg-slate-800' : 'bg-blue-50/50 dark:bg-blue-900/10',
              ].join(' ')}
            >
              <div className="flex items-start justify-between gap-3">
                <p className="font-semibold text-slate-900 dark:text-slate-100">{notification.title}</p>
                <span className="text-xs text-slate-500 dark:text-slate-400">
                  {new Date(notification.createdAt).toLocaleTimeString([], {
                    hour: 'numeric',
                    minute: '2-digit',
                  })}
                </span>
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

export default NotificationsPage
