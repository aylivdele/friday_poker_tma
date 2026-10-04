'use client'

import type { Me } from '@/types/api'
import { BellIcon, Loader2Icon } from 'lucide-react'
import { useState } from 'react'
import useSWR from 'swr'
import { Button } from '@/components/ui/button'
import { useAllowBotMessages } from '@/hooks/useAllowBotMessages'
import { isTelegram } from '@/lib/platform'
import { swrGetFetcher } from '@/lib/swrFetcher'

const DISMISSED_KEY = 'fp-bot-prompt-dismissed'

function readDismissed() {
  try {
    return localStorage.getItem(DISMISSED_KEY) === '1'
  }
  catch {
    return false
  }
}

// Предложение на вкладке «Игры»: без разрешения бот не сможет присылать итоги
export function BotMessagesPrompt() {
  const { data: me } = useSWR<Me>(isTelegram() ? '/api/me' : null, swrGetFetcher)
  const [dismissed, setDismissed] = useState(readDismissed)
  const { allow, busy } = useAllowBotMessages()

  if (!me || dismissed || !me.notifications.games || me.notifications.botCanWrite === true) {
    return null
  }

  const dismiss = () => {
    setDismissed(true)
    try {
      localStorage.setItem(DISMISSED_KEY, '1')
    }
    catch {}
  }

  return (
    <div className="px-4 pt-4">
      <div className="flex gap-3 rounded-2xl bg-card p-4">
        <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-secondary text-secondary-foreground">
          <BellIcon className="size-5" />
        </span>
        <div className="flex min-w-0 flex-1 flex-col gap-1">
          <p className="font-semibold">Итоги игр — в Telegram</p>
          <p className="text-sm text-muted-foreground">Разрешите боту писать вам: после игры он пришлёт результаты и кто кому переводит</p>
          <div className="flex gap-2 pt-2">
            <Button className="h-9 rounded-xl" disabled={busy} onClick={async () => (await allow()) && dismiss()}>
              {busy && <Loader2Icon className="size-4 animate-spin" />}
              Разрешить
            </Button>
            <Button variant="ghost" className="h-9 rounded-xl text-muted-foreground" onClick={dismiss}>Не сейчас</Button>
          </div>
        </div>
      </div>
    </div>
  )
}
