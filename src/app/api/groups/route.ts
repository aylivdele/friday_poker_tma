import type { Filter } from 'mongodb'
import type { Group } from '@/types/db'
import { z } from 'zod'
import { getDb } from '@/core/db'
import { requireAuth } from '@/server/auth'
import { toPublicGroup } from '@/server/dto'
import { escapeRegex, parseBody, route } from '@/server/http'
import { pinSchema, titleSchema } from '@/server/schemas'

export const GET = route(async (req) => {
  const { player } = await requireAuth(req)
  const params = req.nextUrl.searchParams
  const search = params.get('search')?.trim()

  let filter: Filter<Group> = {}
  // useInitData — старое название параметра, оставлено для совместимости
  if (params.get('mine') === '1' || params.get('useInitData') === 'true') {
    filter = { members: player._id }
  }
  else if (search) {
    filter = { title: { $regex: escapeRegex(search), $options: 'i' } }
  }

  const groups = await (await getDb()).groups.find(filter).sort({ createdAt: -1 }).toArray()
  return groups.map(g => toPublicGroup(g, player._id))
})

const newGroupSchema = z.object({
  title: titleSchema,
  pin: pinSchema,
})

export const POST = route(async (req) => {
  const { player } = await requireAuth(req)
  const { title, pin } = await parseBody(req, newGroupSchema)
  const group: Group = {
    title,
    pin,
    ownerId: player._id,
    members: [player._id],
    createdAt: Date.now(),
  }
  const { insertedId } = await (await getDb()).groups.insertOne(group)
  return insertedId.toString()
})
