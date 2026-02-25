import React from 'react'

interface ZeroStateProps {
  isRelaxed: boolean
  relaxedFilterKeys: string[]
  onRetry: () => void
}

const FILTER_LABELS: Record<string, string> = {
  noiseTolerance: 'noise tolerance',
  guestFrequency: 'guest frequency',
  sleepTime: 'sleep schedule',
  cleanlinessLevel: 'cleanliness level',
}

export const ZeroState: React.FC<ZeroStateProps> = ({
  isRelaxed,
  relaxedFilterKeys,
  onRetry,
}) => {
  const humanKeys = relaxedFilterKeys
    .map((k) => FILTER_LABELS[k] ?? k)
    .join(', ')

  return (
    <div className="flex flex-col items-center justify-center py-24 px-6 text-center">
      {/* Illustration */}
      <div className="mb-6 flex h-24 w-24 items-center justify-center rounded-full bg-slate-800 ring-1 ring-slate-700 text-5xl select-none">
        🔍
      </div>

      {isRelaxed ? (
        <>
          <h2 className="text-lg font-bold text-slate-100">
            No perfect matches found
          </h2>
          <p className="mt-2 max-w-xs text-sm leading-relaxed text-slate-400">
            Showing closest compatible roommates.{' '}
            {humanKeys && (
              <span className="text-slate-500">
                We relaxed your <span className="text-slate-300">{humanKeys}</span> preferences to find more options.
              </span>
            )}
          </p>
        </>
      ) : (
        <>
          <h2 className="text-lg font-bold text-slate-100">
            No matches in your zone
          </h2>
          <p className="mt-2 max-w-xs text-sm leading-relaxed text-slate-400">
            Your filters are very specific right now. Try expanding your budget range or adjusting lifestyle preferences.
          </p>
        </>
      )}

      <button
        onClick={onRetry}
        className="mt-8 rounded-xl bg-blue-600 px-6 py-3 text-sm font-semibold text-white transition-all hover:bg-blue-500 active:scale-95"
      >
        Refresh Discovery
      </button>
    </div>
  )
}
