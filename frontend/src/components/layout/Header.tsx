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
    <header className="sticky top-0 z-[100] h-16 shrink-0 bg-[#FFFFFF]/70 backdrop-blur-xl dark:bg-[#111827]/95 border-b border-[#E2E8F0] dark:border-[#334155] flex items-center justify-between px-4 sm:px-6 shadow-sm dark:shadow-none transition-all duration-300">
      <div className="flex items-center gap-4">
        <Link
          to="/discover"
          className="md:hidden flex flex-col outline-none transition-all duration-150 active:scale-[0.98] focus-visible:ring-2 focus-visible:ring-brand-500 focus-visible:ring-offset-2 rounded-nest px-2 py-1"
        >
          <div className="flex items-center">
            <span className="font-extrabold tracking-tight text-brand-600 dark:text-white text-2xl leading-none drop-shadow-sm">
              Roomie Finder
            </span>
          </div>
        </Link>

        {showDesktopBrand && (
          <Link
            to="/discover"
            className="hidden md:flex items-center animate-fade-in"
          >
            <span className="font-extrabold tracking-tight text-brand-600 dark:text-white text-2xl leading-none drop-shadow-sm">
              Roomie Finder
            </span>
          </Link>
        )}
      </div>

      <div className="flex items-center gap-4">
        {currentUser && <NotificationBell />}

        <button
          onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
          className="p-2 rounded-full hover:bg-slate-100 dark:hover:bg-surface-dark-elev transition-colors text-slate-600 dark:text-slate-300"
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
                  className="w-10 h-10 rounded-full object-cover border border-slate-200 dark:border-surface-dark-border"
                />
              ) : (
                <div className="w-10 h-10 rounded-full bg-brand-50 dark:bg-[#1F2937] text-brand-600 dark:text-brand-400 flex items-center justify-center text-sm font-bold border border-brand-200 dark:border-brand-500/20">
                  {initials}
                </div>
              )}
            </Link>
          </>
        ) : (
          <div className="flex items-center gap-2">
            <Link
              to="/signup"
              className="hidden sm:inline-flex items-center rounded-nest border border-slate-200 bg-white/50 backdrop-blur-sm shadow-sm dark:shadow-none dark:border-surface-dark-border px-4 py-2 text-sm font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-50/80 dark:hover:bg-surface-dark-elev transition-all hover:scale-[1.02]"
            >
              Create account
            </Link>
            <Link
              to="/login"
              className="inline-flex items-center rounded-nest bg-gradient-to-r from-brand-600 to-brand-500 px-4 py-2 text-sm font-semibold text-white hover:opacity-90 shadow-md shadow-brand-600/20 transition-all hover:scale-[1.02]"
            >
              Sign in
            </Link>
          </div>
        )}
      </div>
    </header>
  )
}
