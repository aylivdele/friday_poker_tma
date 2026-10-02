import type { Season } from '@/types/db'
import { z } from 'zod'
import { getDb } from '@/core/db'
import { requireAuth } from '@/server/auth'
import { toPublicSeason } from '@/server/dto'
import { parseBody, route, toObjectId } from '@/server/http'
import { loadGroup, requireMember } from '@/server/permissions'
import { zObjectId } from '@/server/schemas'

export const GET = route(async (req) => {
  const { player } = await requireAuth(req)
  const group = await loadGroup(toObjectId(req.nextUrl.searchParams.get('groupId')))
  const seasons = await (await getDb()).seasons.find({ groupId: group._id }).sort({ _id: -1 }).toArray()
  return seasons.map(s => toPublicSeason(s, group, player._id))
})

const newSeasonSchema = z.object({
  groupId: zObjectId,
  title: z.string().trim().max(80).optional(),
})

export const POST = route(async (req) => {
  const { player } = await requireAuth(req)
  const { groupId, title } = await parseBody(req, newSeasonSchema)
  const group = await loadGroup(groupId)
  requireMember(group, player._id)

  const season: Season = {
    groupId: group._id,
    title: title || defaultSeasonTitle(),
    gameIds: [],
  }
  const { insertedId } = await (await getDb()).seasons.insertOne(season)
  return insertedId.toString()
})

function defaultSeasonTitle() {
  const date = new Intl.DateTimeFormat('ru-RU', { month: 'long', year: 'numeric' }).format(new Date())
  return `Сезон ${date}`
}
