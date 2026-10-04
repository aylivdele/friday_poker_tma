import type { Filter } from 'mongodb'
import type { EditableGame } from '@/domain/gameOps'
import type { Game } from '@/types/db'
import { after } from 'next/server'
import { z } from 'zod'
import { getDb } from '@/core/db'
import { applyOps, GameOpError } from '@/domain/gameOps'
import { recalculateForGames } from '@/lib/achievments'
import { requireAuth } from '@/server/auth'
import { toGameDetails } from '@/server/dto'
import { deleteGame, loadGameCaps, makeCapsFor, validateResults } from '@/server/games'
import { badRequest, conflict, forbidden, parseBody, route, toObjectId } from '@/server/http'
import { gameTransfers, notifyGameResults, shouldNotifyCorrection } from '@/server/notifications'
import { gameAbilities, isMember, loadGame, loadGroup } from '@/server/permissions'
import { gameDateSchema, gamePlayerSchema, gameResultSchema, gameSettingsSchema } from '@/server/schemas'

export const GET = route<{ id: string }>(async (req, { id }) => {
  const { player } = await requireAuth(req)
  const game = await loadGame(toObjectId(id))
  const group = await loadGroup(game.groupId)
  return toGameDetails(game, group, player._id, await loadGameCaps(game, group))
})

const updateGameSchema = z.object({
  rev: z.number().int().min(0).optional(),
  // у старых игр название бывает пустым — пустое значение просто оставляет прежнее
  title: z.string().trim().max(80).optional(),
  createdAt: gameDateSchema.optional(),
  players: z.array(gamePlayerSchema).max(100).optional(),
  settings: gameSettingsSchema.optional(),
  isFinished: z.boolean().optional(),
  results: z.array(gameResultSchema).max(100).optional(),
})

export const PUT = route<{ id: string }>(async (req, { id }) => {
  const { player } = await requireAuth(req)
  const body = await parseBody(req, updateGameSchema)
  const game = await loadGame(toObjectId(id))
  const group = await loadGroup(game.groupId)

  if (!gameAbilities(game, group, player._id).edit) {
    throw forbidden(game.isFinished
      ? 'Исправлять завершённую игру может только её создатель или владелец группы'
      : 'Изменять игру могут только участники группы')
  }
  if (body.isFinished === false && game.isFinished) {
    throw badRequest('Завершённую игру нельзя вернуть в работу')
  }
  const finishing = body.isFinished === true && !game.isFinished

  const next: Pick<Game, 'title' | 'createdAt' | 'players' | 'settings'> = {
    title: body.title || game.title,
    createdAt: body.createdAt ?? game.createdAt,
    players: body.players ?? game.players,
    settings: body.settings ?? game.settings,
  }

  const ids = next.players.map(p => p.playerId.toString())
  if (new Set(ids).size !== ids.length) {
    throw badRequest('Игрок добавлен в игру дважды')
  }
  const caps = await loadGameCaps({ ...game, ...next }, group)
  for (const p of next.players) {
    const before = game.players.find(old => old.playerId.equals(p.playerId))
    if (!before && !isMember(group, p.playerId)) {
      throw badRequest('В игру можно добавлять только участников группы')
    }
    // Проверяем только выросшие значения, чтобы смена настроек не блокировала уже сыгранное
    const cap = caps[p.playerId.toString()] ?? 0
    if (p.entries > (before?.entries ?? -1) && p.entries + 1 > cap) {
      throw badRequest(cap > 0 ? `Превышен лимит входов: не больше ${cap}` : 'Игрок не может участвовать в этом финале')
    }
  }

  const update: Partial<Game> = { ...next }
  if (finishing || game.isFinished) {
    update.results = validateResults(next.players, body.results ?? game.results ?? [])
  }
  if (finishing) {
    update.isFinished = true
    update.finishedAt = Date.now()
  }

  const filter: Filter<Game> = { _id: game._id }
  if (body.rev !== undefined) {
    // У игр, созданных до появления rev, поля нет — считаем его нулём
    Object.assign(filter, body.rev === 0 ? { $or: [{ rev: 0 }, { rev: { $exists: false } }] } : { rev: body.rev })
  }
  const db = await getDb()
  const updated = await db.games.findOneAndUpdate(filter, { $set: update, $inc: { rev: 1 } }, { returnDocument: 'after' })
  if (!updated) {
    throw conflict('Игру изменили на другом устройстве. Данные обновлены — повторите изменения')
  }

  if (updated.isFinished) {
    // Старый и новый состав: убранные из игры тоже должны потерять её достижения
    await recalculateForGames([game, updated])
  }
  // Итоги в Telegram: при завершении и когда исправление поменяло, кто кому переводит
  const transfersChanged = game.isFinished && JSON.stringify(gameTransfers(game)) !== JSON.stringify(gameTransfers(updated))
  if (finishing || (transfersChanged && await shouldNotifyCorrection(updated))) {
    after(() => notifyGameResults(updated, { corrected: !finishing }).catch(e => console.error('Game results notification failed', e)))
  }

  return toGameDetails(updated, group, player._id, await loadGameCaps(updated, group))
})

