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
  Shield,
  Heart,
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
  { path: '/saved', label: 'Wishlist', icon: Heart },
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
    { path: '/security', label: 'Security', icon: Shield },
  ]

  return (
    <aside
      className={[
        'sidebar-surface z-20 hidden h-full shrink-0 self-stretch overflow-y-auto border-r border-brand-800/40 shadow-lg transition-all duration-300 hover:brightness-105 md:flex md:flex-col',
        isCollapsed ? 'w-20' : 'w-64',
        className ?? '',
      ].join(' ')}
    >
      <div className="flex items-center h-16 px-4 border-b border-brand-800/40 shrink-0">
        <img src="/favicon.svg" alt="Icon" className="w-8 h-8 shrink-0" />
        {!isCollapsed && (
          <div className="ml-3 flex flex-col truncate">
            <span className="font-extrabold tracking-tight text-white text-2xl leading-none drop-shadow-sm">
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
                    'focus-visible:ring-2 focus-visible:ring-brand-400 focus-visible:ring-offset-2',
                    isActive
                      ? 'bg-brand-500/30 text-white font-bold rounded-xl shadow-inner border border-brand-400/30'
                      : 'text-white/60 hover:text-white hover:bg-brand-500/15 rounded-xl hover:translate-x-1',
                  ].join(' ')
                }
              >
                <Icon className="h-5 w-5 shrink-0" aria-hidden="true" />
                {!isCollapsed && (
                  <span className="whitespace-nowrap overflow-hidden">{label}</span>
                )}
                {!isCollapsed && path === '/messages' && unreadMessages > 0 && (
                  <span className="ml-auto min-w-5 h-5 px-1 rounded-full bg-danger-500 text-white text-[10px] font-bold flex items-center justify-center">
                    {unreadMessages > 99 ? '99+' : unreadMessages}
                  </span>
                )}
                {!isCollapsed && path === '/matches' && unreadMatches > 0 && (
                  <span className="ml-auto min-w-5 h-5 px-1 rounded-full bg-danger-500 text-white text-[10px] font-bold flex items-center justify-center">
                    {unreadMatches > 99 ? '99+' : unreadMatches}
                  </span>
                )}
                {isCollapsed && path === '/messages' && unreadMessages > 0 && (
                  <span className="absolute right-2 top-2 min-w-5 h-5 px-1 rounded-full bg-danger-500 text-white text-[10px] font-bold flex items-center justify-center">
                    {unreadMessages > 99 ? '99+' : unreadMessages}
                  </span>
                )}
                {isCollapsed && path === '/matches' && unreadMatches > 0 && (
                  <span className="absolute right-2 top-2 min-w-5 h-5 px-1 rounded-full bg-danger-500 text-white text-[10px] font-bold flex items-center justify-center">
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
          <div className="bg-brand-900/80 rounded-xl p-5 border border-brand-800/60 shadow-md">
            <div className="flex justify-between items-end mb-3">
              <span className="text-xs font-bold text-[#F9FAFB] uppercase tracking-widest mb-1">Profile Trust</span>
              <span className="text-3xl font-black text-[#F9FAFB] leading-none">75%</span>
            </div>
            <div className="w-full bg-[#1F2937] rounded-full h-2 mb-4 overflow-hidden">
              <div className="bg-[#22C55E] h-full rounded-full w-[75%]" />
            </div>
            <p className="text-xs text-[#94A3B8] leading-relaxed">
              Add <span className="text-brand-200 font-medium">lifestyle habits</span> to unlock better matches.
            </p>
          </div>
        </div>
      )}

      <div className="p-4 border-t border-brand-800/40">
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
