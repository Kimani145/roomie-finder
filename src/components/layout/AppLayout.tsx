import React, { useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { useLocation } from 'react-router-dom'
import { useNetwork } from '@/hooks/useNetwork'
import { useAuthStore } from '@/store/authStore'
import { Header } from './Header'
import { BottomNav } from './BottomNav'
import { Sidebar } from './Sidebar'

// ─── AppLayout ────────────────────────────────────────────────────────────────
interface AppLayoutProps {
  children: React.ReactNode
}

export const AppLayout: React.FC<AppLayoutProps> = ({ children }) => {
  const [isCollapsed, setIsCollapsed] = useState(false)
  const location = useLocation()
  const isOnline = useNetwork()
  const currentUser = useAuthStore((state) => state.currentUser)
  const isChatRoute = location.pathname.startsWith('/chat/')
  const showAuthenticatedChrome = Boolean(currentUser)

  return (
    <div className="flex h-screen overflow-hidden bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-50">
      {showAuthenticatedChrome && (
        <Sidebar isCollapsed={isCollapsed} setIsCollapsed={setIsCollapsed} />
      )}

      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <AnimatePresence>
          {!isOnline && (
            <motion.div
              initial={{ y: -50, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: -50, opacity: 0 }}
              transition={{ duration: 0.3, ease: 'easeInOut' }}
              className="sticky top-0 w-full bg-amber-100 text-amber-900 dark:bg-slate-800 dark:text-slate-200 text-xs font-semibold py-2 px-4 text-center flex items-center justify-center gap-2 z-50 relative shadow-md"
            >
              <div className="w-2 h-2 rounded-full bg-amber-500 animate-pulse shrink-0" />
              You are offline.
            </motion.div>
          )}
        </AnimatePresence>

        <Header isCollapsed={isCollapsed} />

        <main className="flex-1 overflow-y-auto bg-slate-50 dark:bg-slate-900">
          {children}
          {showAuthenticatedChrome && !isChatRoute && (
            <div className="h-20 md:hidden" aria-hidden="true" />
          )}
        </main>
      </div>

      {showAuthenticatedChrome && <BottomNav />}
    </div>
  )
}
