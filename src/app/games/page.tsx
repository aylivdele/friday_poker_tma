'use client'

import type { Game } from '@/types/api'
import { Section } from '@telegram-apps/telegram-ui'
import useSWR from 'swr'
import { GamesList } from '@/components/Games/GamesList'
import { Loader } from '@/components/Loader/Loader'
import { Page } from '@/components/Page'
import { isNull } from '@/lib/helpers'
import { swrGetFetcher } from '@/lib/swrFetcher'

export default function GamesPage() {
  const swr = useSWR<Game[]>(`/api/games?useInitData=true`, swrGetFetcher)
  const games = swr.data

  if (isNull(games)) {
    return <Loader {...swr} />
  }
  return (
    <Page back={false}>
      <Section header="Последние игры">
        <GamesList games={games} />
      </Section>
    </Page>
  )
}
