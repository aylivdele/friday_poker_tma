'use client'

import { useRouter } from 'next/navigation'
import { useEffect } from 'react'
import { Loader } from '@/components/Loader/Loader'
import { Page } from '@/components/Page'
import { startPath } from '@/lib/navigation'
import { usePlayerStore } from '@/stores/playerStore'

// Стартовая страница: после загрузки профиля открывается вкладка «Игры»
// или игра, если приложение запустили по ссылке на неё
export default function Root() {
  const router = useRouter()
  const player = usePlayerStore(s => s.player)
  useEffect(() => {
    if (player) {
      router.replace(startPath() ?? '/games')
    }
  }, [router, player])
  return (
    <Page back={false}>
      <Loader data={null} isLoading={true} error={null} />
    </Page>
  )
}
