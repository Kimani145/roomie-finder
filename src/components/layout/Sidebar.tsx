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
        'sidebar-surface z-20 hidden h-full shrink-0 self-stretch overflow-y-auto border-r border-[#7b667c] shadow-lg transition-all duration-300 hover:brightness-105 md:flex md:flex-col',
        isCollapsed ? 'w-20' : 'w-64',
        className ?? '',
      ].join(' ')}
    >
      <div className="flex items-center h-16 px-4 border-b border-[#7b667c] shrink-0">
        <img src="/favicon.svg" alt="Icon" className="w-8 h-8 shrink-0" />
        {!isCollapsed && (
          <div className="ml-3 flex flex-col truncate">
            <span className="font-extrabold tracking-tight text-white text-2xl leading-none drop-shadow-sm">
              Colony
            </span>
            <span className="text-[10px] font-bold text-weaver-orange uppercase tracking-widest mt-1">
              Roomie Finder
            </span>
          </div>
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
                    'focus-visible:ring-2 focus-visible:ring-weaver-purple focus-visible:ring-offset-2',
                    isActive
                      ? 'bg-weaver-purple/40 text-white font-bold rounded-xl shadow-inner border border-weaver-purple/50'
                      : 'text-white/60 hover:text-white hover:bg-weaver-purple/20 rounded-xl hover:translate-x-1',
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

      {/* Trust & Completeness Widget */}
      {!isCollapsed && (
        <div className="mt-auto mb-6 px-4">
          <div className="bg-slate-900 rounded-xl p-5 border border-slate-800 shadow-md">
            <div className="flex justify-between items-end mb-3">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">Profile Trust</span>
              <span className="text-3xl font-black text-nest-accent leading-none">75%</span>
            </div>
            <div className="w-full bg-slate-800 rounded-full h-2 mb-4 overflow-hidden">
              <div className="bg-nest-accent h-full rounded-full w-[75%]" />
            </div>
            <p className="text-xs text-slate-400 leading-relaxed">
              Add <span className="text-slate-200 font-medium">lifestyle habits</span> to unlock better matches.
            </p>
          </div>
        </div>
      )}

      <div className="p-4 border-t border-[#7b667c]">
        <button
          type="button"
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="w-full flex items-center justify-center p-2 rounded-nest text-white/50 hover:text-white hover:bg-white/10 transition-all hover:scale-105 active:scale-95"
          aria-label={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        >
          {isCollapsed ? <ChevronRight size={20} /> : <ChevronLeft size={20} />}
        </button>
      </div>
    </aside>
  )
}
