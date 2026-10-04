'use client'

import { useId, useState } from 'react'
import { Input } from '@/components/ui/input'
import { cn } from '@/lib/utils'

// Числовое поле, которое можно стереть целиком. Пока в поле пусто, наружу ничего не уходит,
// а при потере фокуса возвращается последнее значение.
export function NumberField({ label, value, onChange, onInvalidChange, min = 0, max, suffix, disabled, className }: {
  label: string
  value: number
  onChange: (value: number) => void
  onInvalidChange?: (invalid: boolean) => void
  min?: number
  max?: number
  suffix?: string
  disabled?: boolean
  className?: string
}) {
  const id = useId()
  const [text, setText] = useState<string | null>(null)
  const invalid = text !== null && !isValid(text)

  function isValid(raw: string) {
    const n = Number(raw)
    return raw.trim() !== '' && Number.isInteger(n) && n >= min && (max === undefined || n <= max)
  }

  return (
    <label htmlFor={id} className={cn('flex min-h-14 items-center gap-3 px-3.5 py-2', className)}>
      <span className="flex-1 text-base">{label}</span>
      <span className="flex items-center gap-1.5">
        <Input
          id={id}
          type="text"
          inputMode="numeric"
          pattern="[0-9]*"
          aria-invalid={invalid}
          disabled={disabled}
          className="h-10 w-24 rounded-lg text-right text-base tabular-nums"
          value={text ?? String(value)}
          onFocus={e => e.currentTarget.select()}
          onChange={(e) => {
            const raw = e.target.value.replace(/\D/g, '')
            setText(raw)
            const valid = isValid(raw)
            if (valid) {
              onChange(Number(raw))
            }
            onInvalidChange?.(!valid)
          }}
          onBlur={() => {
            setText(null)
            onInvalidChange?.(false)
          }}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              e.currentTarget.blur()
            }
          }}
        />
        {suffix && <span className="w-4 text-muted-foreground">{suffix}</span>}
      </span>
    </label>
  )
}
