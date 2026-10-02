'use client'

import { popup } from '@tma.js/sdk-react'
import { isTelegram } from '@/lib/platform'

interface ConfirmOptions {
  title?: string
  description: string
  confirmText?: string
  cancelText?: string
}

// Спрашивает подтверждение: в Telegram — нативным окном, в браузере — системным диалогом
export async function confirmAction({ title, description, cancelText = 'Отмена', confirmText = 'Подтвердить' }: ConfirmOptions): Promise<boolean> {
  if (isTelegram()) {
    const result = await popup.show({
      title,
      message: description,
      buttons: [
        { id: 'cancel', type: 'default', text: cancelText },
        { id: 'confirm', type: 'destructive', text: confirmText },
      ],
    })
    return result === 'confirm'
  }
  // eslint-disable-next-line no-alert
  return window.confirm(title ? `${title}\n\n${description}` : description)
}
