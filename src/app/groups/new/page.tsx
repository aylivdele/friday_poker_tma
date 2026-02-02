'use client'

import type { Group } from '@/types/api'
import { Input, Section } from '@telegram-apps/telegram-ui'
import { mainButton } from '@tma.js/sdk-react'
import { useRouter } from 'next/navigation'
import { use, useEffect, useState } from 'react'
import toast from 'react-hot-toast'
import { Page } from '@/components/Page'
import { api } from '@/lib/api'

export default function NewGroupPage() {
  const [title, setTitle] = useState<string>('')
  const router = useRouter()

  useEffect(() => {
    mainButton.setText('Сохранить группу')
    mainButton.show()

    const unbound = mainButton.onClick(() => api.post<Group>(`/api/groups/`, { title })
      .then(group => router.replace(`/group/${group._id}`))
      .catch(e => toast.error(e)))

    return () => {
      mainButton.hide()
      unbound()
    }
  }, [mainButton, title])

  return (
    <Page>
      <Section header="Создание новой группы">
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
