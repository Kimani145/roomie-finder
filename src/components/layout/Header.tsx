import React from 'react'
import { Link, useLocation } from 'react-router-dom'
import { Moon, Sun } from 'lucide-react'
import { NotificationBell } from './NotificationBell'
import { useTheme } from '@/context/ThemeContext'
import { useAuthStore } from '@/store/authStore'

// ─── Header ───────────────────────────────────────────────────────────────────
interface HeaderProps {
  isCollapsed: boolean
}

export const Header: React.FC<HeaderProps> = ({ isCollapsed }) => {
  const location = useLocation()
  const { theme, setTheme } = useTheme()
  const { currentUser } = useAuthStore()
  const showDesktopBrand = !currentUser || isCollapsed

  const initials = currentUser?.displayName
    ? currentUser.displayName
        .split(' ')
        .filter(Boolean)
        .slice(0, 2)
        .map((part) => part[0]?.toUpperCase())
        .join('')
    : 'U'

  // Hide on onboarding and full-screen chat
  const shouldHide =
    location.pathname === '/onboarding' ||
    location.pathname.startsWith('/chat/')

  if (shouldHide) return null

  return (
    <header className="sticky top-0 z-[100] h-16 shrink-0 bg-white/70 backdrop-blur-xl dark:bg-slate-900/95 border-b border-slate-200/50 dark:border-slate-700/50 flex items-center justify-between px-4 sm:px-6 shadow-sm dark:shadow-none transition-all duration-300">
      <div className="flex items-center gap-4">
        <Link
          to="/discover"
          className="md:hidden flex flex-col outline-none transition-all duration-150 active:scale-[0.98] focus-visible:ring-2 focus-visible:ring-blue-400 focus-visible:ring-offset-2 rounded-lg px-2 py-1"
        >
          <div className="flex items-center gap-1">
            <span className="text-xl font-syne font-bold text-brand-600 dark:text-brand-400">
              Roomie Finder
            </span>
            <span className="text-[10px] text-slate-400">©</span>
          </div>
          <span className="text-[10px] font-medium text-slate-400">
            Ranked by Compatibility
          </span>
        </Link>

        {showDesktopBrand && (
          <Link
            to="/discover"
            className="hidden md:block text-xl font-syne font-bold text-brand-600 dark:text-brand-400 animate-fade-in"
          >
            Roomie Finder
          </Link>
        )}
      </div>

      <div className="flex items-center gap-4">
        {currentUser && <NotificationBell />}

        <button
          onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
          className="p-2 rounded-full hover:bg-slate-100 dark:hover:bg-slate-700/50 transition-colors text-slate-600 dark:text-slate-300"
          aria-label="Toggle Dark Mode"
          type="button"
        >
          {theme === 'dark' ? <Sun size={20} /> : <Moon size={20} />}
        </button>

        {currentUser ? (
          <>
            <div className="hidden sm:block text-right">
              <p className="text-sm font-semibold text-slate-900 dark:text-slate-50">
                {currentUser.displayName}
              </p>
              <p className="text-xs font-bold text-brand-600 dark:text-brand-400 uppercase tracking-wider">
                {currentUser.role}
              </p>
            </div>

            <Link
              to="/profile"
              className="cursor-pointer transition-transform hover:scale-105"
            >
              {currentUser.photoURL ? (
                <img
                  src={currentUser.photoURL}
                  alt={currentUser.displayName}
                  className="w-10 h-10 rounded-full object-cover border border-slate-200 dark:border-slate-700"
                />
              ) : (
                <div className="w-10 h-10 rounded-full bg-brand-100 dark:bg-brand-900/40 text-brand-700 dark:text-brand-200 flex items-center justify-center text-sm font-bold border border-brand-300 dark:border-brand-700/60">
                  {initials}
                </div>
              )}
            </Link>
          </>
        ) : (
          <div className="flex items-center gap-2">
            <Link
              to="/signup"
              className="hidden sm:inline-flex items-center rounded-xl border border-slate-200/50 bg-white/50 backdrop-blur-sm shadow-sm dark:shadow-none dark:border-slate-700 px-4 py-2 text-sm font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-50/80 dark:hover:bg-slate-800 transition-all hover:scale-[1.02]"
            >
              Create account
            </Link>
            <Link
              to="/login"
              className="inline-flex items-center rounded-xl bg-brand-600 px-4 py-2 text-sm font-semibold text-white hover:bg-brand-700 shadow-md shadow-brand-500/20 transition-all hover:scale-[1.02]"
            >
              Sign in
            </Link>
          </div>
        )}
      </div>
    </header>
  )
}
