import { requireAuth } from '@/server/auth'
import { toMe } from '@/server/dto'
import { route } from '@/server/http'

export const GET = route(async (req) => {
  return toMe(await requireAuth(req))
})
