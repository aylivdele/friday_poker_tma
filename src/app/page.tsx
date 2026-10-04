'use client'

import { useRouter } from 'next/navigation'
import { useEffect } from 'react'
import { Loader } from '@/components/Loader/Loader'
import { Page } from '@/components/Page'
import { usePlayerStore } from '@/stores/playerStore'

// Стартовая страница: после загрузки профиля открывается вкладка «Игры»
export default function Root() {
  const router = useRouter()
  const player = usePlayerStore(s => s.player)
  useEffect(() => {
    if (player) {
      router.replace('/games')
    }
  }, [router, player])
  return (
    <Page back={false}>
      <Loader data={null} isLoading={true} error={null} />
    </Page>
  )
}
