'use client'

import type { SaveStatus } from '@/components/app/SaveIndicator'
import type { EditableGame, GameOp } from '@/domain/gameOps'
import type { GameDetails } from '@/types/api'
import { useCallback, useRef, useState } from 'react'
import { toast } from 'sonner'
import useSWR from 'swr'
import { applyOps, GameOpError } from '@/domain/gameOps'
import { api } from '@/lib/api'
import { ApiError, getErrorMessage } from '@/lib/errors'
import { haptic } from '@/lib/haptics'
import { swrGetFetcher } from '@/lib/swrFetcher'

function toEditable(game: GameDetails): EditableGame {
  return { title: game.title, createdAt: game.createdAt, players: game.players, settings: game.settings }
}

function applyLocal(game: GameDetails, ops: GameOp[]): GameDetails {
  // В обычной игре лимит считается сразу; лимиты финала зависят от сезона — берём последние от сервера.
  // Окончательно всё проверит сервер.
  const capsFor = (settings: GameDetails['settings']) => settings.isFinal
    ? game.caps
    : Object.fromEntries(Object.keys(game.caps).map(id => [id, settings.maxReEntries + 1]))
  return { ...game, ...applyOps(toEditable(game), ops, { capsFor, canAdd: () => true }) }
}

// Игра с автосохранением: изменения сразу видны на экране и по очереди уходят на сервер.
// Пока игра идёт, данные обновляются каждые 4 с, чтобы видеть правки с других телефонов.
export function useGame(gameId: string) {
  const pending = useRef<GameOp[][]>([])
  // при ошибке очередь «сбрасывается»: уже отправленные в очередь операции строились на неудачной
  const generation = useRef(0)
  const queue = useRef<Promise<void>>(Promise.resolve())
  const [status, setStatus] = useState<SaveStatus>('idle')

  const swr = useSWR<GameDetails>(`/api/games/${gameId}`, swrGetFetcher, {
    refreshInterval: game => (game && !game.isFinished ? 4000 : 0),
    isPaused: () => pending.current.length > 0,
  })
  const { mutate } = swr
  const latest = useRef<GameDetails | undefined>(undefined)
  if (swr.data && pending.current.length === 0) {
    latest.current = swr.data
  }

  const sendOps = useCallback((ops: GameOp[]): boolean => {
    const current = latest.current
    if (!current) {
      return false
    }
    let optimistic: GameDetails
    try {
      optimistic = applyLocal(current, ops)
    }
    catch (e) {
      haptic('error')
      toast.error(e instanceof GameOpError ? e.message : getErrorMessage(e))
      return false
    }

    latest.current = optimistic
    pending.current.push(ops)
    setStatus('saving')
    mutate(optimistic, { revalidate: false })
    const myGeneration = generation.current

    queue.current = queue.current.then(async () => {
      if (myGeneration !== generation.current) {
        return
      }
      try {
        const server = await api.patch<GameDetails>(`/api/games/${gameId}`, { ops })
        pending.current.shift()
        // Поверх ответа сервера — ещё не отправленные операции, чтобы экран не дёргался
        const merged = pending.current.reduce((game, rest) => applyLocal(game, rest), server)
        latest.current = merged
        mutate(merged, { revalidate: false })
        if (pending.current.length === 0) {
          setStatus('saved')
        }
      }
      catch (e) {
        generation.current++
        pending.current = []
        setStatus('error')
        haptic('error')
        toast.error(e instanceof ApiError && e.status === 409
          ? `Данные обновились на другом устройстве. ${e.message}`
          : `Не удалось сохранить: ${getErrorMessage(e)}`)
        latest.current = await mutate()
      }
    })
    return true
  }, [gameId, mutate])

  const replace = useCallback((game: GameDetails) => {
    latest.current = game
    mutate(game, { revalidate: false })
  }, [mutate])

  return { ...swr, game: swr.data, status, sendOps, replace }
}
