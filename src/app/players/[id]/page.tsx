'use client'

import type { Player } from '@/types/api'
import { use } from 'react'
import useSWR from 'swr'
import { Loader } from '@/components/Loader/Loader'
import { Page } from '@/components/Page'
import { PlayerComponent } from '@/components/Player/Player'
import { isNull } from '@/lib/helpers'
import { swrGetFetcher } from '@/lib/swrFetcher'

export default function PlayersPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const { data: player, isLoading, error } = useSWR<Player>(`/api/players/${id}`, swrGetFetcher, {
    revalidateOnMount: true,
    revalidateOnFocus: true,
    dedupingInterval: 2000,
  })

  if (isNull(player)) {
    return (<Loader data={player} isLoading={isLoading} error={error} />)
  }

  return (
    <Page>
      <PlayerComponent player={player} />
    </Page>
  )
}
