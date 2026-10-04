import type { Player } from '@/types/db'
import { z } from 'zod'
import { getDb } from '@/core/db'
import { requireAuth } from '@/server/auth'
import { toMe } from '@/server/dto'
import { parseBody, route } from '@/server/http'

const notificationsSchema = z.object({
  games: z.boolean().optional(),
  // клиент сообщает, что человек разрешил боту писать (requestWriteAccess)
  botCanWrite: z.literal(true).optional(),
})

export const PUT = route(async (req) => {
  const auth = await requireAuth(req)
  const body = await parseBody(req, notificationsSchema)
  const patch: Partial<Player> = {}
  if (body.games !== undefined) {
    patch.notifyGames = body.games
  }
  if (body.botCanWrite) {
    patch.botCanWrite = true
  }
  await (await getDb()).players.updateOne({ _id: auth.player._id }, { $set: patch })
  return toMe({ ...auth, player: { ...auth.player, ...patch } })
})
