import React from 'react'

const SplashScreen: React.FC = () => {
  return (
    <div className="fixed inset-0 flex flex-col items-center justify-center bg-slate-50 dark:bg-slate-900 z-50">
      <div className="flex flex-col items-center gap-6">
        <div className="text-3xl font-syne font-bold text-weaver-purple dark:text-weaver-orange">
          Colony
        </div>
        <div className="h-10 w-10 rounded-full border-2 border-weaver-purple/30 border-t-weaver-purple animate-spin" />
        <span className="text-sm text-slate-400">Weaving your matches…</span>
      </div>
    </div>
  )
}

export default SplashScreen
