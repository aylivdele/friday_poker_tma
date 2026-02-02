'use client'

import type { Game } from '@/types/api'
import { Cell, List, Section, Text } from '@telegram-apps/telegram-ui'
import { mainButton } from '@tma.js/sdk-react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useEffect } from 'react'
import useSWR from 'swr'
import { isNull } from '@/app/api/helpers'
import { swrGetFetcher } from '@/lib/swrFetcher'
import { usePlayerStore } from '@/stores/playerStore'
import { Loader } from '../Loader/Loader'

export function SeasonGames({ groupMembers, seasonId, groupId }: { groupMembers: string[], seasonId: string, groupId: string }) {
  const player = usePlayerStore(s => s.player)
  const router = useRouter()
  const swr = useSWR<Game[]>(`/api/games?seasonId=${seasonId}`, swrGetFetcher)
  const games = swr.data

  const handleSubmit = () => {
    router.push(`/groups/${groupId}/seasons/${seasonId}/games/new`)
  }

  useEffect(() => {
    if (!mainButton || isNull(games) || games.length >= 13 || isNull(player?._id) || !groupMembers.includes(player?._id?.toString()) || isNull(groupId))
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
    <Section header="Игры">
      {games.length === 0
        ? (
            <Text>Игры не найдены</Text>
          )
        : (
            <List>
              {
                games.sort((a, b) => a.createdAt - b.createdAt).map(game => (
                  <Link href={`/games/${game._id}`} key={game._id?.toString()}>
                    <Cell after={game.isFinished ? '' : 'В процессе'} subtitle={`Кол-во игроков: ${game.players.length}`}>{game.title}</Cell>
                  </Link>
                ))
              }
            </List>
          )}
    </Section>
  )
}
