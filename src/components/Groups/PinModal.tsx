import { Modal, PinInput, VisuallyHidden } from '@telegram-apps/telegram-ui'
import { ModalHeader } from '@telegram-apps/telegram-ui/dist/components/Overlays/Modal/components/ModalHeader/ModalHeader'
import { useEffect, useState } from 'react'
import { Title } from './../../../node_modules/.pnpm/@telegram-apps+telegram-ui@_cd2a85882c477b95a917a92df729637e/node_modules/@telegram-apps/telegram-ui_tmp_28860/dist/components/Typography/Title/Title'

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
    <Modal onOpenChange={onOpenChange} open={open}>
      <VisuallyHidden>
        <ModalHeader>
          Ввод пароля
        </ModalHeader>
      </VisuallyHidden>
      <PinInput pinCount={4} value={value} onChange={setValue} label="Введите пароль" />
    </Modal>
  )
}
