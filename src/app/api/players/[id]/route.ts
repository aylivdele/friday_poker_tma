import { getDb } from '@/core/db'
import { requireAuth } from '@/server/auth'
import { toPublicPlayer } from '@/server/dto'
import { notFound, route, toObjectId } from '@/server/http'

export const GET = route<{ id: string }>(async (req, { id }) => {
  await requireAuth(req)
  const player = await (await getDb()).players.findOne({ _id: toObjectId(id) })
  if (!player) {
    throw notFound('Игрок не найден')
  }
  return toPublicPlayer(player)
})
