import React from 'react'
import { Header } from './Header'
import { BottomNav } from './BottomNav'
import { Sidebar } from './Sidebar'

// ─── AppLayout ────────────────────────────────────────────────────────────────
interface AppLayoutProps {
  children: React.ReactNode
}

export const AppLayout: React.FC<AppLayoutProps> = ({ children }) => {
  return (
    <div
      className="flex flex-col bg-slate-50 min-h-screen"
      style={{
        // Dynamic Viewport Height — prevents mobile browser bar glitches
        minHeight: '100dvh',
      }}
    >
      {/* Mobile shell */}
      <Header />

      {/* Responsive body: sidebar on desktop, normal flow on mobile */}
      <div className="flex flex-1">
        <Sidebar />
        <main className="flex-1 bg-slate-50">{children}</main>
      </div>

      {/* Mobile navigation */}
      <BottomNav />
    </div>
  )
}
