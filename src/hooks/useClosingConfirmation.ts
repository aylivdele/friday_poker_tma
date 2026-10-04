import { closingBehavior } from '@tma.js/sdk-react'
import { useEffect } from 'react'
import { isTelegram } from '@/lib/platform'

// Пока есть несохранённые изменения, Telegram спросит подтверждение при закрытии приложения,
// а браузер — при уходе со страницы
export function useClosingConfirmation(enabled: boolean) {
  useEffect(() => {
    if (!enabled) {
      return
    }
    if (isTelegram()) {
      try {
        closingBehavior.enableConfirmation()
      }
      catch {}
      return () => {
        try {
          closingBehavior.disableConfirmation()
        }
        catch {}
      }
    }
    const onBeforeUnload = (e: BeforeUnloadEvent) => e.preventDefault()
    window.addEventListener('beforeunload', onBeforeUnload)
    return () => window.removeEventListener('beforeunload', onBeforeUnload)
  }, [enabled])
}
