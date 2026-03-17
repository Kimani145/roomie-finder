import React from 'react'
import { NavLink } from 'react-router-dom'
import { Compass, Users, MessageCircle, User, Building } from 'lucide-react'
import { useAuthStore } from '@/store/authStore'

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
}

export const Sidebar: React.FC<SidebarProps> = ({ className }) => {
  const { currentUser } = useAuthStore()

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
        'border-r border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 h-screen sticky top-0 flex-col',
        className ?? 'hidden lg:flex lg:w-60',
      ].join(' ')}
    >
      <div className="px-6 pt-8 pb-6 border-b border-slate-200 dark:border-slate-800">
        <NavLink
          to="/discover"
          className="block rounded-lg outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2"
        >
          <div className="font-display text-xl font-bold tracking-tight text-slate-900 dark:text-slate-50">
            Roomie Finder
          </div>
          <p className="mt-1 text-xs font-medium text-slate-500 dark:text-slate-400">
            Ranked by Compatibility
          </p>
        </NavLink>
      </div>

      <nav className="flex-1 px-3 py-4" aria-label="Primary desktop navigation">
        <ul className="space-y-1">
          {navItems.map(({ path, label, icon: Icon }) => (
            <li key={path}>
              <NavLink
                to={path}
                className={({ isActive }) =>
                  [
                    'flex items-center gap-3 px-3 py-2.5 text-sm outline-none',
                    'focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2',
                    isActive
                      ? 'bg-blue-50 dark:bg-blue-500/20 text-blue-700 dark:text-blue-300 font-bold rounded-lg'
                      : 'text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-lg transition-colors',
                  ].join(' ')
                }
              >
                <Icon className="h-5 w-5" aria-hidden="true" />
                <span>{label}</span>
              </NavLink>
            </li>
          ))}
        </ul>
      </nav>
    </aside>
  )
}
