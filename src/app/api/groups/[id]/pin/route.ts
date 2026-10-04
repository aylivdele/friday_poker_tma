import { z } from 'zod'
import { getDb } from '@/core/db'
import { requireAuth } from '@/server/auth'
import { parseBody, route, toObjectId } from '@/server/http'
import { loadGroup, requireOwner } from '@/server/permissions'
import { pinSchema } from '@/server/schemas'

// PIN видит и меняет только владелец группы
export const GET = route<{ id: string }>(async (req, { id }) => {
  const { player } = await requireAuth(req)
  const group = await loadGroup(toObjectId(id))
  requireOwner(group, player._id)
  return { pin: group.pin ?? null }
})

export const PUT = route<{ id: string }>(async (req, { id }) => {
  const { player } = await requireAuth(req)
  const group = await loadGroup(toObjectId(id))
  requireOwner(group, player._id)
  const { pin } = await parseBody(req, z.object({ pin: pinSchema }))
  await (await getDb()).groups.updateOne({ _id: group._id }, { $set: { pin } })
  return { pin }
})
