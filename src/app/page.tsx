'use client'

import { Cell, Spinner, Text } from '@telegram-apps/telegram-ui'
import { useRouter } from 'next/navigation'
import { useEffect } from 'react'
import { Page } from '@/components/Page'
import { usePlayerStore } from '@/stores/playerStore'

export default function Root() {
  const router = useRouter()
  const player = usePlayerStore(s => s.player)
  useEffect(() => {
    if (player) {
      router.replace(`/players/${player._id}`)
    }
  }, [router, player])
  return (
    <Page back={false}>
      <Cell before={<Spinner size="m" />}><Text weight="2">Загрузка профиля</Text></Cell>
    </Page>
  )
}
