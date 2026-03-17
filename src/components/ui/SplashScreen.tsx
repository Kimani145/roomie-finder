import React from 'react'

const SplashScreen: React.FC = () => {
  return (
    <div className="fixed inset-0 flex flex-col items-center justify-center bg-slate-50 dark:bg-slate-900 z-50">
      <div className="flex flex-col items-center gap-6">
        <div className="text-3xl font-syne font-bold text-brand-600 dark:text-brand-400">
          Roomie Finder
        </div>
        <div className="h-10 w-10 rounded-full border-2 border-brand-500/30 border-t-brand-500 animate-spin" />
      </div>
    </div>
  )
}

export default SplashScreen
