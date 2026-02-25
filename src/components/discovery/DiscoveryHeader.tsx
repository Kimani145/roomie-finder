import React from 'react'
import { Link } from 'react-router-dom'
import { useAuthStore } from '@/store/authStore'

interface DiscoveryHeaderProps {
  onFilterToggle: () => void
  isFilterOpen: boolean
}

function getInitials(name: string): string {
  return name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2)
}

export const DiscoveryHeader: React.FC<DiscoveryHeaderProps> = ({
  onFilterToggle,
  isFilterOpen,
}) => {
  const { currentUser } = useAuthStore()

  return (
    <header className="sticky top-0 z-30 border-b border-slate-700/60 bg-slate-900/90 backdrop-blur-md">
      <div className="mx-auto flex max-w-2xl items-center justify-between px-4 py-3">

        {/* ── Left: Avatar + zone ──────────────────────────────────────── */}
        <div className="flex items-center gap-3">
          <Link
            to="/profile"
            className="relative flex-shrink-0 overflow-hidden rounded-full ring-2 ring-slate-600 transition-all hover:ring-blue-500"
            style={{ width: 38, height: 38 }}
            aria-label="My profile"
          >
            {currentUser?.photoURL ? (
              <img
                src={currentUser.photoURL}
                alt="Your avatar"
                className="h-full w-full object-cover"
              />
            ) : (
              <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-blue-600 to-blue-800 text-xs font-bold text-white">
                {currentUser ? getInitials(currentUser.displayName) : '?'}
              </div>
            )}
          </Link>

          <div className="flex flex-col leading-tight">
            <span className="text-[11px] font-medium uppercase tracking-widest text-slate-500">
              Discovering in
            </span>
            <span className="flex items-center gap-1 text-sm font-semibold text-slate-200">
              <svg
                className="h-3.5 w-3.5 text-blue-400"
                fill="currentColor"
                viewBox="0 0 20 20"
                aria-hidden="true"
              >
                <path
                  fillRule="evenodd"
                  d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z"
                  clipRule="evenodd"
                />
              </svg>
              {currentUser?.zone ?? '—'}
            </span>
          </div>
        </div>

        {/* ── Right: Wordmark + filter toggle ─────────────────────────── */}
        <div className="flex items-center gap-3">
          <span className="hidden text-base font-extrabold tracking-tight text-slate-100 sm:block">
            Roomie<span className="text-blue-400">.</span>
          </span>

          <button
            onClick={onFilterToggle}
            aria-label="Toggle filters"
            aria-expanded={isFilterOpen}
            className={`flex items-center gap-1.5 rounded-xl px-3 py-2 text-xs font-semibold uppercase tracking-wider transition-all duration-200 ${
              isFilterOpen
                ? 'bg-blue-600 text-white'
                : 'bg-slate-800 text-slate-400 ring-1 ring-slate-700 hover:bg-slate-700 hover:text-slate-200'
            }`}
          >
            <svg
              className="h-3.5 w-3.5"
              fill="none"
              stroke="currentColor"
              strokeWidth={2.5}
              viewBox="0 0 24 24"
              aria-hidden="true"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4"
              />
            </svg>
            Filters
          </button>
        </div>
      </div>
    </header>
  )
}
