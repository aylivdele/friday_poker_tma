import type { PlayerDetails } from '@/types/api'
import { z } from 'zod'
import { getDb } from '@/core/db'
import { requireAuth } from '@/server/auth'
import { toPublicPlayer } from '@/server/dto'
import { forbidden, notFound, parseBody, route, toObjectId } from '@/server/http'
import { canEditPlayer } from '@/server/permissions'
import { avatarSchema } from '@/server/schemas'

async function loadPlayer(id: string) {
  const player = await (await getDb()).players.findOne({ _id: toObjectId(id) })
  if (!player) {
    throw notFound('Игрок не найден')
  }
  return player
}

export const GET = route<{ id: string }>(async (req, { id }): Promise<PlayerDetails> => {
  const { player: caller } = await requireAuth(req)
  const player = await loadPlayer(id)
  return { ...toPublicPlayer(player), can: { edit: await canEditPlayer(player, caller._id) } }
})

const updatePlayerSchema = z.object({
  firstName: z.string().trim().min(1, 'укажите имя').max(64).optional(),
  lastName: z.string().trim().max(64).optional(),
  avatarUrl: avatarSchema.optional(),
})

export const PATCH = route<{ id: string }>(async (req, { id }): Promise<PlayerDetails> => {
  const { player: caller } = await requireAuth(req)
  const target = await loadPlayer(id)
  if (!await canEditPlayer(target, caller._id)) {
    throw forbidden(target.telegramId != null
      ? 'Профиль пользователя Telegram меняется в самом Telegram'
      : 'Изменять игрока могут только участники его группы')
  }
  const patch = await parseBody(req, updatePlayerSchema)
  const updated = await (await getDb()).players.findOneAndUpdate({ _id: target._id }, { $set: patch }, { returnDocument: 'after' })
  return { ...toPublicPlayer(updated!), can: { edit: true } }
})
