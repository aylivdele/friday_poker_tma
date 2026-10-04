'use client'

import type { GameDetails, Player } from '@/types/api'
import {
  Avatar,
  Cell,
  Chip,
  Headline,
  Input,
  List,
  Section,
  Subheadline,
} from '@telegram-apps/telegram-ui'
import { use, useEffect, useState } from 'react'
import useSWR from 'swr'
import GameSettingsEditor from '@/components/Games/GameSettingsEditor'
import PlayersEditor from '@/components/Games/PlayersEditor'
import SaveControls from '@/components/Games/SaveControls'
import { Loader } from '@/components/Loader/Loader'
import { Page } from '@/components/Page'
import { useClosingConfirmation } from '@/hooks/useClosingConfirmation'
import { parseDateInput, toDateInputValue } from '@/lib/dates'
import { swrGetFetcher } from '@/lib/swrFetcher'

function editableFields(game: GameDetails) {
  return JSON.stringify([game.title, game.createdAt, game.players, game.settings])
}

export default function GamePage({ params }: { params: Promise<{ gameId: string, groupId: string, seasonId: string }> }) {
  const { gameId, groupId, seasonId } = use(params)
  const { data: game, mutate, error, isLoading } = useSWR<GameDetails>(`/api/games/${gameId}`, swrGetFetcher)
  const { data: groupPlayers, isLoading: pIsLoading, error: pError } = useSWR<Player[]>(`/api/players?groupId=${groupId}`, swrGetFetcher)

  // base — версия с сервера, от которой начато редактирование; draft — то, что видит пользователь
  const [base, setBase] = useState<GameDetails | null>(null)
  const [draft, setDraft] = useState<GameDetails | null>(null)
  const [settingsValid, setSettingsValid] = useState(true)
  const dirty = !!draft && !!base && editableFields(draft) !== editableFields(base)
  // Несохранённые правки: Telegram и браузер переспросят перед закрытием
  useClosingConfirmation(dirty)

  const reset = (fresh: GameDetails) => {
    setBase(fresh)
    setDraft(structuredClone(fresh))
  }

  // Новые данные с сервера подхватываем, только если пользователь ничего не менял
  useEffect(() => {
    if (game && (!dirty || game._id !== base?._id)) {
      reset(game)
    }
  }, [game])

  if (!draft) {
    return (
      <Page>
        <Loader data={game} error={error} isLoading={isLoading} />
      </Page>
    )
  }

  const canEdit = draft.can.edit
  // Состав завершённой игры пока нельзя менять: результаты перестанут сходиться со стеками
  const canEditPlayers = canEdit && !draft.isFinished

  return (
    <Page>
      <Headline style={{ padding: 10, textAlign: 'center' }}>
        {draft.title}
      </Headline>

      <Input
        className="input"
        type="date"
        before={<Subheadline>Дата игры</Subheadline>}
        value={toDateInputValue(draft.createdAt)}
        onChange={(e) => {
          const createdAt = parseDateInput(e.target.value)
          if (createdAt !== null) {
            setDraft({ ...draft, createdAt })
          }
        }}
        disabled={!canEdit}
      />

      {draft.isFinished && draft.results && (
        <Section header="Финалисты">
          <List>
            {draft.results.map((p) => {
              const playerData = groupPlayers?.find(dp => dp._id === p.playerId)
              return (
                <Cell
                  key={p.playerId}
                  before={<Avatar src={playerData?.avatarUrl} />}
                  after={<Chip>{p.score}</Chip>}
                >
                  {[playerData?.firstName, playerData?.lastName].filter(Boolean).join(' ')}
                </Cell>
              )
            })}
          </List>
        </Section>
      )}

      <PlayersEditor
        groupPlayers={groupPlayers}
        isLoading={pIsLoading}
        error={pError}
        players={draft.players}
        editable={canEditPlayers}
        onChange={players => setDraft({ ...draft, players })}
        maxPlayerEntries={draft.caps}
      />

      <GameSettingsEditor
        gameSettings={draft.settings}
        editable={canEdit}
        onChange={settings => setDraft({ ...draft, settings })}
        onValidityChange={setSettingsValid}
      />

      <SaveControls
        draft={draft}
        dirty={dirty}
        valid={settingsValid}
        groupPlayers={groupPlayers}
        seasonUrl={`/groups/${groupId}/seasons/${seasonId}`}
        onSaved={(updated) => {
          reset(updated)
          mutate(updated, { revalidate: false })
        }}
        onConflict={async () => {
          const fresh = await mutate()
          if (fresh) {
            reset(fresh)
          }
        }}
      />
    </Page>
  )
}
