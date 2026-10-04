import { hapticFeedback } from '@tma.js/sdk-react'
import { isTelegram } from './platform'

type Haptic = 'tap' | 'select' | 'success' | 'warning' | 'error'

// Тактильный отклик в Telegram; в браузере ничего не делает
export function haptic(kind: Haptic) {
  if (!isTelegram()) {
    return
  }
  try {
    if (kind === 'tap') {
      hapticFeedback.impactOccurred('light')
    }
    else if (kind === 'select') {
      hapticFeedback.selectionChanged()
    }
    else {
      hapticFeedback.notificationOccurred(kind)
    }
  }
  catch {}
}
