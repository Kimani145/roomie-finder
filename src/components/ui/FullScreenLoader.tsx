import React from 'react'

const FullScreenLoader: React.FC = () => {
  return (
    <div className="h-screen w-screen bg-slate-950 flex items-center justify-center">
      <div className="flex flex-col items-center gap-5">
        <img src="/assets/favicon.svg" alt="Roomie Finder" className="h-12 w-12" />
        <div className="h-10 w-10 rounded-full border-2 border-brand-400/30 border-t-brand-400 animate-spin" />
      </div>
    </div>
  )
}

export default FullScreenLoader