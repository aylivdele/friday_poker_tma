import { Modal, PinInput } from '@telegram-apps/telegram-ui'
import { useEffect, useState } from 'react'

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
    <>
      <Modal header="Пароль" onOpenChange={onOpenChange} open={open} dismissible>
        <PinInput pinCount={4} value={value} onChange={setValue} label="Введите пароль" />
      </Modal>
    </>
  )
}
