import type { Filter } from 'mongodb'
import type { Game } from '@/types/db'
import { z } from 'zod'
import { getDb } from '@/core/db'
import { recalculateAchievments } from '@/lib/achievments'
import { requireAuth } from '@/server/auth'
import { toGameDetails } from '@/server/dto'
import { deleteGame, loadGameCaps, validateResults } from '@/server/games'
import { badRequest, conflict, forbidden, parseBody, route, toObjectId } from '@/server/http'
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
    const affected = [...game.players, ...updated.players].map(p => p.playerId)
    await recalculateAchievments(affected.filter((p, i) => affected.findIndex(o => o.equals(p)) === i))
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
