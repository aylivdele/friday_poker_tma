'use client'

import type { Game } from '@/types/db'
import {
  Section,
  Spinner,
  Text,
} from '@telegram-apps/telegram-ui'
import { use, useEffect, useState } from 'react'
import useSWR from 'swr'
import GameSettingsEditor from '@/components/Games/GameSettingsEditor'
import PlayersEditor from '@/components/Games/PlayersEditor'
import SaveControls from '@/components/Games/SaveControls'
import { Page } from '@/components/Page'
import { swrGetFetcher } from '@/lib/swrFetcher'

export default function GameClient({ params }: { params: Promise<{ gameId: string, groupId: string }> }) {
  const { gameId, groupId } = use(params)
  const { data: game, mutate, isLoading } = useSWR<Game>(
    `/api/games/${gameId}`,
    swrGetFetcher,
  )
  const [draft, setDraft] = useState<Game | null>(null)
  const isEditable = game && !game.isFinished

  useEffect(() => {
    if (game) {
      setDraft(structuredClone(game))
    }
  }, [game])

  if (isLoading || !draft)
    return <Spinner size="l" />

  return (
    <Page>
      <Section>
        <Text weight="2" size={4}>
          {draft.title}
        </Text>
      </Section>

      <PlayersEditor
        groupId={groupId}
        players={draft.players}
        editable={!!isEditable}
        onChange={players =>
          setDraft({ ...draft, players })}
      />

      <GameSettingsEditor
        gameSettings={draft.settings}
        editable={!!isEditable}
        onChange={settings =>
          setDraft({ ...draft, settings })}
      />

      {isEditable && (
        <SaveControls
          gameId={gameId}
          draft={draft}
          onSaved={mutate}
        />
      )}
    </Page>
  )
}
