'use client'

import type { JSX } from 'react'
import { popup } from '@tma.js/sdk-react'
import { cloneElement } from 'react'

interface ConfirmButtonProps {
  title?: string
  description: string
  confirmText?: string
  cancelText?: string
  onConfirm: () => void | Promise<void>
  children: JSX.Element
}

export function ConfirmButton({
  title,
  description,
  confirmText = 'Подтвердить',
  cancelText = 'Отмена',
  onConfirm,
  children,
}: ConfirmButtonProps) {
  async function handleClick() {
    if (popup) {
      await popup.show(
        {
          title,
          message: description,
          buttons: [
            { id: 'cancel', type: 'default', text: cancelText },
            { id: 'confirm', type: 'destructive', text: confirmText },
          ],
        },
      ).then((result) => {
        if (result === 'confirm') {
          return onConfirm()
        }
      })
      return
    }

    // eslint-disable-next-line no-alert
    const ok = window.confirm(
      `${title}${description ? `\n\n${description}` : ''}`,
    )
    if (ok) {
      await onConfirm()
    }
  }

  return cloneElement(children, {
    onClick: handleClick,
  })
}
