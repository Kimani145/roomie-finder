import React from 'react'

const SplashScreen: React.FC = () => {
  return (
    <div className="fixed inset-0 flex flex-col items-center justify-center bg-slate-50 dark:bg-surface-dark-bg z-50">
      <div className="flex flex-col items-center gap-6 text-center">
        <div className="text-3xl font-syne font-bold text-brand-600 dark:text-brand-400">
          Roomie Finder
        </div>
        <div className="h-10 w-10 rounded-full border-2 border-brand-600/25 border-t-brand-400 animate-spin" />
        <p className="text-sm font-medium text-brand-600 dark:text-brand-300">
          Finding your matches...
        </p>
      </div>
    </div>
  )
}

export default SplashScreen
