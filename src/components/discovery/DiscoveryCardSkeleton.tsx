import React from 'react'

export const DiscoveryCardSkeleton: React.FC = () => (
  <div className="flex flex-col overflow-hidden rounded-2xl bg-slate-800 ring-1 ring-slate-700/60 animate-pulse">
    {/* Photo placeholder */}
    <div className="h-52 w-full bg-slate-700" />

    {/* Body */}
    <div className="flex flex-col gap-4 p-4">
      {/* Name row */}
      <div className="flex items-start justify-between">
        <div className="space-y-2">
          <div className="h-5 w-32 rounded-lg bg-slate-700" />
          <div className="h-3.5 w-24 rounded-lg bg-slate-700" />
        </div>
        <div className="h-6 w-20 rounded-full bg-slate-700" />
      </div>

      {/* Tags */}
      <div className="flex gap-2">
        <div className="h-6 w-24 rounded-full bg-slate-700" />
        <div className="h-6 w-28 rounded-full bg-slate-700" />
        <div className="h-6 w-20 rounded-full bg-slate-700" />
      </div>

      {/* Budget bar */}
      <div className="space-y-2">
        <div className="flex justify-between">
          <div className="h-3 w-20 rounded bg-slate-700" />
          <div className="h-3 w-24 rounded bg-slate-700" />
        </div>
        <div className="h-2 w-full rounded-full bg-slate-700" />
      </div>

      {/* Buttons */}
      <div className="flex gap-3 pt-1">
        <div className="h-10 flex-1 rounded-xl bg-slate-700" />
        <div className="h-10 flex-1 rounded-xl bg-slate-700" />
      </div>
    </div>
  </div>
)
