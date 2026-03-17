import React from 'react'
import { Link } from 'react-router-dom'
import { Moon, Sun } from 'lucide-react'
import { Header } from './Header'
import { BottomNav } from './BottomNav'
import { Sidebar } from './Sidebar'
import { useTheme } from '@/context/ThemeContext'
import { useAuthStore } from '@/store/authStore'

// ─── AppLayout ────────────────────────────────────────────────────────────────
interface AppLayoutProps {
  children: React.ReactNode
}

export const AppLayout: React.FC<AppLayoutProps> = ({ children }) => {
  const { theme, setTheme } = useTheme()
  const { currentUser } = useAuthStore()

  const initials = currentUser?.displayName
    ? currentUser.displayName
        .split(' ')
        .filter(Boolean)
        .slice(0, 2)
        .map((part) => part[0]?.toUpperCase())
        .join('')
    : 'U'

  return (
    <div className="flex h-screen w-full bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-slate-50">
      <Sidebar className="w-64 hidden md:flex shrink-0 border-r border-slate-200 dark:border-slate-800" />

      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <Header />

        <header className="hidden md:flex items-center justify-between px-6 py-4 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border-b border-slate-200 dark:border-slate-800">
          <div aria-hidden="true" />

          <div className="flex items-center gap-3">
            <button
              onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
              className="p-2 rounded-full hover:bg-slate-200 dark:hover:bg-slate-800 transition-colors text-slate-600 dark:text-slate-300"
              aria-label="Toggle Dark Mode"
              type="button"
            >
              {theme === 'dark' ? <Sun size={20} /> : <Moon size={20} />}
            </button>

            {currentUser && (
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
                    <div className="w-10 h-10 rounded-full bg-brand-100 dark:bg-brand-900/40 text-brand-700 dark:text-brand-300 flex items-center justify-center text-sm font-bold border border-brand-200 dark:border-brand-700/60">
                      {initials}
                    </div>
                  )}
                </Link>
              </>
            )}
          </div>
        </header>

        <main className="flex-1 overflow-y-auto p-4 lg:p-8 bg-slate-50 dark:bg-slate-900">
          {children}
          <div className="h-20 md:hidden" aria-hidden="true" />
        </main>
      </div>

      <BottomNav />
    </div>
  )
}
