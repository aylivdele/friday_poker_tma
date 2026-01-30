'use client'

import type { Season } from '@/types/db'
import { Input, Section } from '@telegram-apps/telegram-ui'
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

    const unbound = mainButton.onClick(() => api.post<Season>(`/api/seasons/`, { title, groupId })
      .then(season => router.replace(`/group/${groupId}/seasons/${season._id}`))
      .catch(e => toast.error(e)))

    return () => {
      mainButton.hide()
      unbound()
    }
  }, [mainButton, groupId, title])

  return (
    <Page>
      <Section header="Создание нового сезона">
        <Input
          value={title}
          header="Название"
          onChange={e => setTitle(e.target.value)}
          placeholder="Весна 25 г."
        />
      </Section>

    </Page>
  )
}
