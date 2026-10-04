'use client'

import type { GameDetails, Player } from '@/types/api'
import { PencilIcon, Trash2Icon } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { use, useMemo, useState } from 'react'
import { toast } from 'sonner'
import useSWR from 'swr'
import { SaveIndicator } from '@/components/app/SaveIndicator'
import { confirmAction } from '@/components/ConfirmButton/ConfirmButton'
import { CorrectionEditor } from '@/components/game/CorrectionEditor'
import { EditMetaDialog } from '@/components/game/EditMetaDialog'
import { FinishedGame } from '@/components/game/FinishedGame'
import { GameSummary } from '@/components/game/GameSummary'
import { LiveGame } from '@/components/game/LiveGame'
import { Loader } from '@/components/Loader/Loader'
import { Page } from '@/components/Page'
import { DropdownMenuItem } from '@/components/ui/dropdown-menu'
import { useGame } from '@/hooks/useGame'
import { api } from '@/lib/api'
import { getErrorMessage } from '@/lib/errors'
import { formatGameDate } from '@/lib/format'
import { swrGetFetcher } from '@/lib/swrFetcher'

export default function GamePage({ params }: { params: Promise<{ gameId: string, groupId: string, seasonId: string }> }) {
  const { gameId, groupId, seasonId } = use(params)
  const router = useRouter()
  const { game, error, isLoading, status, sendOps, replace } = useGame(gameId)
  const { data: groupPlayers } = useSWR<Player[]>(`/api/players?groupId=${groupId}`, swrGetFetcher)
  const [correcting, setCorrecting] = useState(false)
  const [metaOpen, setMetaOpen] = useState(false)

  const playersById = useMemo(() => new Map((groupPlayers ?? []).map(p => [p._id, p])), [groupPlayers])
  const seasonUrl = `/groups/${groupId}/seasons/${seasonId}`

  if (!game) {
    return (
      <Page title="Игра">
        <Loader data={game} error={error} isLoading={isLoading} />
      </Page>
    )
  }

  const saveMeta = async (meta: { title: string, createdAt: number }) => {
    if (!game.isFinished) {
      sendOps([{ type: 'setMeta', ...meta }])
      return
    }
    try {
      replace(await api.put<GameDetails>(`/api/games/${game._id}`, { rev: game.rev, ...meta }))
      toast.success('Сохранено')
    }
    catch (e) {
      toast.error(getErrorMessage(e))
    }
  }

  const deleteGame = async () => {
    const confirmed = await confirmAction({ title: 'Удалить игру?', description: 'Игра пропадёт из таблицы сезона. Это нельзя отменить.', confirmText: 'Удалить' })
    if (!confirmed) {
      return
    }
    try {
      await api.delete(`/api/games/${game._id}`)
      toast.success('Игра удалена')
      router.replace(seasonUrl)
    }
    catch (e) {
      toast.error(getErrorMessage(e))
    }
  }

  const menu = (game.can.edit || game.can.delete) && !correcting
    ? (
        <>
          {game.can.edit && (
            <DropdownMenuItem onSelect={() => setMetaOpen(true)}>
              <PencilIcon />
              Название и дата
            </DropdownMenuItem>
          )}
          {game.can.delete && (
            <DropdownMenuItem variant="destructive" onSelect={deleteGame}>
              <Trash2Icon />
              Удалить игру
            </DropdownMenuItem>
          )}
        </>
      )
    : undefined

  return (
    <Page
      title={correcting ? 'Исправление итогов' : (game.title || 'Игра')}
      subtitle={(
        <>
          <span>{formatGameDate(game.createdAt)}</span>
          {!game.isFinished && status !== 'idle' && (
            <>
              <span aria-hidden>·</span>
              <SaveIndicator status={status} />
            </>
          )}
        </>
      )}
      menu={menu}
    >
      {!correcting && <GameSummary game={game} />}

      {!groupPlayers
        ? <Loader data={null} isLoading error={null} />
        : game.isFinished
          ? correcting
            ? (
                <CorrectionEditor
                  game={game}
                  playersById={playersById}
                  onCancel={() => setCorrecting(false)}
                  onSaved={(updated) => {
                    replace(updated)
                    setCorrecting(false)
                  }}
                />
              )
            : <FinishedGame game={game} playersById={playersById} onCorrect={() => setCorrecting(true)} />
          : (
              <LiveGame
                game={game}
                groupPlayers={groupPlayers}
                playersById={playersById}
                sendOps={sendOps}
                onFinished={replace}
              />
            )}

      <EditMetaDialog open={metaOpen} onOpenChange={setMetaOpen} title={game.title} createdAt={game.createdAt} onSave={saveMeta} />
    </Page>
  )
}
