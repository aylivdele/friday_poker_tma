import { after } from 'next/server'
import { z } from 'zod'
import { getDb } from '@/core/db'
import { recalculateForGames } from '@/lib/achievments'
import { requireAuth } from '@/server/auth'
import { toGameDetails } from '@/server/dto'
import { loadGameCaps, validateResults } from '@/server/games'
import { conflict, forbidden, parseBody, route, toObjectId } from '@/server/http'
import { notifyGameResults } from '@/server/notifications'
import { gameAbilities, loadGame, loadGroup } from '@/server/permissions'
import { gameResultSchema } from '@/server/schemas'

const finishSchema = z.object({
  // версия, по которой пользователь распределял стеки: если состав успели поменять, результаты надо проверить заново
  rev: z.number().int().min(0),
  results: z.array(gameResultSchema).min(1).max(100),
})

export const POST = route<{ id: string }>(async (req, { id }) => {
  const { player } = await requireAuth(req)
  const { rev, results } = await parseBody(req, finishSchema)
  const game = await loadGame(toObjectId(id))
  const group = await loadGroup(game.groupId)

  if (game.isFinished) {
    throw conflict('Игра уже завершена')
  }
  if (!gameAbilities(game, group, player._id).finish) {
    throw forbidden('Завершить игру могут только участники группы')
  }
  if ((game.rev ?? 0) !== rev) {
    throw conflict('Состав игры изменился, пока вы распределяли стеки — проверьте результаты')
  }

  const validResults = validateResults(game.players, results)
  const now = Date.now()
  const updated = await (await getDb()).games.findOneAndUpdate(
    { _id: game._id, isFinished: false, ...(game.rev === undefined ? { rev: { $exists: false } } : { rev: game.rev }) },
    { $set: { isFinished: true, finishedAt: now, results: validResults, updatedAt: now, updatedBy: player._id }, $inc: { rev: 1 } },
    { returnDocument: 'after' },
  )
  if (!updated) {
    throw conflict('Состав игры изменился, пока вы распределяли стеки — проверьте результаты')
  }

  await recalculateForGames([updated])
  // Итоги в Telegram — после ответа, чтобы не задерживать завершение
  after(() => notifyGameResults(updated).catch(e => console.error('Game results notification failed', e)))
  return toGameDetails(updated, group, player._id, await loadGameCaps(updated, group))
})
