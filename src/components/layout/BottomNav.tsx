import React from 'react'
import { NavLink, useLocation } from 'react-router-dom'
import { Compass, Users, MessageCircle, User, Building } from 'lucide-react'
import { useAuthStore } from '@/store/authStore'
import { useNotificationStore } from '@/store/notificationStore'

// ─── Route Configuration ──────────────────────────────────────────────────────
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

// ─── BottomNav ────────────────────────────────────────────────────────────────
export const BottomNav: React.FC = () => {
  const location = useLocation()
  const { currentUser } = useAuthStore()
  const { unreadMessages, unreadMatches } = useNotificationStore()

  const navItems: NavItem[] = [
    ...BASE_NAV,
    ...(currentUser?.role === 'HOST' || currentUser?.role === 'FLEX'
      ? [{ path: '/my-listings', label: 'Listings', icon: Building }]
      : []),
    { path: '/profile', label: 'Profile', icon: User },
  ]

  // Hide on onboarding and chat detail pages
  const shouldHide =
    location.pathname === '/onboarding' ||
    location.pathname.startsWith('/chat/')

  if (shouldHide) return null

  return (
    <nav
      className="fixed bottom-0 w-full bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-700/50 z-50 pb-safe md:hidden"
      aria-label="Primary navigation"
    >
      <div className="max-w-md mx-auto w-full flex justify-between h-16 items-center px-2">
        {navItems.map(({ path, label, icon: Icon }) => (
          <NavLink
            key={path}
            to={path}
            className={({ isActive }) =>
              [
                'flex flex-col items-center justify-center gap-1 rounded-xl px-4 py-2',
                'outline-none transition-all duration-150',
                // Physics — doctrine requirement
                'active:scale-[0.98]',
                // Focus ring
                'focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2',
                // Active state — Blue
                isActive
                  ? 'text-blue-500 dark:text-blue-400'
                  : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-300 dark:hover:bg-slate-700/50',
              ].join(' ')
            }
          >
            {({ isActive }) => (
              <>
                <span className="relative">
                  <Icon
                    className={[
                      'h-6 w-6 transition-transform duration-150',
                      isActive && 'scale-110',
                    ].join(' ')}
                    aria-hidden="true"
                  />
                  {path === '/messages' && unreadMessages > 0 && (
                    <span className="absolute -top-1 -right-2 min-w-4 h-4 px-1 rounded-full bg-red-500 text-white text-[9px] font-bold flex items-center justify-center">
                      {unreadMessages > 99 ? '99+' : unreadMessages}
                    </span>
                  )}
                  {path === '/matches' && unreadMatches > 0 && (
                    <span className="absolute -top-1 -right-2 min-w-4 h-4 px-1 rounded-full bg-red-500 text-white text-[9px] font-bold flex items-center justify-center">
                      {unreadMatches > 99 ? '99+' : unreadMatches}
                    </span>
                  )}
                </span>
                <span
                  className={[
                    'text-[10px] font-semibold uppercase tracking-wider',
                    'leading-none',
                  ].join(' ')}
                >
                  {label}
                </span>
              </>
            )}
          </NavLink>
        ))}
      </div>
    </nav>
  )
}
