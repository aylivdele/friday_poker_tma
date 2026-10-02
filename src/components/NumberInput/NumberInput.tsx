'use client'

import type { ComponentProps } from 'react'
import { Input } from '@telegram-apps/telegram-ui'
import { useState } from 'react'

type NumberInputProps = Omit<ComponentProps<typeof Input>, 'type' | 'value' | 'onChange'> & {
  value: number
  onChange: (value: number) => void
}

// Пока поле редактируется, храним введённый текст как есть, чтобы его можно было стереть полностью.
// Наружу уходят только корректные числа; при потере фокуса пустое поле возвращается к последнему значению.
export function NumberInput({ value, onChange, onBlur, ...props }: NumberInputProps) {
  const [text, setText] = useState<string | null>(null)

  return (
    <Input
      {...props}
      type="number"
      value={text ?? value}
      onChange={(e) => {
        setText(e.target.value)
        const parsed = e.target.valueAsNumber
        if (e.target.value !== '' && Number.isFinite(parsed)) {
          onChange(parsed)
        }
      }}
      onBlur={(e) => {
        setText(null)
        onBlur?.(e)
      }}
    />
  )
}
