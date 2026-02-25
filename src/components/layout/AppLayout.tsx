import React from 'react'
import { Header } from './Header'
import { BottomNav } from './BottomNav'

// ─── AppLayout ────────────────────────────────────────────────────────────────
interface AppLayoutProps {
  children: React.ReactNode
}

export const AppLayout: React.FC<AppLayoutProps> = ({ children }) => {
  return (
    <div
      className="flex flex-col bg-slate-50"
      style={{
        // Dynamic Viewport Height — prevents mobile browser bar glitches
        minHeight: '100dvh',
      }}
    >
      {/* Header (sticky top, hides on onboarding/chat) */}
      <Header />

      {/* Main content area */}
      <main className="flex-1">{children}</main>

      {/* Bottom navigation (fixed bottom, hides on onboarding/chat) */}
      <BottomNav />
    </div>
  )
}
