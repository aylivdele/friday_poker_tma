'use client'

import type { Game } from '@/types/api'
import { mainButton } from '@tma.js/sdk-react'
import { useRouter } from 'next/navigation'
import { useEffect } from 'react'
import useSWR from 'swr'
import { isNull } from '@/lib/helpers'
import { swrGetFetcher } from '@/lib/swrFetcher'
import { usePlayerStore } from '@/stores/playerStore'
import { GamesList } from '../Games/GamesList'
import { Loader } from '../Loader/Loader'

export function SeasonGames({ groupMembers, seasonId, groupId }: { groupMembers: string[], seasonId: string, groupId: string }) {
  const player = usePlayerStore(s => s.player)
  const router = useRouter()
  const swr = useSWR<Game[]>(`/api/games?seasonId=${seasonId}`, swrGetFetcher, {
    revalidateOnMount: true,
    revalidateOnFocus: true,
    dedupingInterval: 2000,
  })
  const games = swr.data

  const handleSubmit = () => {
    router.push(`/groups/${groupId}/seasons/${seasonId}/games/new`)
  }

  useEffect(() => {
    if (!mainButton || isNull(games) || isNull(player?._id) || !groupMembers.includes(player?._id?.toString()) || isNull(groupId))
      return

    mainButton.setText('Создать новую игру')
    mainButton.show()

    mainButton.onClick(handleSubmit)

    return () => {
      mainButton.hide()
      mainButton.offClick(handleSubmit)
    }
  }, [mainButton, games, player, groupMembers, groupId])

  if (isNull(games)) {
    return <Loader {...swr} />
  }

  return (
    <GamesList games={games} />
  )
}
