'use client'

import type { GamePlayer, Player } from '@/types/api'
import { Avatar, Button, Cell, Input, List, Section, Text } from '@telegram-apps/telegram-ui'
import { isNull } from '@/lib/helpers'
import { nonNull } from '../../lib/helpers'
import { IconPersonRemove } from '../Icons/PersonRemove'
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
          {players.sort((a, b) => {
            if (a.entries === b.entries) {
              return 0
            }
            if (a.entries === 0) {
              return 1
            }
            return -1
          }).map((p, i) => {
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
                  <Input
                    header="Докупы"
                    type="number"
                    disabled={true}
                    value={p.entries}
                    before={editable ? (<Button mode="bezeled" size="s" onClick={() => (p.entries > 0) && updatePlayer(i, { ...p, entries: p.entries - 1 })}>-</Button>) : undefined}
                    after={editable
                      ? (
                          <>
                            <Button mode="bezeled" size="s" onClick={() => (p.entries < maxReEntries) && updatePlayer(i, { ...p, entries: p.entries + 1 })}>+</Button>
                            <Button size="s" onClick={() => updatePlayer(i, undefined)}><IconPersonRemove /></Button>
                          </>
                        )
                      : undefined}
                  />
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
