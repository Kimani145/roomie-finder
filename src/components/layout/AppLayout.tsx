import React, { useState } from 'react'
import { useLocation } from 'react-router-dom'
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
  const isChatRoute = location.pathname.startsWith('/chat/')

  return (
    <div className="flex h-screen overflow-hidden bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-50">
      <Sidebar isCollapsed={isCollapsed} setIsCollapsed={setIsCollapsed} />

      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <Header isCollapsed={isCollapsed} />

        <main className="flex-1 overflow-y-auto bg-slate-50 dark:bg-slate-900">
          {children}
          {!isChatRoute && <div className="h-20 md:hidden" aria-hidden="true" />}
        </main>
      </div>

      <BottomNav />
    </div>
  )
}
