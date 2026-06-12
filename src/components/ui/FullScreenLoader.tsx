import React from 'react'

const FullScreenLoader: React.FC = () => {
  return (
    <div className="h-screen w-screen bg-surface-dark-bg flex items-center justify-center">
      <div className="flex flex-col items-center gap-5 text-center">
        <img src="/favicon.svg" alt="Colony-Roomie Finder" className="h-12 w-12" />
        <div className="h-10 w-10 rounded-full border-2 border-brand-600/25 border-t-brand-400 animate-spin" />
        <p className="text-sm font-medium text-brand-300">
          Finding your matches...
        </p>
      </div>
    </div>
  )
}

export default FullScreenLoader
