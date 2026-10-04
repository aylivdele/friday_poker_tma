'use client'

import type { Me } from '@/types/api'
import { BellIcon, Loader2Icon } from 'lucide-react'
import { toast } from 'sonner'
import useSWR from 'swr'
import { RowText, Section } from '@/components/app/Section'
import { Button } from '@/components/ui/button'
import { Switch } from '@/components/ui/switch'
import { useAllowBotMessages } from '@/hooks/useAllowBotMessages'
import { api } from '@/lib/api'
import { getErrorMessage } from '@/lib/errors'
import { haptic } from '@/lib/haptics'
import { isTelegram } from '@/lib/platform'
import { swrGetFetcher } from '@/lib/swrFetcher'

// Итоги игр от бота: включение и разрешение боту писать
export function NotificationSettings() {
  const { data: me, mutate } = useSWR<Me>('/api/me', swrGetFetcher)
  const { allow, busy } = useAllowBotMessages()

  if (!me?.hasTelegram) {
    return null
  }
  const { games, botCanWrite } = me.notifications

  const toggle = async (checked: boolean) => {
    haptic('select')
    const previous = me
    mutate({ ...me, notifications: { ...me.notifications, games: checked } }, { revalidate: false })
    try {
      await mutate(await api.put<Me>('/api/me/notifications', { games: checked }), { revalidate: false })
    }
    catch (e) {
      mutate(previous, { revalidate: false })
      toast.error(`Не удалось сохранить: ${getErrorMessage(e)}`)
    }
  }

  return (
    <Section title="Уведомления">
      <label className="flex min-h-14 cursor-pointer items-center gap-3 px-3.5 py-2.5">
        <span className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-muted text-muted-foreground">
          <BellIcon className="size-5" />
        </span>
        <RowText title="Итоги игр в Telegram" subtitle="Результаты и кто кому переводит" className="[&>span]:whitespace-normal" />
        <Switch checked={games} onCheckedChange={toggle} aria-label="Итоги игр в Telegram" />
      </label>
      {games && botCanWrite !== true && (
        isTelegram()
          ? (
              <div className="flex items-center gap-3 px-3.5 py-2.5">
                <RowText
                  title={botCanWrite === false ? 'Сообщения не доходят' : 'Разрешите боту писать вам'}
                  subtitle="Иначе Telegram не пропустит сообщения от бота"
                  className="[&>span]:whitespace-normal"
                />
                <Button variant="secondary" className="h-9 rounded-xl" disabled={busy} onClick={allow}>
                  {busy && <Loader2Icon className="size-4 animate-spin" />}
                  Разрешить
                </Button>
              </div>
            )
          : <p className="px-3.5 py-3 text-sm text-muted-foreground">Чтобы сообщения доходили, откройте приложение в Telegram и разрешите боту писать вам в профиле.</p>
      )}
    </Section>
  )
}
