'use client'

import type { Player } from '@/types/db'
import { Input, Section } from '@telegram-apps/telegram-ui'
import { mainButton } from '@tma.js/sdk-react'
import { useRouter } from 'next/navigation'
import { use, useCallback, useEffect, useState } from 'react'
import toast from 'react-hot-toast'
import { Page } from '@/components/Page'
import { api } from '@/lib/api'

export default function NewPlayerPage({ params }: { params: Promise<{ groupId: string }> }) {
  const { groupId } = use(params)
  const [firstName, setFirstName] = useState<string>('')
  const [secondName, setSecondName] = useState<string>('')
  const [avatar, setAvatar] = useState<string>('')
  const router = useRouter()

  useEffect(() => {
    mainButton.setText('Сохранить игрока')
    mainButton.show()

    const unbound = mainButton.onClick(() => api.post<Player>(`/api/players/?groupId=${groupId}`, { firstName, secondName, avatarUrl: avatar })
      .then(player => router.replace(`/players/${player._id}`))
      .catch(e => toast.error(e)))

    return () => {
      mainButton.hide()
      unbound()
    }
  }, [mainButton, groupId, firstName])

  const readFile = useCallback((file?: Blob) => {
    const reader = new FileReader()

    reader.onload = (event) => {
      if (typeof event.target?.result === 'string') {
        setAvatar(event.target.result)
      }
      else {
        toast.error('Не удалось загрузить файл')
      }
    }
    reader.onerror = (event) => {
      toast.error(`Не удалось загрузить файл ${event.target?.error?.message}`)
    }
    if (file) {
      reader.readAsDataURL(file)
    }
    else {
      setAvatar('')
    }
  }, [])

  return (
    <Page>
      <Section header="Создание нового игрока">
        <Input
          value={firstName}
          header="Имя"
          onChange={e => setFirstName(e.target.value)}
        />
        <Input
          value={secondName}
          header="Фамилия"
          onChange={e => setSecondName(e.target.value)}
        />
        <Input
          value={avatar}
          header="Ава"
          onChange={e => readFile(e.target.files?.[0])}
          type="file"
          accept="image/*"
        />
      </Section>

    </Page>
  )
}
