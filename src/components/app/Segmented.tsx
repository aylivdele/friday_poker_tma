'use client'

import type { ReactNode } from 'react'
import { haptic } from '@/lib/haptics'
import { cn } from '@/lib/utils'

// Переключатель вкладок «Таблица / Игры»
export function Segmented<T extends string>({ value, onChange, options, className }: {
  value: T
  onChange: (value: T) => void
  options: { value: T, label: ReactNode }[]
  className?: string
}) {
  return (
    <div role="tablist" className={cn('mx-4 grid gap-1 rounded-xl bg-muted p-1', className)} style={{ gridTemplateColumns: `repeat(${options.length}, minmax(0, 1fr))` }}>
      {options.map(option => (
        <button
          key={option.value}
          type="button"
          role="tab"
          aria-selected={value === option.value}
          onClick={() => {
            haptic('select')
            onChange(option.value)
          }}
          className={cn(
            'h-9 rounded-lg text-sm font-medium text-muted-foreground transition-colors',
            value === option.value && 'bg-card font-semibold text-foreground shadow-sm',
          )}
        >
          {option.label}
        </button>
      ))}
    </div>
  )
}
