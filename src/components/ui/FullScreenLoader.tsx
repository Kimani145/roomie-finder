import React from 'react'

const FullScreenLoader: React.FC = () => {
  return (
    <div className="h-screen w-screen bg-slate-950 flex items-center justify-center">
      <div className="flex flex-col items-center gap-5 text-center">
        <img src="/favicon.svg" alt="Colony-Roomie Finder" className="h-12 w-12" />
        <div className="h-10 w-10 rounded-full border-2 border-weaver-purple/25 border-t-weaver-orange animate-spin" />
        <p className="text-sm font-medium text-weaver-orange">
          Weaving your matches...
        </p>
      </div>
    </div>
  )
}

export default FullScreenLoader
