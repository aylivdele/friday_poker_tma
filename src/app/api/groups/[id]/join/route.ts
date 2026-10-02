import { z } from 'zod'
import { getDb } from '@/core/db'
import { requireAuth } from '@/server/auth'
import { badRequest, forbidden, route, toObjectId } from '@/server/http'
import { isMember, loadGroup } from '@/server/permissions'
import { assertNotLocked, registerFailure, resetFailures } from '@/server/rateLimit'

const joinSchema = z.object({ pin: z.string().optional() })

export const PUT = route<{ id: string }>(async (req, { id }) => {
  const { player } = await requireAuth(req)
  const group = await loadGroup(toObjectId(id))

  // PIN передаётся в теле; query-параметр оставлен для старых клиентов
  const body = joinSchema.safeParse(await req.json().catch(() => ({})))
  const pin = (body.success ? body.data.pin : undefined) ?? req.nextUrl.searchParams.get('pin')

  if (isMember(group, player._id)) {
    throw badRequest('Вы уже состоите в этой группе')
  }

  const limitKey = `pin:${player._id}:${group._id}`
  assertNotLocked(limitKey)
  if (!group.pin || group.pin !== pin) {
    registerFailure(limitKey)
    throw forbidden('Неверный PIN')
  }
  resetFailures(limitKey)

  await (await getDb()).groups.updateOne({ _id: group._id }, { $addToSet: { members: player._id } })
  return { ok: true }
})
