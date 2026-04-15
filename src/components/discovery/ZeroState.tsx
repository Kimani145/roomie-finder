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
      <div className="mb-6 flex h-24 w-24 items-center justify-center rounded-full bg-brand-50 dark:bg-brand-900/20 ring-1 ring-brand-200 dark:ring-brand-700/40 text-5xl select-none">
        🔍
      </div>

      {isRelaxed ? (
        <>
          <h2 className="font-syne text-xl font-bold text-slate-900 dark:text-slate-50">
            Your colony is quiet right now.
          </h2>
          <p className="mt-2 max-w-xs text-sm leading-relaxed text-slate-500 dark:text-slate-400">
            Adjust your filters or check back later as more people join the nest.{' '}
            {humanKeys && (
              <span className="text-slate-500 dark:text-slate-400">
                We relaxed your{' '}
                <span className="font-medium text-slate-700 dark:text-slate-200">
                  {humanKeys}
                </span>{' '}
                preferences to find more options.
              </span>
            )}
          </p>
        </>
      ) : (
        <>
          <h2 className="font-syne text-xl font-bold text-slate-900 dark:text-slate-50">
            Your colony is quiet right now.
          </h2>
          <p className="mt-2 max-w-xs text-sm leading-relaxed text-slate-500 dark:text-slate-400">
            Adjust your filters or check back later as more people join the nest.
          </p>
        </>
      )}

      <button
        onClick={onRetry}
        className="mt-8 rounded-xl bg-brand-500 px-6 py-3 text-sm font-bold text-white transition-all hover:bg-brand-600 active:scale-95"
      >
        Refresh Discovery
      </button>
    </div>
  )
}
