'use client'

import { Input, Section, Subheadline } from '@telegram-apps/telegram-ui'
import { useRouter } from 'next/navigation'
import { use, useState } from 'react'
import { toast } from 'sonner'
import { ActionBar, ActionButton } from '@/components/ActionBar/ActionBar'
import { Page } from '@/components/Page'
import { api } from '@/lib/api'
import { getErrorMessage } from '@/lib/errors'

export default function NewSeasonPage({ params }: { params: Promise<{ groupId: string }> }) {
  const { groupId } = use(params)
  const [title, setTitle] = useState<string>('')
  const [saving, setSaving] = useState(false)
  const router = useRouter()

  const save = async () => {
    setSaving(true)
    try {
      const seasonId = await api.post<string>(`/api/seasons`, { title, groupId })
      router.replace(`/groups/${groupId}/seasons/${seasonId}`)
    }
    catch (e) {
      toast.error(getErrorMessage(e))
      setSaving(false)
    }
  }

  return (
    <Page>
      <Section header="Новый сезон" footer="Если оставить название пустым, оно будет создано по текущему месяцу">
        <Input
          className="input"
          value={title}
          before={<Subheadline>Название</Subheadline>}
          disabled={saving}
          onChange={e => setTitle(e.target.value)}
          placeholder="Весна 25 г."
        />
      </Section>

      <ActionBar>
        <ActionButton loading={saving} onClick={save}>Создать сезон</ActionButton>
      </ActionBar>
    </Page>
  )
}
