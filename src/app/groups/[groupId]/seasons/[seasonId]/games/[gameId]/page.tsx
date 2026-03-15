'use client'

import type { Game, Player, SeasonTableResponse } from '@/types/api'
import {
  Avatar,
  Cell,
  Chip,
  Headline,
  Input,
  List,
  Section,
  Subheadline,
  Text,
} from '@telegram-apps/telegram-ui'
import { use, useEffect, useMemo, useState } from 'react'
import useSWR from 'swr'
import GameSettingsEditor from '@/components/Games/GameSettingsEditor'
import PlayersEditor from '@/components/Games/PlayersEditor'
import SaveControls from '@/components/Games/SaveControls'
import { Loader } from '@/components/Loader/Loader'
import { Page } from '@/components/Page'
import { swrGetFetcher } from '@/lib/swrFetcher'

export default function GamePage({ params }: { params: Promise<{ gameId: string, groupId: string, seasonId: string }> }) {
  const { gameId, groupId, seasonId } = use(params)
  const { data: game, mutate, error, isLoading } = useSWR<Game>(
    `/api/games/${gameId}`,
    swrGetFetcher,
  )
  const { data: groupPlayers, isLoading: pIsLoading, error: pError } = useSWR<Player[]>(`/api/players?groupId=${groupId}`, swrGetFetcher)
  const { data: table, isLoading: tIsLoading, error: tError } = useSWR<SeasonTableResponse>(`/api/seasons/${seasonId}/results`, swrGetFetcher)

  const [draft, setDraft] = useState<Game | null>(null)
  const isEditable = game

  useEffect(() => {
    if (game) {
      setDraft(structuredClone(game))
    }
    else {
      setDraft(null)
    }
  }, [game])

  const maxPlayerEntries: Record<string, number> = useMemo(() => {
    if (!draft || !groupPlayers) {
      return {}
    }

    return Object.fromEntries(groupPlayers.map((p) => {
      let max = draft.settings.maxReEntries + 1
      if (draft.settings.isFinal) {
        max = Math.floor((max) * (table?.seasonEntries[p._id] ?? 0))
      }
      return [p._id, max]
    }))
  }, [table, draft, groupPlayers])

  if (!draft)
    return <Loader data={game} error={error} isLoading={isLoading} />

  return (
    <Page>
      <Headline style={{ padding: 10, textAlign: 'center' }}>
        {draft.title}
      </Headline>

      <Input
        className="input"
        type="date"
        before={<Subheadline>Дата игры</Subheadline>}
        value={new Date(draft.createdAt).toISOString().slice(0, 10)}
        onChange={e => setDraft({ ...draft, createdAt: new Date(e.target.value).getTime() })}
        disabled={!isEditable}
      />

      {draft.isFinished && draft.results
        ? (
            <Section header="Финалисты">
              <List>
                {draft.results.map((p) => {
                  const playerData = groupPlayers?.find(dp => dp._id?.toString() === p.playerId.toString())
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
                          <Chip>{p.score}</Chip>
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
          )
        : null}

      <PlayersEditor
        groupPlayers={groupPlayers}
        isLoading={pIsLoading || tIsLoading}
        error={pError ?? tError}
        players={draft.players}
        editable={!!isEditable}
        onChange={players =>
          setDraft({ ...draft, players })}
        maxPlayerEntries={maxPlayerEntries}
      />

      <GameSettingsEditor
        gameSettings={draft.settings}
        editable={!!isEditable}
        onChange={settings =>
          setDraft({ ...draft, settings })}
      />

      <SaveControls
        gameId={gameId}
        draft={draft}
        groupPlayers={groupPlayers}
        onSaved={mutate}
      />
    </Page>
  )
}
