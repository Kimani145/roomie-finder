import React from 'react'
import { NavLink } from 'react-router-dom'
import { Compass, Users, MessageCircle, User } from 'lucide-react'

interface NavItem {
  path: string
  label: string
  icon: React.ComponentType<{ className?: string }>
}

const navItems: NavItem[] = [
  { path: '/discover', label: 'Discover', icon: Compass },
  { path: '/matches', label: 'Matches', icon: Users },
  { path: '/messages', label: 'Messages', icon: MessageCircle },
  { path: '/profile', label: 'Profile', icon: User },
]

export const Sidebar: React.FC = () => {
  return (
    <aside className="hidden lg:flex lg:w-60 lg:flex-col border-r border-slate-200 bg-white lg:h-screen lg:sticky lg:top-0">
      <div className="px-6 pt-8 pb-6 border-b border-slate-200">
        <NavLink
          to="/discover"
          className="block rounded-lg outline-none focus-visible:ring-2 focus-visible:ring-blue-400 focus-visible:ring-offset-2"
        >
          <div className="font-display text-xl font-bold tracking-tight text-slate-900">
            Roomie Finder
          </div>
          <p className="mt-1 text-xs font-medium text-slate-500">
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
                    'focus-visible:ring-2 focus-visible:ring-blue-400 focus-visible:ring-offset-2',
                    isActive
                      ? 'bg-brand-50 text-brand-700 font-bold rounded-lg'
                      : 'text-slate-600 hover:bg-slate-50 rounded-lg transition-colors',
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
