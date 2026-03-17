import React, { useState } from 'react'
import { FilterPill } from './FilterPill'
import { BottomSheet } from '@/components/ui/BottomSheet'
import type { DiscoveryFilters, TukZone } from '@/types'

type FilterType = 'zone' | 'budget' | 'filters' | null;
const BUDGET_RANGES = [
  { label: 'Below 3k', min: 0, max: 3000 },
  { label: '3k - 5k', min: 3000, max: 5000 },
  { label: '5k - 8k', min: 5000, max: 8000 },
  { label: '8k - 10k', min: 8000, max: 10000 },
  { label: 'Above 10k', min: 10000, max: 999999 },
]

interface FilterBarProps {
  filters: DiscoveryFilters
  availableZones: TukZone[]
  onApplyFilters: (nextFilters: Partial<DiscoveryFilters>) => void
}

export const FilterBar: React.FC<FilterBarProps> = ({
  filters,
  availableZones,
  onApplyFilters,
}) => {
  const [openSheet, setOpenSheet] = useState<FilterType>(null)
  const [tempZone, setTempZone] = useState<TukZone | null>(filters.zones?.[0] || null)
  const [tempBudgetRange, setTempBudgetRange] = useState<{
    min: number
    max: number
  } | null>(
    filters.minBudget !== null && filters.maxBudget !== null
      ? { min: filters.minBudget, max: filters.maxBudget }
      : null
  )
  const [tempCourseYear, setTempCourseYear] = useState<number | null>(filters.courseYear)
  const [tempMoveInMonth, setTempMoveInMonth] = useState<string>(filters.moveInMonth || '')
  const [tempHideConflicts, setTempHideConflicts] = useState<boolean>(
    filters.hideDealBreakerConflicts
  )

  const handleZoneApply = () => {
    onApplyFilters({ zones: tempZone ? [tempZone] : null })
    setOpenSheet(null)
  }

  const handleBudgetApply = () => {
    onApplyFilters({
      minBudget: tempBudgetRange?.min ?? null,
      maxBudget: tempBudgetRange?.max ?? null,
    })
    setOpenSheet(null)
  }

  const handleAdvancedApply = () => {
    onApplyFilters({
      courseYear: tempCourseYear,
      moveInMonth: tempMoveInMonth || null,
      hideDealBreakerConflicts: tempHideConflicts,
    })
    setOpenSheet(null)
  }

  return (
    <>
      {/* Filter Bar Container */}
      <div className="overflow-x-auto scrollbar-hide">
        <div className="flex gap-2">
          <FilterPill
            label={filters.zones?.[0] ? `Zone: ${filters.zones[0]} ▾` : 'Zone ▾'}
            isActive={!!filters.zones?.[0]}
            onClick={() => setOpenSheet('zone')}
          />
          <FilterPill
            label={
              filters.minBudget !== null && filters.maxBudget !== null
                ? `Budget: ${filters.minBudget}-${filters.maxBudget} ▾`
                : 'Budget ▾'
            }
            isActive={filters.minBudget !== null && filters.maxBudget !== null}
            onClick={() => setOpenSheet('budget')}
          />
          <FilterPill
            label="Advanced ▾"
            isActive={
              filters.courseYear !== null ||
              !!filters.moveInMonth ||
              !filters.hideDealBreakerConflicts
            }
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
          {availableZones.map((zone) => (
            <label
              key={zone}
              className="flex items-center gap-3 p-3 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800 cursor-pointer transition-colors"
            >
              <input
                type="radio"
                name="zone"
                value={zone}
                checked={tempZone === zone}
                onChange={(e) => setTempZone(e.target.value as TukZone)}
                className="w-4 h-4 text-brand-500 cursor-pointer"
              />
              <span className="text-sm font-medium text-slate-700 dark:text-slate-200">
                {zone}
              </span>
            </label>
          ))}

          <button
            type="button"
            onClick={() => setTempZone(null)}
            className="w-full rounded-lg border border-slate-200 dark:border-slate-700 px-3 py-2 text-sm text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800"
          >
            Clear Zone
          </button>
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
              className="flex items-center gap-3 p-3 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800 cursor-pointer transition-colors"
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
                className="w-4 h-4 text-brand-500 cursor-pointer"
              />
              <span className="text-sm font-medium text-slate-700 dark:text-slate-200">
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
        title="Advanced Filters"
        onApply={handleAdvancedApply}
      >
        <div className="space-y-4">
          <div>
            <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
              Move-in Month
            </label>
            <input
              type="month"
              value={tempMoveInMonth}
              onChange={(e) => setTempMoveInMonth(e.target.value)}
              className="w-full rounded-lg border border-slate-200 dark:border-slate-700 px-3 py-2 text-sm text-slate-700 dark:text-slate-100 bg-white dark:bg-slate-900/60 outline-none focus:border-brand-500"
            />
          </div>

          <div>
            <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
              Year of Study
            </label>
            <select
              value={tempCourseYear ?? ''}
              onChange={(e) =>
                setTempCourseYear(e.target.value ? Number(e.target.value) : null)
              }
              className="w-full rounded-lg border border-slate-200 dark:border-slate-700 px-3 py-2 text-sm text-slate-700 dark:text-slate-100 bg-white dark:bg-slate-900/60 outline-none focus:border-brand-500"
            >
              <option value="">Any year</option>
              <option value="1">Year 1</option>
              <option value="2">Year 2</option>
              <option value="3">Year 3</option>
              <option value="4">Year 4</option>
              <option value="5">Year 5</option>
              <option value="6">Year 6</option>
            </select>
          </div>

          <label className="flex items-center justify-between rounded-lg border border-slate-200 dark:border-slate-700 px-3 py-2">
            <span className="text-sm font-medium text-slate-700 dark:text-slate-200">
              Hide deal-breaker conflicts
            </span>
            <input
              type="checkbox"
              checked={tempHideConflicts}
              onChange={(e) => setTempHideConflicts(e.target.checked)}
              className="h-4 w-4"
            />
          </label>
        </div>
      </BottomSheet>
    </>
  )
}
