import React from 'react'
import { X } from 'lucide-react'

interface BottomSheetProps {
  isOpen: boolean
  onClose: () => void
  title: string
  children: React.ReactNode
  onApply?: () => void
}

export const BottomSheet: React.FC<BottomSheetProps> = ({
  isOpen,
  onClose,
  title,
  children,
  onApply,
}) => {
  if (!isOpen) return null

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-40 bg-slate-900/50 backdrop-blur-sm"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Bottom Sheet Container */}
      <div className="fixed bottom-0 left-0 right-0 z-50 w-full">
        <div className="bg-white rounded-t-2xl p-6 max-w-md mx-auto shadow-lg">
          {/* Header */}
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-syne text-lg font-bold text-slate-900">
              {title}
            </h2>
            <button
              onClick={onClose}
              className="rounded-lg p-1 text-slate-500 hover:bg-slate-100 transition-colors outline-none focus-visible:ring-2 focus-visible:ring-blue-400"
              aria-label="Close"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* Content */}
          <div className="mb-4">
            {children}
          </div>

          {/* Apply Button */}
          {onApply && (
            <button
              onClick={onApply}
              className="w-full bg-blue-500 hover:bg-blue-600 text-white font-semibold rounded-lg py-3 transition-colors outline-none focus-visible:ring-2 focus-visible:ring-blue-400 focus-visible:ring-offset-2"
            >
              Apply Filter
            </button>
          )}
        </div>
      </div>
    </>
  )
}
