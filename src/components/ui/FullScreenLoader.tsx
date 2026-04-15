import React from 'react'

const FullScreenLoader: React.FC = () => {
  return (
    <div className="h-screen w-screen bg-slate-950 flex items-center justify-center">
      <div className="flex flex-col items-center gap-5">
        <img src="/colony-logo.svg" alt="Colony" className="h-12 w-12" />
        <div className="h-10 w-10 rounded-full border-2 border-weaver-orange/30 border-t-weaver-orange animate-spin" />
        <span className="text-sm text-slate-400">Weaving your matches…</span>
      </div>
    </div>
  )
}

export default FullScreenLoader