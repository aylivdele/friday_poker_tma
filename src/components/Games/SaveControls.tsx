'use client'

import type { Game, GameResult, Group, Player } from '@/types/api'

import { Avatar, Button, Cell, Chip, List, Modal, Section, Text } from '@telegram-apps/telegram-ui'
import { mainButton, secondaryButton } from '@tma.js/sdk-react'
import { useRouter } from 'next/navigation'
import { useCallback, useEffect, useState } from 'react'
import toast from 'react-hot-toast'
import useSWR from 'swr'
import { api } from '@/lib/api'
import { nonNull } from '@/lib/helpers'
import { swrGetFetcher } from '@/lib/swrFetcher'
import { usePlayerStore } from '@/stores/playerStore'
import { confirmPopup } from '../ConfirmButton/ConfirmButton'

export default function SaveControls({
  gameId,
  draft,
  onSaved,
  groupPlayers,
}: {
  gameId: string
  draft: Game
  onSaved: () => void
  groupPlayers?: Player[]
}) {
  const router = useRouter()
  const [resultModalOpen, setResultModalOpen] = useState(false)
  const [results, setResults] = useState<GameResult[]>(draft.results ?? [])
  const [maxScore, setMaxScore] = useState<number>(0)
  const [sumScore, setSumScore] = useState<number>(0)
  const { data: group } = useSWR<Group>(`/api/groups/${draft.groupId}`, swrGetFetcher)
  const player = usePlayerStore(p => p.player)

  async function save() {
    try {
      await api.put(`/api/games/${gameId}`, draft)
      onSaved()
    }
    catch (e) {
      console.error('Ошибка сохранения настроек игры', e)
      toast.error('Ошибка сохранения')
    }
  }

  const finishGame = useCallback(async () => {
    try {
      if (!results) {
        throw new Error('Отсутствуют результаты игры')
      }
      if (sumScore !== maxScore) {
        throw new Error('Стеки не распределены до конца')
      }
      await api.put(`/api/games/${gameId}`, { ...draft, isFinished: true, finishedAt: Date.now(), results })
      onSaved()
      setResultModalOpen(false)
    }
    catch (e) {
      console.error('Ошибка сохранения настроек игры', e)
      toast.error(`Ошибка сохранения: ${e}`)
    }
  }, [draft, sumScore, maxScore, gameId, results])

  const deleteGame = useCallback(async () => {
    try {
      await api.delete(`/api/games/${gameId}`)
      router.back()
    }
    catch (e) {
      console.error('Ошибка удаления игры', e)
      toast.error('Ошибка удаления')
    }
  }, [gameId])

  useEffect(() => {
    if (!mainButton || resultModalOpen || draft.isFinished) {
      mainButton?.hide()
      return
    }

    const unbound = mainButton.onClick(save)
    mainButton.setText('Сохранить')
    mainButton.show()

    return () => {
      unbound()
    }
  }, [draft, resultModalOpen])

  useEffect(() => {
    if (!secondaryButton)
      return

    let unbound
    if (draft.isFinished) {
      if (!player || !(player._id === group?.ownerId || player._id === draft.creater)) {
        secondaryButton.hide()
        return
      }
      secondaryButton.setText('Удалить игру')
      secondaryButton.setBgColor('#FF0000')
      unbound = secondaryButton.onClick(() => confirmPopup({ description: 'Вы уверены, что хотите удалить игру?', onConfirm: deleteGame }))
    }
    else {
      if (resultModalOpen) {
        unbound = secondaryButton.onClick(() => confirmPopup({ description: 'Вы уверены, что хотите завершить игру?', onConfirm: finishGame }))
      }
      else {
        unbound = secondaryButton.onClick(() => setResultModalOpen(true))
      }
      secondaryButton.setText('Завершить игру')
      secondaryButton.setBgColor('#00d400')
    }

    secondaryButton.show()

    return () => {
      unbound()
    }
  }, [draft, resultModalOpen, finishGame, deleteGame, group, player])

  useEffect(() => {
    return () => {
      if (mainButton)
        mainButton.hide()
      if (secondaryButton)
        secondaryButton.hide()
    }
  }, [])

  useEffect(() => {
    setMaxScore(draft.players.reduce((acc, cv) => acc + cv.entries, draft.players.length))
  }, [draft.players])

  useEffect(() => {
    setSumScore(results.reduce((acc, cv) => acc + cv.score, 0))
  }, [results])

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

  return draft.isFinished || !groupPlayers
    ? null
    : (
        <Modal dismissible header={<Text>Результаты</Text>} open={resultModalOpen} onOpenChange={setResultModalOpen}>
          <Section header="Финалисты">
            <List>
              {results.length
                ? results.map((p, i) => {
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
                            <Button mode="bezeled" size="s" onClick={() => (p.score > 0) ? updateResult(i, { ...p, score: p.score - 1 }) : updateResult(i, undefined)}>-</Button>
                            <Chip>{p.score}</Chip>
                            <Button mode="bezeled" size="s" onClick={() => (maxScore - sumScore > 0) && updateResult(i, { ...p, score: p.score + 1 })}>+</Button>
                          </div>
                        )}
                      >
                        {playerData?.firstName}
                        {' '}
                        {playerData?.lastName}
                      </Cell>
                    )
                  })
                : <Cell><Text>Список пуст</Text></Cell>}
            </List>
          </Section>
          <Section header="Добавить игроков">
            <List>
              {groupPlayers.filter(dp => nonNull(dp._id) && !results.some(p => p.playerId === dp._id)).map(p => (
                <Cell
                  key={p._id!.toString()}
                  before={(
                    <Avatar
                      src={p.avatarUrl}
                    />
                  )}
                  after={<Button onClick={() => setResults([...results, { playerId: p._id, score: 0 }])}>Добавить</Button>}
                >
                  {p.firstName}
                  {' '}
                  {p.lastName}
                </Cell>
              ),
              )}
            </List>
          </Section>
        </Modal>
      )
}
