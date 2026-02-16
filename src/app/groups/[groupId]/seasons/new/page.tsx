'use client'

import { Input, Section, Subheadline } from '@telegram-apps/telegram-ui'
import { mainButton } from '@tma.js/sdk-react'
import { useRouter } from 'next/navigation'
import { use, useEffect, useState } from 'react'
import toast from 'react-hot-toast'
import { Page } from '@/components/Page'
import { api } from '@/lib/api'

export default function NewSeasonPage({ params }: { params: Promise<{ groupId: string }> }) {
  const { groupId } = use(params)
  const [title, setTitle] = useState<string>('')
  const router = useRouter()

  useEffect(() => {
    mainButton.setText('Сохранить сезон')
    mainButton.show()

    const unbound = mainButton.onClick(() => api.post<string>(`/api/seasons/`, { title, groupId })
      .then(seasonId => router.replace(`/groups/${groupId}/seasons/${seasonId}`))
      .catch(e => toast.error(e)))

    return () => {
      unbound()
    }
  }, [mainButton, groupId, title])

  useEffect(() => {
    return () => {
      mainButton?.hide()
    }
  }, [mainButton])

  return (
    <Page>
      <Section header="Создание нового сезона">
        <Input
          className="input"
          value={title}
          before={<Subheadline>Название</Subheadline>}
          onChange={e => setTitle(e.target.value)}
          placeholder="Весна 25 г."
        />
      </Section>

    </Page>
  )
}
