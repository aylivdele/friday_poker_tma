'use client'

import type { GameDetails } from '@/types/api'
import { useRouter } from 'next/navigation'
import { use, useEffect } from 'react'
import useSWR from 'swr'
import { Loader } from '@/components/Loader/Loader'
import { Page } from '@/components/Page'
import { markStartHandled } from '@/lib/navigation'
import { swrGetFetcher } from '@/lib/swrFetcher'

// Короткая ссылка на игру (ею делятся): узнаёт группу и сезон и открывает полную страницу
export default function GameLinkPage({ params }: { params: Promise<{ gameId: string }> }) {
  const { gameId } = use(params)
  const router = useRouter()
  // Тот же ключ, что у страницы игры: она откроется уже с данными
  const swr = useSWR<GameDetails>(`/api/games/${gameId}`, swrGetFetcher)
  const game = swr.data

  useEffect(() => {
    markStartHandled()
  }, [])

  useEffect(() => {
    if (game) {
      router.replace(game.seasonId ? `/groups/${game.groupId}/seasons/${game.seasonId}/games/${game._id}` : `/groups/${game.groupId}`)
    }
  }, [router, game])

  return (
    <Page title="Игра">
      <Loader {...swr} isLoading={swr.isLoading || !!game} />
    </Page>
  )
}
