import React from 'react'
import { NavLink } from 'react-router-dom'
import {
  Compass,
  Users,
  MessageCircle,
  User,
  Building,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react'
import { useAuthStore } from '@/store/authStore'
import { useNotificationStore } from '@/store/notificationStore'

interface NavItem {
  path: string
  label: string
  icon: React.ComponentType<{ className?: string }>
}

const BASE_NAV: NavItem[] = [
  { path: '/discover', label: 'Discover', icon: Compass },
  { path: '/matches', label: 'Matches', icon: Users },
  { path: '/messages', label: 'Messages', icon: MessageCircle },
]

interface SidebarProps {
  className?: string
  isCollapsed: boolean
  setIsCollapsed: React.Dispatch<React.SetStateAction<boolean>>
}

export const Sidebar: React.FC<SidebarProps> = ({
  className,
  isCollapsed,
  setIsCollapsed,
}) => {
  const { currentUser } = useAuthStore()
  const { unreadMessages, unreadMatches } = useNotificationStore()

  const navItems: NavItem[] = [
    ...BASE_NAV,
    ...(currentUser?.role === 'HOST' || currentUser?.role === 'FLEX'
      ? [{ path: '/my-listings', label: 'My Listings', icon: Building }]
      : []),
    { path: '/profile', label: 'Profile', icon: User },
  ]

  return (
    <aside
      className={[
        'hidden md:flex flex-col bg-white/60 backdrop-blur-xl dark:bg-slate-900 border-r border-slate-200/50 dark:border-slate-700/50 transition-all duration-300 sticky top-0 h-screen overflow-hidden shrink-0 shadow-[4px_0_24px_-12px_rgba(0,0,0,0.05)] dark:shadow-none z-20 hover:bg-white/80',
        isCollapsed ? 'w-20' : 'w-64',
        className ?? '',
      ].join(' ')}
    >
      <div className="flex items-center h-16 px-4 border-b border-slate-200/50 dark:border-slate-700/50 shrink-0">
        <img src="/favicon.svg" alt="Icon" className="w-8 h-8 shrink-0" />
        {!isCollapsed && (
          <span className="ml-3 text-xl font-syne font-bold text-brand-600 dark:text-brand-400 truncate">
            Roomie Finder
          </span>
        )}
      </div>

      <nav
        className={[
          'flex-1 py-4 pb-20',
          isCollapsed ? 'px-2' : 'px-3',
        ].join(' ')}
        aria-label="Primary desktop navigation"
      >
        <ul className="space-y-1">
          {navItems.map(({ path, label, icon: Icon }) => (
            <li key={path}>
              <NavLink
                to={path}
                aria-label={label}
                title={isCollapsed ? label : undefined}
                className={({ isActive }) =>
                  [
                    'relative flex items-center py-2.5 text-sm outline-none transition-all duration-200',
                    isCollapsed ? 'justify-center px-2' : 'gap-3 px-3',
                    'focus-visible:ring-2 focus-visible:ring-brand-500 focus-visible:ring-offset-2',
                    isActive
                      ? 'bg-gradient-to-r from-brand-50 to-brand-100/50 dark:from-brand-500/20 dark:to-brand-500/10 text-brand-700 dark:text-brand-300 font-bold rounded-xl shadow-sm dark:shadow-none border border-brand-100/50 dark:border-brand-500/20'
                      : 'text-slate-600 dark:text-slate-400 hover:text-brand-800 dark:hover:text-white hover:bg-slate-50/80 dark:hover:bg-slate-800/50 rounded-xl hover:translate-x-1',
                  ].join(' ')
                }
              >
                <Icon className="h-5 w-5 shrink-0" aria-hidden="true" />
                {!isCollapsed && (
                  <span className="whitespace-nowrap overflow-hidden">{label}</span>
                )}
                {!isCollapsed && path === '/messages' && unreadMessages > 0 && (
                  <span className="ml-auto min-w-5 h-5 px-1 rounded-full bg-red-500 text-white text-[10px] font-bold flex items-center justify-center">
                    {unreadMessages > 99 ? '99+' : unreadMessages}
                  </span>
                )}
                {!isCollapsed && path === '/matches' && unreadMatches > 0 && (
                  <span className="ml-auto min-w-5 h-5 px-1 rounded-full bg-red-500 text-white text-[10px] font-bold flex items-center justify-center">
                    {unreadMatches > 99 ? '99+' : unreadMatches}
                  </span>
                )}
                {isCollapsed && path === '/messages' && unreadMessages > 0 && (
                  <span className="absolute right-2 top-2 min-w-5 h-5 px-1 rounded-full bg-red-500 text-white text-[10px] font-bold flex items-center justify-center">
                    {unreadMessages > 99 ? '99+' : unreadMessages}
                  </span>
                )}
                {isCollapsed && path === '/matches' && unreadMatches > 0 && (
                  <span className="absolute right-2 top-2 min-w-5 h-5 px-1 rounded-full bg-red-500 text-white text-[10px] font-bold flex items-center justify-center">
                    {unreadMatches > 99 ? '99+' : unreadMatches}
                  </span>
                )}
              </NavLink>
            </li>
          ))}
        </ul>
      </nav>

      <div className="mt-auto p-4 border-t border-slate-200/50 dark:border-slate-700/50">
        <button
          type="button"
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="w-full flex items-center justify-center p-2 rounded-xl text-slate-500 dark:text-slate-400 hover:text-brand-700 dark:hover:text-white hover:bg-brand-50/50 dark:hover:bg-slate-800 transition-all hover:scale-105 active:scale-95"
          aria-label={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        >
          {isCollapsed ? <ChevronRight size={20} /> : <ChevronLeft size={20} />}
        </button>
      </div>
    </aside>
  )
}
