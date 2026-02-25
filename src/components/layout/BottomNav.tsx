import React from 'react'
import { NavLink, useLocation } from 'react-router-dom'
import { Compass, Users, MessageCircle, User } from 'lucide-react'

// ─── Route Configuration ──────────────────────────────────────────────────────
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

// ─── BottomNav ────────────────────────────────────────────────────────────────
export const BottomNav: React.FC = () => {
  const location = useLocation()

  // Hide on onboarding and chat detail pages
  const shouldHide =
    location.pathname === '/onboarding' ||
    location.pathname.startsWith('/chat/')

  if (shouldHide) return null

  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-40 border-t border-slate-200 bg-white/90 backdrop-blur-md"
      aria-label="Primary navigation"
    >
      <div className="max-w-md mx-auto w-full flex h-16 items-center justify-between px-2">
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
                'focus-visible:ring-2 focus-visible:ring-blue-400 focus-visible:ring-offset-2',
                // Active state — Brand Blue
                isActive
                  ? 'text-blue-500'
                  : 'text-slate-400 hover:text-slate-600',
              ].join(' ')
            }
            aria-current={({ isActive }) => (isActive ? 'page' : undefined)}
          >
            {({ isActive }) => (
              <>
                <Icon
                  className={[
                    'h-6 w-6 transition-transform duration-150',
                    isActive && 'scale-110',
                  ].join(' ')}
                  strokeWidth={isActive ? 2.5 : 2}
                  aria-hidden="true"
                />
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
