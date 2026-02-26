import React, { useState } from 'react'
import { FilterPill } from './FilterPill'
import { BottomSheet } from '@/components/ui/BottomSheet'

type FilterType = 'zone' | 'budget' | 'filters' | null

const ZONES = ['Ruiru', 'Juja', 'Kahawa', 'Ngara', 'Pangani']
const BUDGET_RANGES = [
  { label: 'Below 3k', min: 0, max: 3000 },
  { label: '3k - 5k', min: 3000, max: 5000 },
  { label: '5k - 8k', min: 5000, max: 8000 },
  { label: '8k - 10k', min: 8000, max: 10000 },
  { label: 'Above 10k', min: 10000, max: 999999 },
]

interface FilterBarProps {
  onZoneChange?: (zone: string | null) => void
  onBudgetChange?: (min: number, max: number) => void
  selectedZone?: string | null
  selectedBudgetRange?: { min: number; max: number } | null
}

export const FilterBar: React.FC<FilterBarProps> = ({
  onZoneChange,
  onBudgetChange,
  selectedZone,
  selectedBudgetRange,
}) => {
  const [openSheet, setOpenSheet] = useState<FilterType>(null)
  const [tempZone, setTempZone] = useState<string | null>(selectedZone || null)
  const [tempBudgetRange, setTempBudgetRange] = useState<{
    min: number
    max: number
  } | null>(selectedBudgetRange || null)

  const handleZoneApply = () => {
    onZoneChange?.(tempZone)
    setOpenSheet(null)
  }

  const handleBudgetApply = () => {
    if (tempBudgetRange) {
      onBudgetChange?.(tempBudgetRange.min, tempBudgetRange.max)
    }
    setOpenSheet(null)
  }

  return (
    <>
      {/* Filter Bar Container */}
      <div className="bg-white border-b border-slate-200 px-4 py-3 overflow-x-auto scrollbar-hide">
        <div className="flex gap-2">
          <FilterPill
            label={selectedZone ? `Zone: ${selectedZone} ▾` : 'Zone ▾'}
            isActive={!!selectedZone}
            onClick={() => setOpenSheet('zone')}
          />
          <FilterPill
            label={
              selectedBudgetRange
                ? `Budget: ${selectedBudgetRange.min}-${selectedBudgetRange.max} ▾`
                : 'Budget ▾'
            }
            isActive={!!selectedBudgetRange}
            onClick={() => setOpenSheet('budget')}
          />
          <FilterPill
            label="Filters ▾"
            isActive={false}
            onClick={() => setOpenSheet('filters')}
          />
        </div>
      </div>

      {/* Zone Filter Sheet */}
      <BottomSheet
        isOpen={openSheet === 'zone'}
        onClose={() => setOpenSheet(null)}
        title="Select Preferred Zone"
        onApply={handleZoneApply}
      >
        <div className="space-y-2">
          {ZONES.map((zone) => (
            <label
              key={zone}
              className="flex items-center gap-3 p-3 rounded-lg hover:bg-slate-50 cursor-pointer transition-colors"
            >
              <input
                type="radio"
                name="zone"
                value={zone}
                checked={tempZone === zone}
                onChange={(e) => setTempZone(e.target.value)}
                className="w-4 h-4 text-blue-500 cursor-pointer"
              />
              <span className="text-sm font-medium text-slate-700">{zone}</span>
            </label>
          ))}
        </div>
      </BottomSheet>

      {/* Budget Filter Sheet */}
      <BottomSheet
        isOpen={openSheet === 'budget'}
        onClose={() => setOpenSheet(null)}
        title="Select Budget Range"
        onApply={handleBudgetApply}
      >
        <div className="space-y-2">
          {BUDGET_RANGES.map((range) => (
            <label
              key={range.label}
              className="flex items-center gap-3 p-3 rounded-lg hover:bg-slate-50 cursor-pointer transition-colors"
            >
              <input
                type="radio"
                name="budget"
                value={range.label}
                checked={
                  tempBudgetRange?.min === range.min &&
                  tempBudgetRange?.max === range.max
                }
                onChange={() =>
                  setTempBudgetRange({ min: range.min, max: range.max })
                }
                className="w-4 h-4 text-blue-500 cursor-pointer"
              />
              <span className="text-sm font-medium text-slate-700">
                {range.label}
              </span>
            </label>
          ))}
        </div>
      </BottomSheet>

      {/* General Filters Sheet */}
      <BottomSheet
        isOpen={openSheet === 'filters'}
        onClose={() => setOpenSheet(null)}
        title="More Filters"
      >
        <div className="text-sm text-slate-600 text-center py-6">
          Additional filter options coming soon
        </div>
      </BottomSheet>
    </>
  )
}
