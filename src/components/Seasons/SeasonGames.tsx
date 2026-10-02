'use client'

import type { Game } from '@/types/api'
import useSWR from 'swr'
import { isNull } from '@/lib/helpers'
import { swrGetFetcher } from '@/lib/swrFetcher'
import { GamesList } from '../Games/GamesList'
import { Loader } from '../Loader/Loader'

export function SeasonGames({ seasonId }: { seasonId: string }) {
  const swr = useSWR<Game[]>(`/api/games?seasonId=${seasonId}`, swrGetFetcher, {
    revalidateOnMount: true,
    revalidateOnFocus: true,
    dedupingInterval: 2000,
  })
  const games = swr.data

  if (isNull(games)) {
    return <Loader {...swr} />
  }

  return (
    <GamesList games={games} />
  )
}
