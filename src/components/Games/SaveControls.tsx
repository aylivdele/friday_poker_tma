'use client'

import type { Game, GameResult, Player } from '@/types/api'

import { Avatar, Button, Cell, Input, List, Modal, Section, Text } from '@telegram-apps/telegram-ui'
import { mainButton, secondaryButton } from '@tma.js/sdk-react'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import toast from 'react-hot-toast'
import { api } from '@/lib/api'
import { nonNull } from '@/lib/helpers'
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

  async function finishGame() {
    try {
      if (!draft.results) {
        throw new Error('Отсутствуют результаты игры')
      }
      if (sumScore !== maxScore) {
        throw new Error('Стеки не распределены до конца')
      }
      await api.put(`/api/games/${gameId}`, { ...draft, isFinished: true, results })
      onSaved()
      setResultModalOpen(false)
    }
    catch (e) {
      console.error('Ошибка сохранения настроек игры', e)
      toast.error(`Ошибка сохранения: ${e}`)
    }
  }

  async function deleteGame() {
    try {
      await api.delete(`/api/games/${gameId}`)
      router.back()
    }
    catch (e) {
      console.error('Ошибка удаления игры', e)
      toast.error('Ошибка удаления')
    }
  }

  useEffect(() => {
    if (!mainButton || resultModalOpen)
      return

    const unbound = mainButton.onClick(save)
    mainButton.setText('Сохранить')
    mainButton.show()

    return () => {
      mainButton.hide()
      unbound()
    }
  }, [draft, resultModalOpen])

  useEffect(() => {
    if (!secondaryButton)
      return

    let unbound
    if (draft.isFinished) {
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
      secondaryButton.hide()
      unbound()
    }
  }, [draft, resultModalOpen])

  useEffect(() => {
    setMaxScore(draft.players.reduce((acc, cv) => acc + cv.entries, draft.players.length))
  }, [draft.players])

  useEffect(() => {
    setSumScore(results.reduce((acc, cv) => acc + cv.score, 0))
  }, [results])

  const updateResult = (index: number, patch: GameResult) => {
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
        <Modal dismissible header="Результаты" open={resultModalOpen} onOpenChange={setResultModalOpen}>
          <Section header="Финалисты">
            <List>
              {results.map((p, i) => {
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
                        header="Стэки"
                        type="number"
                        disabled={true}
                        value={p.score}
                        before={(<Button mode="bezeled" size="s" onClick={() => (p.score > 0) && updateResult(i, { ...p, score: p.score - 1 })}>-</Button>)}
                        after={(
                          <Button mode="bezeled" size="s" onClick={() => (maxScore - sumScore > 0) && updateResult(i, { ...p, score: p.score + 1 })}>+</Button>
                        )}
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
