import { z } from 'zod'
import { getDb } from '@/core/db'
import { fullUpdateAchievments } from '@/lib/achievments'
import { requireAuth } from '@/server/auth'
import { badRequest, conflict, forbidden, notFound, parseBody, route, toObjectId } from '@/server/http'
import { isMember, loadGroup } from '@/server/permissions'
import { assertNotLocked, registerFailure, resetFailures } from '@/server/rateLimit'
import { pinSchema, zObjectId } from '@/server/schemas'

const claimSchema = z.object({
  groupId: zObjectId,
  pin: pinSchema.optional(),
})

// Пользователь Telegram «занимает» виртуального игрока группы: все игры и результаты переходят к нему,
// а виртуальный профиль удаляется
export const PUT = route<{ id: string }>(async (req, { id }) => {
  const { player: caller } = await requireAuth(req)
  const { groupId, pin } = await parseBody(req, claimSchema)
  const db = await getDb()

  const target = await db.players.findOne({ _id: toObjectId(id) })
  if (!target) {
    throw notFound('Игрок не найден')
  }
  if (target._id.equals(caller._id)) {
    throw badRequest('Это уже ваш профиль')
  }
  if (target.telegramId !== undefined && target.telegramId !== null) {
    throw forbidden('Этот профиль уже принадлежит пользователю Telegram')
  }
  const group = await loadGroup(groupId)
  if (!isMember(group, target._id)) {
    throw badRequest('Игрок не состоит в этой группе')
  }

  if (!isMember(group, caller._id)) {
    const limitKey = `pin:${caller._id}:${group._id}`
    assertNotLocked(limitKey)
    if (!group.pin || group.pin !== pin) {
      registerFailure(limitKey)
      throw forbidden('Неверный PIN')
    }
    resetFailures(limitKey)
  }

  const sharedGame = await db.games.findOne({ 'players.playerId': { $all: [caller._id, target._id] } }, { projection: { title: 1 } })
  if (sharedGame) {
    throw conflict(`Вы и этот игрок вместе участвовали в игре «${sharedGame.title}» — объединить профили нельзя`)
  }

  const session = db.client.client.startSession()
  try {
    await session.withTransaction(async () => {
      await db.games.updateMany(
        { 'players.playerId': target._id },
        { $set: { 'players.$[p].playerId': caller._id } },
        { arrayFilters: [{ 'p.playerId': target._id }], session },
      )
      await db.games.updateMany(
        { 'results.playerId': target._id },
        { $set: { 'results.$[r].playerId': caller._id } },
        { arrayFilters: [{ 'r.playerId': target._id }], session },
      )
      // $addToSet и $pull по одному полю нельзя сделать одним запросом
      await db.groups.updateMany({ members: target._id }, { $addToSet: { members: caller._id } }, { session })
      await db.groups.updateMany({ members: target._id }, { $pull: { members: target._id } }, { session })
      await db.players.deleteOne({ _id: target._id }, { session })
    })
  }
  finally {
    await session.endSession()
  }

  await fullUpdateAchievments(caller._id)
  return { ok: true }
})
