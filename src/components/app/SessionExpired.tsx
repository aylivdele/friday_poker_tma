'use client'

import { miniApp } from '@tma.js/sdk-react'
import { RotateCwIcon } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useSessionStore } from '@/stores/sessionStore'

function closeApp() {
  try {
    miniApp.close()
  }
  catch {
    // Закрыть не дали: перезагрузка хотя бы повторит загрузку данных
    window.location.reload()
  }
}

// Telegram отдаёт подписанные данные входа при запуске; если приложение держали открытым
// дольше их срока, сервер их не примет — поможет только перезапуск
export function SessionExpired() {
  const expired = useSessionStore(s => s.telegramExpired)
  if (!expired) {
    return null
  }

  return (
    <div role="alertdialog" aria-modal aria-labelledby="session-expired-title" className="fixed inset-0 z-100 flex flex-col items-center justify-center gap-3 bg-background px-8 text-center">
      <span className="flex size-14 items-center justify-center rounded-2xl bg-secondary text-secondary-foreground">
        <RotateCwIcon className="size-7" />
      </span>
      <h2 id="session-expired-title" className="text-lg font-semibold">Перезапустите приложение</h2>
      <p className="max-w-80 text-sm text-muted-foreground">Данные входа от Telegram устарели — так бывает, если приложение долго не закрывали. Закройте его и откройте снова.</p>
      <Button size="lg" className="mt-2 h-11 rounded-xl px-5 text-base" onClick={closeApp}>Закрыть приложение</Button>
    </div>
  )
}
