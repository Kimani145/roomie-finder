import React, { useState } from 'react'
import {
  Bell,
  CheckCheck,
  Heart,
  MessageSquare,
  ShieldAlert,
  Trash2,
  RefreshCw,
  AlertCircle,
  ExternalLink,
} from 'lucide-react'
import { Link, useNavigate } from 'react-router-dom'
import { formatDistanceToNow } from 'date-fns'
import { useNotifications, NotificationItem } from '@/hooks/useNotifications'
import toast from 'react-hot-toast'

export default function NotificationsPage() {
  const navigate = useNavigate()
  const [activeFilter, setActiveFilter] = useState<string>('all')
  const {
    notifications,
    unreadCount,
    loading,
    error,
    refetch,
    markAsRead,
    markAllAsRead,
    deleteNotification,
  } = useNotifications(activeFilter)

  const handleNotificationClick = async (notif: NotificationItem) => {
    if (!notif.isRead) {
      await markAsRead(notif.id)
    }
    const link = notif.metadata?.link as string | undefined
    if (link) {
      navigate(link)
    }
  }

  const handleMarkAllRead = async () => {
    await markAllAsRead()
    toast.success('All notifications marked as read')
  }

  const handleDelete = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation()
    await deleteNotification(id)
    toast.success('Notification removed')
  }

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'match':
      case 'like':
      case 'like_summary':
        return (
          <div className="p-2.5 bg-pink-100 dark:bg-pink-500/20 text-pink-500 rounded-2xl shrink-0 flex items-center justify-center">
            <Heart className="w-5 h-5 fill-current" />
          </div>
        )
      case 'message':
        return (
          <div className="p-2.5 bg-brand-100 dark:bg-brand-500/20 text-brand-600 dark:text-brand-400 rounded-2xl shrink-0 flex items-center justify-center">
            <MessageSquare className="w-5 h-5" />
          </div>
        )
      case 'appeal':
      case 'report':
      case 'admin':
        return (
          <div className="p-2.5 bg-amber-100 dark:bg-amber-500/20 text-amber-600 dark:text-amber-400 rounded-2xl shrink-0 flex items-center justify-center">
            <ShieldAlert className="w-5 h-5" />
          </div>
        )
      default:
        return (
          <div className="p-2.5 bg-slate-100 dark:bg-slate-800 text-slate-500 rounded-2xl shrink-0 flex items-center justify-center">
            <Bell className="w-5 h-5" />
          </div>
        )
    }
  }

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-syne font-bold text-slate-900 dark:text-slate-50 flex items-center gap-3">
            <Bell className="w-8 h-8 text-brand-600 dark:text-brand-400" />
            Notifications
            {unreadCount > 0 && (
              <span className="px-2.5 py-0.5 text-xs font-bold bg-brand-600 text-white rounded-full">
                {unreadCount} new
              </span>
            )}
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Stay updated on roommate matches, messages, and platform activity.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => refetch(activeFilter)}
            className="p-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 rounded-xl transition-colors"
            title="Refresh feed"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
          {notifications.length > 0 && (
            <button
              type="button"
              onClick={handleMarkAllRead}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-xs font-bold text-slate-700 dark:text-slate-200 transition-colors"
            >
              <CheckCheck className="h-4 w-4 text-emerald-500" />
              Mark all read
            </button>
          )}
        </div>
      </div>

      {/* Category Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200 dark:border-slate-800 overflow-x-auto pb-2">
        {[
          { id: 'all', label: 'All Notifications' },
          { id: 'match', label: 'Matches' },
          { id: 'message', label: 'Messages' },
          { id: 'appeal', label: 'Trust & Safety' },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => {
              setActiveFilter(tab.id)
              refetch(tab.id)
            }}
            className={`px-4 py-2 text-xs font-bold rounded-xl transition-all capitalize whitespace-nowrap ${
              activeFilter === tab.id
                ? 'bg-brand-600 text-white shadow-sm'
                : 'text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Content Feed */}
      {error ? (
        <div className="bg-white dark:bg-slate-900 border border-red-200 dark:border-red-900/50 rounded-3xl p-12 text-center flex flex-col items-center">
          <AlertCircle className="w-12 h-12 text-red-500 mb-4" />
          <h3 className="text-xl font-syne font-bold text-slate-900 dark:text-slate-50 mb-2">
            Failed to Load Notifications
          </h3>
          <p className="text-slate-500 mb-4">{error}</p>
          <button
            onClick={() => refetch(activeFilter)}
            className="px-4 py-2 bg-brand-600 text-white rounded-xl text-sm font-semibold"
          >
            Retry Connection
          </button>
        </div>
      ) : loading ? (
        <div className="space-y-3">
          {[1, 2, 3, 4].map((i) => (
            <div
              key={i}
              className="h-20 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl animate-pulse"
            />
          ))}
        </div>
      ) : notifications.length === 0 ? (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-16 text-center flex flex-col items-center">
          <Bell className="h-12 w-12 text-slate-400 dark:text-slate-500 mb-4" />
          <h3 className="text-xl font-syne font-bold text-slate-900 dark:text-slate-50 mb-2">
            No Notifications Found
          </h3>
          <p className="text-slate-500 dark:text-slate-400 text-sm max-w-sm mb-6">
            You&apos;re all caught up! No notifications match the selected category.
          </p>
          <Link
            to="/discover"
            className="px-5 py-2.5 rounded-xl bg-brand-600 text-white text-sm font-semibold hover:bg-brand-700 transition-colors"
          >
            Explore Roommate Matches
          </Link>
        </div>
      ) : (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl overflow-hidden shadow-sm divide-y divide-slate-100 dark:divide-slate-800">
          {notifications.map((notif) => (
            <div
              key={notif.id}
              onClick={() => handleNotificationClick(notif)}
              className={`p-5 flex items-start justify-between gap-4 cursor-pointer transition-colors ${
                !notif.isRead
                  ? 'bg-brand-50/40 dark:bg-brand-900/10 border-l-4 border-l-brand-600'
                  : 'hover:bg-slate-50/80 dark:hover:bg-slate-800/40'
              }`}
            >
              <div className="flex items-start gap-4 flex-1 min-w-0">
                {getNotificationIcon(notif.type)}
                <div className="space-y-1 flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2">
                    <h4
                      className={`text-sm ${
                        !notif.isRead
                          ? 'font-bold text-slate-900 dark:text-white'
                          : 'font-semibold text-slate-800 dark:text-slate-200'
                      }`}
                    >
                      {notif.title}
                    </h4>
                    <span className="text-xs text-slate-400 dark:text-slate-500 shrink-0">
                      {notif.createdAt
                        ? formatDistanceToNow(new Date(notif.createdAt), { addSuffix: true })
                        : 'Recently'}
                    </span>
                  </div>

                  <p className="text-sm text-slate-600 dark:text-slate-300 line-clamp-2">
                    {notif.body}
                  </p>

                  {notif.metadata?.link && (
                    <span className="inline-flex items-center gap-1 text-xs font-bold text-brand-600 dark:text-brand-400 mt-1">
                      View details <ExternalLink className="w-3 h-3" />
                    </span>
                  )}
                </div>
              </div>

              <button
                onClick={(e) => handleDelete(e, notif.id)}
                className="p-2 text-slate-400 hover:text-red-500 dark:hover:text-red-400 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors shrink-0"
                title="Delete notification"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
