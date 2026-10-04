'use client'

import type { Game, GameSettings, Season } from '@/types/api'
import { useRouter } from 'next/navigation'
import { use, useEffect, useState } from 'react'
import { toast } from 'sonner'
import useSWR from 'swr'
import { ActionBar, ActionButton, ActionHint } from '@/components/ActionBar/ActionBar'
import { Section } from '@/components/app/Section'
import { SettingsFields } from '@/components/game/SettingsFields'
import { Page } from '@/components/Page'
import { Input } from '@/components/ui/input'
import { DEFAULT_FUND_PERCENT } from '@/domain/balances'
import { api } from '@/lib/api'
import { parseDateInput, todayInputValue } from '@/lib/dates'
import { getErrorMessage } from '@/lib/errors'
import { swrGetFetcher } from '@/lib/swrFetcher'

const DEFAULT_SETTINGS: GameSettings = { isFinal: false, firstEntryCost: 100, reEntryCost: 100, maxReEntries: 5, fundPercent: DEFAULT_FUND_PERCENT }

function defaultTitle(gamesCount: number, date: string) {
  const [, month, day] = date.split('-')
  return `Игра ${gamesCount + 1} · ${day}.${month}`
}

export default function NewGamePage({ params }: { params: Promise<{ seasonId: string, groupId: string }> }) {
  const { seasonId, groupId } = use(params)
  const router = useRouter()
  const { data: season } = useSWR<Season>(`/api/seasons/${seasonId}`, swrGetFetcher)
  const { data: games } = useSWR<Game[]>(`/api/games?seasonId=${seasonId}`, swrGetFetcher)

  const [title, setTitle] = useState<string | null>(null)
  const [date, setDate] = useState(todayInputValue)
  const [settings, setSettings] = useState<GameSettings | null>(null)
  const [invalidFields, setInvalidFields] = useState<Record<string, boolean>>({})
  const [loading, setLoading] = useState(false)

  // Настройки — как в последней обычной игре сезона
  useEffect(() => {
    if (games && !settings) {
      const previous = games.find(g => !g.settings.isFinal)
      setSettings(previous ? { ...previous.settings, isFinal: false } : DEFAULT_SETTINGS)
    }
  }, [games, settings])

  const effectiveTitle = title ?? defaultTitle(games?.length ?? 0, date)
  const createdAt = parseDateInput(date)
  const missing = !effectiveTitle.trim()
    ? 'Укажите название игры'
    : createdAt === null
      ? 'Укажите дату игры'
      : Object.values(invalidFields).some(Boolean) ? 'Заполните настройки игры' : null

  const create = async () => {
    if (missing || createdAt === null || !settings) {
      return
    }
    setLoading(true)
    try {
      const gameId = await api.post<string>('/api/games', { title: effectiveTitle.trim(), seasonId, settings, createdAt })
      router.replace(`/groups/${groupId}/seasons/${seasonId}/games/${gameId}`)
    }
    catch (e) {
      toast.error(`Не удалось создать игру: ${getErrorMessage(e)}`)
      setLoading(false)
    }
  }

  return (
    <Page title="Новая игра" subtitle={season?.title}>
      <Section>
        <label className="flex min-h-14 items-center gap-3 px-3.5 py-2">
          <span className="w-24 shrink-0 text-base">Название</span>
          <Input className="h-10 flex-1 rounded-lg text-base" maxLength={80} value={effectiveTitle} disabled={loading} onChange={e => setTitle(e.target.value)} />
        </label>
        <label className="flex min-h-14 items-center gap-3 px-3.5 py-2">
          <span className="w-24 shrink-0 text-base">Дата</span>
          <Input type="date" className="h-10 flex-1 rounded-lg text-base" value={date} disabled={loading} onChange={e => setDate(e.target.value)} />
        </label>
      </Section>

      <Section title="Настройки">
        {settings && (
          <SettingsFields
            settings={settings}
            seasonId={seasonId}
            disabled={loading}
            onChange={patch => setSettings({ ...settings, ...patch })}
            onInvalidChange={(field, invalid) => setInvalidFields(prev => ({ ...prev, [field]: invalid }))}
          />
        )}
      </Section>

      <ActionBar>
        {missing && <ActionHint>{missing}</ActionHint>}
        <ActionButton disabled={!!missing || !settings} loading={loading} onClick={create}>Создать игру</ActionButton>
      </ActionBar>
    </Page>
  )
}
