import React, { useState } from 'react'
import { Link, NavLink } from 'react-router-dom'
import { LayoutDashboard, Users, ShieldAlert, Moon, Sun, ChevronLeft } from 'lucide-react'
import { useTheme } from '@/context/ThemeContext'
import { useAuthStore } from '@/store/authStore'

// ─── Route Configuration ──────────────────────────────────────────────────────
const ADMIN_NAV = [
  { path: '/admin', label: 'Command Center', icon: LayoutDashboard },
  { path: '/admin/user-management', label: 'User Management', icon: Users },
  { path: '/admin/moderation', label: 'Moderation', icon: ShieldAlert },
]

// ─── AdminSidebar ───────────────────────────────────────────────────────────
const AdminSidebar: React.FC<{ isCollapsed: boolean; setIsCollapsed: (v: boolean) => void }> = ({ isCollapsed, setIsCollapsed }) => {
  return (
    <aside
      className={`hidden md:flex flex-col bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-700/50 transition-all duration-300 ${
        isCollapsed ? 'w-20' : 'w-64'
      }`}
    >
      {/* Top Left Branding */}
      <div className="flex items-center h-16 px-4 border-b border-slate-200 dark:border-slate-700/50 shrink-0">
        <img src="/favicon.svg" alt="Icon" className="w-8 h-8 shrink-0" />
        {!isCollapsed && (
          <span className="ml-3 text-xl font-syne font-bold text-brand-600 dark:text-brand-400 truncate">
            Colony-Roomie Finder <span className="text-amber-500 text-xs tracking-widest uppercase ml-1">Admin</span>
          </span>
        )}
      </div>

      <nav className="flex-1 py-4 flex flex-col gap-2 px-3">
        {ADMIN_NAV.map(({ path, label, icon: Icon }) => (
          <NavLink
            key={path}
            to={path}
            end={path === '/admin'}
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all ${
                isActive
                  ? 'bg-slate-100 dark:bg-slate-800 text-amber-600 dark:text-amber-400 font-medium border border-slate-700/50'
                  : 'text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-700/50 hover:text-slate-900 dark:hover:text-slate-100'
              }`
            }
            title={isCollapsed ? label : undefined}
          >
            <Icon className="h-5 w-5 shrink-0" />
            {!isCollapsed && <span className="truncate">{label}</span>}
          </NavLink>
        ))}
      </nav>

      {/* Bottom Collapse Toggle */}
      <div className="mt-auto p-4 border-t border-slate-200 dark:border-slate-700/50 shrink-0">
        <button
          className="flex items-center justify-center w-full p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 bg-slate-50 dark:bg-slate-800 border border-slate-700/50 hover:bg-slate-100 dark:hover:bg-slate-700/50 rounded-xl transition-colors"
          onClick={() => setIsCollapsed(!isCollapsed)}
        >
          <ChevronLeft className={`w-5 h-5 transition-transform duration-300 ${isCollapsed ? 'rotate-180' : ''}`} />
        </button>
      </div>
    </aside>
  )
}

// ─── AdminHeader ────────────────────────────────────────────────────────────
const AdminHeader: React.FC<{ isCollapsed: boolean }> = ({ isCollapsed }) => {
  const { theme, setTheme } = useTheme()
  const { currentUser } = useAuthStore()

  const initials = currentUser?.displayName
    ? currentUser.displayName
        .split(' ')
        .filter(Boolean)
        .slice(0, 2)
        .map((part) => part[0]?.toUpperCase())
        .join('')
    : 'A'

  return (
    <header className="sticky top-0 z-[100] h-16 shrink-0 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-700/50 flex items-center justify-between px-4 sm:px-6">
      <div className="flex items-center gap-4">
        <Link
          to="/admin"
          className="md:hidden flex items-center gap-2 outline-none transition-all duration-150 active:scale-[0.98] focus-visible:ring-2 focus-visible:ring-amber-400 focus-visible:ring-offset-2 rounded-lg py-1"
        >
          <img src="/favicon.svg" alt="Icon" className="w-8 h-8 shrink-0" />
          <span className="text-xl font-syne font-bold text-brand-600 dark:text-brand-400">
            Colony-Roomie Finder <span className="text-amber-500 text-xs tracking-widest uppercase ml-1">Admin</span>
          </span>
        </Link>
        {isCollapsed && (
          <div className="hidden md:flex items-center gap-3">
            <span className="text-xl font-syne font-bold text-brand-600 dark:text-brand-400">
              Colony-Roomie Finder <span className="text-amber-500 text-xs tracking-widest uppercase ml-1">Admin</span>
            </span>
          </div>
        )}
      </div>

      <div className="flex items-center gap-4">
        <button
          onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
          className="p-2 rounded-full hover:bg-slate-100 dark:hover:bg-slate-700/50 transition-colors text-slate-600 dark:text-slate-300"
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
              <div className="inline-block mt-0.5 px-2 py-0.5 rounded text-[10px] font-extrabold uppercase tracking-widest bg-amber-500/10 text-amber-600 dark:text-amber-400">
                ADMIN
              </div>
            </div>

            <div className="w-10 h-10 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 flex items-center justify-center text-sm font-bold border border-slate-200 dark:border-slate-700">
              {initials}
            </div>
          </>
        )}
      </div>
    </header>
  )
}

// ─── AdminBottomNav ─────────────────────────────────────────────────────────
const AdminBottomNav: React.FC = () => {
  return (
    <nav
      className="fixed bottom-0 w-full bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-700/50 z-50 pb-safe md:hidden"
      aria-label="Admin primary navigation"
    >
      <div className="max-w-md mx-auto w-full flex justify-between h-16 items-center px-4">
        {ADMIN_NAV.map(({ path, label, icon: Icon }) => (
          <NavLink
            key={path}
            to={path}
            end={path === '/admin'}
            className={({ isActive }) =>
              `flex flex-col items-center justify-center gap-1 rounded-xl px-4 py-2 outline-none transition-all duration-150 active:scale-[0.98] ${
                isActive
                  ? 'text-amber-500 dark:text-amber-400'
                  : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-300 dark:hover:bg-slate-700/50'
              }`
            }
          >
            {({ isActive }) => (
              <>
                <Icon
                  className={`h-6 w-6 transition-transform duration-150 ${
                    isActive && 'scale-110'
                  }`}
                  aria-hidden="true"
                />
                <span className="text-[10px] font-semibold uppercase tracking-wider leading-none">
                  {label.split(' ')[0]}
                </span>
              </>
            )}
          </NavLink>
        ))}
      </div>
    </nav>
  )
}

// ─── AdminLayout ────────────────────────────────────────────────────────────
export const AdminLayout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isCollapsed, setIsCollapsed] = useState(false)

  return (
    <div className="flex h-screen overflow-hidden bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-50 font-sans">
      <AdminSidebar isCollapsed={isCollapsed} setIsCollapsed={setIsCollapsed} />

      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <AdminHeader isCollapsed={isCollapsed} />

        <main className="flex-1 overflow-y-auto bg-slate-50 dark:bg-slate-950 p-4 md:p-8 pb-24 md:pb-8">
          {children}
        </main>
      </div>

      <AdminBottomNav />
    </div>
  )
}
