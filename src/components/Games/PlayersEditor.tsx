'use client'

import type { GamePlayer, Player } from '@/types/api'
import { Avatar, Button, Cell, Input, List, Section, Text } from '@telegram-apps/telegram-ui'
import useSWR from 'swr'
import { isNull } from '@/app/api/helpers'
import { swrGetFetcher } from '@/lib/swrFetcher'
import { IconPersonRemove } from '../Icons/PersonRemove'
import { Loader } from '../Loader/Loader'
import { nonNull } from './../../app/api/helpers'

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
  const { data: groupPlayers, isLoading, error } = useSWR<Player[]>(`/api/players?groupId=${groupId}`, swrGetFetcher)

  function updatePlayer(index: number, patch?: GamePlayer) {
    const next = [...players]
    if (patch) {
      next[index] = { ...next[index], ...patch }
    }
    else {
      delete next[index]
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
                    disabled={!editable}
                    value={p.entries}
                    after={editable ? (<Button onClick={() => updatePlayer(i, undefined)}><IconPersonRemove /></Button>) : undefined}
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
