import { z } from 'zod'
import { getDb } from '@/core/db'
import { MODES, THEME_IDS } from '@/lib/appearance'
import { requireAuth } from '@/server/auth'
import { toMe } from '@/server/dto'
import { parseBody, route } from '@/server/http'

const appearanceSchema = z.object({
  theme: z.enum(THEME_IDS),
  mode: z.enum(MODES),
})

export const PUT = route(async (req) => {
  const auth = await requireAuth(req)
  const appearance = await parseBody(req, appearanceSchema)
  await (await getDb()).players.updateOne({ _id: auth.player._id }, { $set: { appearance } })
  return toMe({ ...auth, player: { ...auth.player, appearance } })
})
