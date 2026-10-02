'use client'

import type { GameDetails, GameResult, Player } from '@/types/api'
import { Avatar, Button, Cell, Chip, List, Modal, Section, Text } from '@telegram-apps/telegram-ui'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import toast from 'react-hot-toast'
import { totalStacks } from '@/domain/balances'
import { api } from '@/lib/api'
import { ApiError, getErrorMessage } from '@/lib/errors'
import { ActionBar, ActionButton, ActionHint } from '../ActionBar/ActionBar'
import { confirmAction } from '../ConfirmButton/ConfirmButton'

function playerName(player?: Player) {
  return [player?.firstName, player?.lastName].filter(Boolean).join(' ')
}

export default function SaveControls({
  draft,
  dirty,
  valid,
  groupPlayers,
  seasonUrl,
  onSaved,
  onConflict,
}: {
  draft: GameDetails
  dirty: boolean
  valid: boolean
  groupPlayers?: Player[]
  seasonUrl: string
  onSaved: (game: GameDetails) => void
  onConflict: () => Promise<void>
}) {
  const router = useRouter()
  const [resultModalOpen, setResultModalOpen] = useState(false)
  const [results, setResults] = useState<GameResult[]>(draft.results ?? [])
  const [busy, setBusy] = useState(false)

  const total = totalStacks(draft)
  const distributed = results.reduce((acc, r) => acc + r.score, 0)
  const remaining = total - distributed

  useEffect(() => {
    // Убираем из результатов тех, кого удалили из игры
    setResults(prev => prev.filter(r => draft.players.some(p => p.playerId === r.playerId)))
  }, [draft.players])

  async function submit(extra: Partial<GameDetails>, successMessage: string) {
    setBusy(true)
    try {
      const updated = await api.put<GameDetails>(`/api/games/${draft._id}`, {
        rev: draft.rev,
        title: draft.title,
        createdAt: draft.createdAt,
        players: draft.players,
        settings: draft.settings,
        ...extra,
      })
      onSaved(updated)
      toast.success(successMessage)
      return true
    }
    catch (e) {
      toast.error(getErrorMessage(e))
      if (e instanceof ApiError && e.status === 409) {
        await onConflict()
      }
      return false
    }
    finally {
      setBusy(false)
    }
  }

  const save = () => submit({}, 'Сохранено')

  const finishGame = async () => {
    const confirmed = await confirmAction({
      title: 'Завершить игру?',
      description: 'После завершения игру сможет исправить только её создатель или владелец группы.',
      confirmText: 'Завершить',
    })
    if (!confirmed) {
      return
    }
    if (await submit({ isFinished: true, results: results.filter(r => r.score > 0) }, 'Игра завершена')) {
      setResultModalOpen(false)
    }
  }

  const deleteGame = async () => {
    const confirmed = await confirmAction({ title: 'Удалить игру?', description: 'Это нельзя отменить.', confirmText: 'Удалить' })
    if (!confirmed) {
      return
    }
    setBusy(true)
    try {
      await api.delete(`/api/games/${draft._id}`)
      toast.success('Игра удалена')
      router.replace(seasonUrl)
    }
    catch (e) {
      toast.error(getErrorMessage(e))
      setBusy(false)
    }
  }

  const updateResult = (index: number, patch?: GameResult) => {
    const next = [...results]
    if (patch) {
      next[index] = { ...next[index], ...patch }
    }
    else {
      next.splice(index, 1)
    }
    setResults(next)
  }

  const saveHint = !valid ? 'Заполните пустые поля' : null

  return (
    <>
      {!resultModalOpen && (
        <ActionBar>
          {draft.can.edit && saveHint && <ActionHint>{saveHint}</ActionHint>}
          {draft.can.edit && dirty && (
            <ActionButton disabled={!valid} loading={busy} onClick={save}>Сохранить</ActionButton>
          )}
          {draft.can.finish && !dirty && (
            <ActionButton disabled={!valid || draft.players.length === 0} onClick={() => setResultModalOpen(true)}>Завершить игру</ActionButton>
          )}
          {draft.can.delete && !dirty && (
            <ActionButton variant="destructive" loading={busy} onClick={deleteGame}>Удалить игру</ActionButton>
          )}
        </ActionBar>
      )}

      {groupPlayers && !draft.isFinished && (
        <Modal dismissible header={<Text style={{ padding: 12 }}>Результаты</Text>} open={resultModalOpen} onOpenChange={setResultModalOpen}>
          <Section header={`Распределено ${distributed} из ${total} стеков${remaining > 0 ? ` · осталось ${remaining}` : ''}`}>
            <List>
              {results.length
                ? results.map((p, i) => {
                    const playerData = groupPlayers.find(dp => dp._id === p.playerId)
                    return (
                      <Cell
                        key={p.playerId}
                        before={<Avatar src={playerData?.avatarUrl} />}
                        after={(
                          <div style={{ display: 'flex', gap: 8, marginRight: 0 }}>
                            <Button mode="bezeled" size="s" onClick={() => (p.score > 0) ? updateResult(i, { ...p, score: p.score - 1 }) : updateResult(i, undefined)}>-</Button>
                            <Chip>{p.score}</Chip>
                            <Button mode="bezeled" size="s" disabled={remaining <= 0} onClick={() => remaining > 0 && updateResult(i, { ...p, score: p.score + 1 })}>+</Button>
                          </div>
                        )}
                      >
                        {playerName(playerData)}
                      </Cell>
                    )
                  })
                : <Cell><Text>Добавьте призёров из списка ниже</Text></Cell>}
            </List>
          </Section>
          <Section header="Добавить призёров">
            <List>
              {groupPlayers.filter(dp => !results.some(p => p.playerId === dp._id) && draft.players.some(p => p.playerId === dp._id)).map(p => (
                <Cell
                  key={p._id}
                  before={<Avatar src={p.avatarUrl} />}
                  after={<Button onClick={() => setResults([...results, { playerId: p._id, score: 0 }])}>Добавить</Button>}
                >
                  {playerName(p)}
                </Cell>
              ))}
            </List>
          </Section>
          <div style={{ padding: 16, display: 'flex', flexDirection: 'column', gap: 8 }}>
            {remaining !== 0 && <ActionHint>Распределите все стеки, чтобы завершить игру</ActionHint>}
            <Button stretched size="l" disabled={remaining !== 0 || busy} loading={busy} onClick={finishGame}>Завершить игру</Button>
          </div>
        </Modal>
      )}
    </>
  )
}
