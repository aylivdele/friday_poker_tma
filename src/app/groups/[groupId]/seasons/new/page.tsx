'use client'

import type { Group } from '@/types/api'
import { useRouter } from 'next/navigation'
import { use, useState } from 'react'
import { toast } from 'sonner'
import useSWR from 'swr'
import { ActionBar, ActionButton } from '@/components/ActionBar/ActionBar'
import { Section } from '@/components/app/Section'
import { Page } from '@/components/Page'
import { Input } from '@/components/ui/input'
import { api } from '@/lib/api'
import { getErrorMessage } from '@/lib/errors'
import { defaultSeasonTitle } from '@/lib/format'
import { swrGetFetcher } from '@/lib/swrFetcher'

export default function NewSeasonPage({ params }: { params: Promise<{ groupId: string }> }) {
  const { groupId } = use(params)
  const router = useRouter()
  const { data: group } = useSWR<Group>(`/api/groups/${groupId}`, swrGetFetcher)
  const [title, setTitle] = useState(defaultSeasonTitle)
  const [saving, setSaving] = useState(false)

  const create = async () => {
    setSaving(true)
    try {
      const seasonId = await api.post<string>('/api/seasons', { title: title.trim(), groupId })
      toast.success('Сезон создан')
      router.replace(`/groups/${groupId}/seasons/${seasonId}`)
    }
    catch (e) {
      toast.error(getErrorMessage(e))
      setSaving(false)
    }
  }

  return (
    <Page title="Новый сезон" subtitle={group?.title}>
      <Section footer="Сезон объединяет игры: по ним считается таблица и финал">
        <label className="flex min-h-14 items-center gap-3 px-3.5 py-2">
          <span className="w-24 shrink-0 text-base">Название</span>
          <Input className="h-10 flex-1 rounded-lg text-base" maxLength={80} value={title} disabled={saving} onChange={e => setTitle(e.target.value)} />
        </label>
      </Section>

      <ActionBar>
        <ActionButton disabled={!title.trim()} loading={saving} onClick={create}>Создать сезон</ActionButton>
      </ActionBar>
    </Page>
  )
}
