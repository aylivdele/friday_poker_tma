'use client'

import type { GameSettings } from '@/types/api'
import { Input, Section, Subheadline } from '@telegram-apps/telegram-ui'
import { useRouter } from 'next/navigation'
import { use, useState } from 'react'
import toast from 'react-hot-toast'
import { ActionBar, ActionButton, ActionHint } from '@/components/ActionBar/ActionBar'
import GameSettingsEditor from '@/components/Games/GameSettingsEditor'
import { Page } from '@/components/Page'
import { api } from '@/lib/api'
import { parseDateInput, todayInputValue } from '@/lib/dates'
import { getErrorMessage } from '@/lib/errors'

export default function NewGamePage({ params }: { params: Promise<{ seasonId: string, groupId: string }> }) {
  const { seasonId, groupId } = use(params)
  const [title, setTitle] = useState('')
  const [date, setDate] = useState(todayInputValue)
  const [settings, setSettings] = useState<GameSettings>({ isFinal: false, firstEntryCost: 100, reEntryCost: 100, maxReEntries: 5 })
  const [settingsValid, setSettingsValid] = useState(true)
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  const createdAt = parseDateInput(date)
  const missing = !title.trim() ? 'Укажите название игры' : createdAt === null ? 'Укажите дату игры' : !settingsValid ? 'Заполните настройки игры' : null

  async function handleSubmit() {
    if (missing || createdAt === null) {
      return
    }
    setLoading(true)
    try {
      const gameId = await api.post<string>('/api/games', { title, seasonId, settings, createdAt })
      router.replace(`/groups/${groupId}/seasons/${seasonId}/games/${gameId}`)
    }
    catch (e) {
      toast.error(`Не удалось создать игру: ${getErrorMessage(e)}`)
      setLoading(false)
    }
  }

  return (
    <Page>
      <Section header="Новая игра">
        <Input
          className="input"
          before={<Subheadline>Название игры</Subheadline>}
          placeholder="Например: Пятничный покер"
          value={title}
          onChange={e => setTitle(e.target.value)}
          disabled={loading}
        />

        <Input
          className="input"
          type="date"
          before={<Subheadline>Дата игры</Subheadline>}
          value={date}
          onChange={e => setDate(e.target.value)}
          disabled={loading}
        />
      </Section>

      <GameSettingsEditor gameSettings={settings} onChange={setSettings} onValidityChange={setSettingsValid} editable={!loading} />

      <ActionBar>
        {missing && <ActionHint>{missing}</ActionHint>}
        <ActionButton disabled={!!missing} loading={loading} onClick={handleSubmit}>Создать игру</ActionButton>
      </ActionBar>
    </Page>
  )
}
