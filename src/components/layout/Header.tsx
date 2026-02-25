import React from 'react'
import { Link, useLocation } from 'react-router-dom'
import { ChevronDown } from 'lucide-react'
import { useAuthStore } from '@/store/authStore'

// ─── Header ───────────────────────────────────────────────────────────────────
export const Header: React.FC = () => {
  const location = useLocation()
  const { currentUser } = useAuthStore()

  // Hide on onboarding and full-screen chat
  const shouldHide =
    location.pathname === '/onboarding' ||
    location.pathname.startsWith('/chat/')

  if (shouldHide) return null

  return (
    <header className="sticky top-0 z-30 border-b border-slate-200 bg-slate-50/80 backdrop-blur-md">
      <div className="mx-auto flex h-14 max-w-2xl items-center justify-between px-4">
        {/* ── Left: Brand logo + subtitle ────────────────────────────────── */}
        <Link
          to="/discover"
          className="flex flex-col outline-none transition-all duration-150 active:scale-[0.98] focus-visible:ring-2 focus-visible:ring-blue-400 focus-visible:ring-offset-2 rounded-lg px-2 py-1"
        >
          <div className="flex items-center gap-1">
            <span className="font-display text-lg font-bold tracking-tight text-slate-900">
              Roomie Finder
            </span>
            <span className="text-[10px] text-slate-400">©</span>
          </div>
          <span className="text-[10px] font-medium text-slate-500">
            Ranked by Compatibility
          </span>
        </Link>

        {/* ── Right: Zone dropdown ───────────────────────────────────────── */}
        {currentUser && (
          <button
            type="button"
            className="flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-sm font-semibold text-slate-700 outline-none transition-all duration-150 hover:bg-slate-50 active:scale-[0.98] focus-visible:ring-2 focus-visible:ring-blue-400"
            aria-label={`Current location: ${currentUser.zone}. Click to change.`}
          >
            <span>{currentUser.zone}</span>
            <ChevronDown className="h-3.5 w-3.5 text-slate-400" aria-hidden="true" />
          </button>
        )}
      </div>
    </header>
  )
}
