import { PinInput } from '@telegram-apps/telegram-ui'
import { useEffect, useState } from 'react'

// Ввод PIN из 4 цифр. Отправляется автоматически, когда введены все цифры
export function PinModal({ open, onPinEnter, label = 'Введите PIN группы' }: {
  open: boolean
  onOpenChange: (isOpen: boolean) => void
  onPinEnter: (pin: number[]) => void
  label?: string
}) {
  const [value, setValue] = useState<number[]>([])

  useEffect(() => {
    if (!open) {
      setValue([])
    }
  }, [open])

  useEffect(() => {
    if (value.length === 4) {
      onPinEnter(value)
    }
  }, [value])

  if (!open) {
    return null
  }

  return (
    <PinInput pinCount={4} value={value} onChange={setValue} label={label} />
  )
}
