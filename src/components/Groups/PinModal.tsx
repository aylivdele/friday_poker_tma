import { Headline, Input, Modal } from '@telegram-apps/telegram-ui'
import { useEffect, useState } from 'react'

function splitNumber(numStr?: string): number[] {
  let num = Number.parseInt(numStr ?? '')
  if (Number.isNaN(num)) {
    return []
  }

  const result = []
  do {
    result.push(num % 10)
    num = Math.floor(num / 10)
  } while (num > 0)
  return result
}

export function PinModal({ open, onOpenChange, onPinEnter }: { open: boolean, onOpenChange: (isOpen: boolean) => void, onPinEnter: (pin: number[]) => void }) {
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

  return (
    <Modal header={<Headline>Ввод пароля</Headline>} onOpenChange={onOpenChange} open={open}>
      {/* <PinInput pinCount={4} value={value} onChange={setValue} label="Введите пароль" /> */}
      <Input type="number" value={value.join('')} onChange={e => setValue(splitNumber(e.target.value))}></Input>
    </Modal>
  )
}
