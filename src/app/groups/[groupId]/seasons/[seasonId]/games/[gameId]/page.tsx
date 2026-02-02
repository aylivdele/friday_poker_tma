'use client'

import type { Game } from '@/types/api'
import {
  Section,
  Text,
} from '@telegram-apps/telegram-ui'
import { use, useEffect, useState } from 'react'
import useSWR from 'swr'
import GameSettingsEditor from '@/components/Games/GameSettingsEditor'
import PlayersEditor from '@/components/Games/PlayersEditor'
import SaveControls from '@/components/Games/SaveControls'
import { Loader } from '@/components/Loader/Loader'
import { Page } from '@/components/Page'
import { swrGetFetcher } from '@/lib/swrFetcher'

export default function GamePage({ params }: { params: Promise<{ gameId: string, groupId: string }> }) {
  const { gameId, groupId } = use(params)
  const { data: game, mutate, error, isLoading } = useSWR<Game>(
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

  if (!draft)
    return <Loader data={game} error={error} isLoading={isLoading} />

  return (
    <Page>
      <Section>
        <Text weight="2" size={4}>
          {draft.title}
        </Text>

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
      </Section>
    </Page>
  )
}
