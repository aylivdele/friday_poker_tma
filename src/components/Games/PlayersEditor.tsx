'use client'

import type { GamePlayer, Player } from '@/types/api'
import { Avatar, Button, Cell, Chip, List, Section, Text } from '@telegram-apps/telegram-ui'
import { isNull } from '@/lib/helpers'
import { nonNull } from '../../lib/helpers'
import { Loader } from '../Loader/Loader'

export default function PlayersEditor({
  players,
  editable,
  onChange,
  maxReEntries,
  groupPlayers,
  error,
  isLoading,
}: {
  players: GamePlayer[]
  editable: boolean
  onChange: (players: GamePlayer[]) => void
  maxReEntries: number
  groupPlayers?: Player[]
  error: any
  isLoading: boolean
}) {
  function updatePlayer(index: number, patch?: GamePlayer) {
    const next = [...players]
    if (patch) {
      next[index] = { ...next[index], ...patch }
    }
    else {
      next.splice(index, 1)
    }
    onChange(next)
  }

  function addPlayer(playerId: string) {
    onChange([...players, { playerId, entries: 0 }])
  }

  if (isLoading)
    return <Loader data={groupPlayers} isLoading={isLoading} error={error} />

  if (error || isNull(groupPlayers)) {
    return <Text>Ошибка загрузки игроков</Text>
  }

  return (
    <>
      <Section header="Игроки в игре">
        <List>
          {players.map((p, i) => {
            const playerData = groupPlayers.find(dp => dp._id?.toString() === p.playerId.toString())
            return (
              <Cell
                key={p.playerId.toString()}
                before={(
                  <Avatar
                    src={playerData?.avatarUrl}
                  />
                )}
                after={(
                  <div style={{ display: 'flex', gap: 8, marginRight: 0 }}>
                    {editable ? (<Button mode="bezeled" size="s" onClick={() => (p.entries > 0) ? updatePlayer(i, { ...p, entries: p.entries - 1 }) : updatePlayer(i, undefined)}>-</Button>) : undefined}
                    <Chip>{p.entries}</Chip>
                    {editable
                      ? (
                          <>
                            <Button mode="bezeled" size="s" onClick={() => (p.entries < maxReEntries) && updatePlayer(i, { ...p, entries: p.entries + 1 })}>+</Button>
                          </>
                        )
                      : undefined}
                  </div>
                )}
              >
                {playerData?.firstName}
                {' '}
                {playerData?.lastName}
              </Cell>
            )
          }) || <Text>Список пуст</Text>}
        </List>
      </Section>
      {editable
        && (
          <Section header="Добавить игроков">
            <List>
              {groupPlayers.filter(dp => nonNull(dp._id) && !players.some(p => p.playerId === dp._id)).map(p => (
                <Cell
                  key={p._id!.toString()}
                  before={(
                    <Avatar
                      src={p.avatarUrl}
                    />
                  )}
                  after={<Button onClick={() => addPlayer(p._id!)}>Добавить</Button>}
                >
                  {p.firstName}
                  {' '}
                  {p.lastName}
                </Cell>
              ),
              )}
            </List>
          </Section>
        )}
    </>
  )
}
