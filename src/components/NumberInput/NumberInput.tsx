'use client'

import type { ComponentProps } from 'react'
import { Input } from '@telegram-apps/telegram-ui'
import { useState } from 'react'

type NumberInputProps = Omit<ComponentProps<typeof Input>, 'type' | 'value' | 'onChange'> & {
  value: number
  onChange: (value: number) => void
  // Сообщает, что в поле сейчас пусто или не число — такое значение ещё не передано наружу
  onInvalidChange?: (invalid: boolean) => void
}

// Пока поле редактируется, храним введённый текст как есть, чтобы его можно было стереть полностью.
// Наружу уходят только корректные числа; при потере фокуса пустое поле возвращается к последнему значению.
export function NumberInput({ value, onChange, onBlur, onInvalidChange, ...props }: NumberInputProps) {
  const [text, setText] = useState<string | null>(null)

  return (
    <Input
      {...props}
      type="number"
      inputMode="numeric"
      value={text ?? value}
      onChange={(e) => {
        setText(e.target.value)
        const parsed = e.target.valueAsNumber
        const valid = e.target.value !== '' && Number.isFinite(parsed)
        if (valid) {
          onChange(parsed)
        }
        onInvalidChange?.(!valid)
      }}
      onBlur={(e) => {
        setText(null)
        onInvalidChange?.(false)
        onBlur?.(e)
      }}
    />
  )
}
