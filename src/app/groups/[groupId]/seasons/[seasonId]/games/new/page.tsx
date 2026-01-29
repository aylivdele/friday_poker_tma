'use client'

import type { Game } from '@/types/db'
import { Input, Section, Text } from '@telegram-apps/telegram-ui'
import { mainButton } from '@tma.js/sdk-react'
import { useRouter } from 'next/router'
import { use, useEffect, useState } from 'react'
import toast from 'react-hot-toast'
import { Page } from '@/components/Page'
import { api } from '@/lib/api'

export default async function NewGamePage({ params }: { params: Promise<{ seasonId: string, groupId: string }> }) {
  const { seasonId, groupId } = use(params)
  const [title, setTitle] = useState('')
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  async function handleSubmit() {
    if (!title.trim())
      return

    setLoading(true)

    try {
      const game = await api.post<Game>('/api/games', {
        title,
        groupId,
        seasonId,
      })

      router.replace(
        `/groups/${groupId}/seasons/${seasonId}/games/${game._id}`,
      )
    }
    catch (e) {
      console.error(e)
      toast.error('Не удалось создать игру')
    }
    finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (!mainButton)
      return

    mainButton.setText('Создать игру')
    mainButton.show()

    mainButton.onClick(handleSubmit)

    return () => {
      mainButton.hide()
      mainButton.offClick(handleSubmit)
    }
  }, [title, loading])

  return (
    <Page>
      <Section>
        <Text weight="2" size={3}>
          Новая игра
        </Text>

        <Input
          header="Название игры"
          placeholder="Например: Пятничный покер"
          value={title}
          onChange={e => setTitle(e.target.value)}
          disabled={loading}
        />

      </Section>

    </Page>
  )
}
