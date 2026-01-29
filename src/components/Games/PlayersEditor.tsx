'use client'

import type { GamePlayer, Player } from '@/types/db'
import { Avatar, Cell, Input, Section, Spinner, Text } from '@telegram-apps/telegram-ui'
import useSWR from 'swr'
import { isNull } from '@/app/api/helpers'
import { swrGetFetcher } from '@/lib/swrFetcher'

export default function PlayersEditor({
  players,
  editable,
  onChange,
  groupId,
}: {
  players: GamePlayer[]
  editable: boolean
  onChange: (players: GamePlayer[]) => void
  groupId: string
}) {
  const { data, isLoading, error } = useSWR<Player[]>(`/api/players?groupId=${groupId}`, swrGetFetcher)

  function updatePlayer(index: number, patch: GamePlayer) {
    const next = [...players]
    next[index] = { ...next[index], ...patch }
    onChange(next)
  }

  if (isLoading)
    return <Spinner size="l" />

  if (error || isNull(data)) {
    return <Text>Ошибка загрузки игроков</Text>
  }

  return (
    <Section header="Игроки">
      {players.sort((a, b) => {
        if (a.entries === b.entries) {
          return 0
        }
        if (a.entries === 0) {
          return 1
        }
        return -1
      }).map((p, i) => {
        const playerData = data.find(dp => dp._id?.toString() === p.playerId.toString())
        return (
          <Cell
            key={p.playerId.toString()}
            before={(
              <Avatar
                src={playerData?.avatarUrl}
              />
            )}
            after={(
              <Input
                type="number"
                disabled={!editable}
                value={p.entries}
                onChange={e =>
                  updatePlayer(i, { playerId: p.playerId, entries: +e.target.value })}
              />
            )}
          >
            {playerData?.firstName}
            {' '}
            {playerData?.lastName}
          </Cell>
        )
      })}
    </Section>
  )
}