export const DELETE = route<{ id: string }>(async (req, { id }) => {
  const { player } = await requireAuth(req)
  const game = await loadGame(toObjectId(id))
  const group = await loadGroup(game.groupId)
  if (!gameAbilities(game, group, player._id).delete) {
    throw forbidden('Удалить игру может только её создатель или владелец группы')
  }
  await deleteGame(game)
  return { ok: true }
})

const objectIdString = z.string().regex(/^[0-9a-f]{24}$/i, 'некорректный идентификатор')

const gameOpSchema = z.discriminatedUnion('type', [
  z.object({ type: z.literal('addPlayer'), playerId: objectIdString }),
  z.object({ type: z.literal('removePlayer'), playerId: objectIdString }),
  z.object({ type: z.literal('setEntries'), playerId: objectIdString, from: z.number().int().min(0), to: z.number().int().min(0).max(1000) }),
  z.object({ type: z.literal('setSettings'), settings: gameSettingsSchema.partial() }),
  z.object({ type: z.literal('setMeta'), title: z.string().max(80).optional(), createdAt: gameDateSchema.optional() }),
])

const patchGameSchema = z.object({ ops: z.array(gameOpSchema).min(1).max(50) })

// Автосохранение идущей игры: операции применяются к свежему состоянию из базы,
// поэтому правки с нескольких телефонов сливаются. При гонке записи — до трёх попыток.
export const PATCH = route<{ id: string }>(async (req, { id }) => {
  const { player } = await requireAuth(req)
  const { ops } = await parseBody(req, patchGameSchema)
  const gameId = toObjectId(id)
  const db = await getDb()

  for (let attempt = 0; attempt < 3; attempt++) {
    const game = await loadGame(gameId)
    const group = await loadGroup(game.groupId)
    if (game.isFinished) {
      throw conflict('Игра уже завершена')
    }
    if (!gameAbilities(game, group, player._id).edit) {
      throw forbidden('Изменять игру могут только участники группы')
    }

    const capsFor = await makeCapsFor(game, group)
    let next: EditableGame
    try {
      next = applyOps(toEditable(game), ops, {
        capsFor,
        canAdd: playerId => isMember(group, toObjectId(playerId)),
      })
    }
    catch (e) {
      if (e instanceof GameOpError) {
        throw e.kind === 'conflict' ? conflict(e.message) : badRequest(e.message)
      }
      throw e
    }

    const updated = await db.games.findOneAndUpdate(
      { _id: game._id, ...(game.rev === undefined ? { rev: { $exists: false } } : { rev: game.rev }) },
      {
        $set: {
          title: next.title,
          createdAt: next.createdAt,
          settings: next.settings,
          players: next.players.map(p => ({ playerId: toObjectId(p.playerId), entries: p.entries })),
          updatedAt: Date.now(),
          updatedBy: player._id,
        },
        $inc: { rev: 1 },
      },
      { returnDocument: 'after' },
    )
    if (updated) {
      return toGameDetails(updated, group, player._id, capsFor(updated.settings))
    }
  }
  throw conflict('Игру одновременно меняют несколько человек, попробуйте ещё раз')
})

function toEditable(game: Game): EditableGame {
  return {
    title: game.title,
    createdAt: game.createdAt,
    settings: game.settings,
    players: game.players.map(p => ({ playerId: p.playerId.toString(), entries: p.entries })),
  }
}
