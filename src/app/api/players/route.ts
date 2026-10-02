import type { Player } from '@/types/db'
import { z } from 'zod'
import { getDb } from '@/core/db'
import { registerTelegramPlayer, requireAuth } from '@/server/auth'
import { toPublicPlayer } from '@/server/dto'
import { badRequest, parseBody, route, toObjectId } from '@/server/http'
import { loadGroup, requireMember } from '@/server/permissions'
import { avatarSchema } from '@/server/schemas'

const newPlayerSchema = z.object({
  firstName: z.string().trim().min(1, 'укажите имя').max(64),
  lastName: z.string().trim().max(64).optional().default(''),
  avatarUrl: avatarSchema.optional().default(''),
})

export const POST = route(async (req) => {
  // Совместимость со старыми клиентами: до обновления регистрация шла через этот адрес
  if (req.nextUrl.searchParams.get('useInitData') === 'true') {
    return toPublicPlayer(await registerTelegramPlayer(req))
  }

  const { player: caller } = await requireAuth(req)
  const group = await loadGroup(toObjectId(req.nextUrl.searchParams.get('groupId')))
  requireMember(group, caller._id)

  const body = await parseBody(req, newPlayerSchema)
  const player: Player = { ...body, createdAt: Date.now() }
  const db = await getDb()
  const { insertedId } = await db.players.insertOne(player)
  await db.groups.updateOne({ _id: group._id }, { $addToSet: { members: insertedId } })

  return toPublicPlayer({ ...player, _id: insertedId })
})

export const GET = route(async (req) => {
  await requireAuth(req)
  const groupId = req.nextUrl.searchParams.get('groupId')
  if (!groupId) {
    throw badRequest('Укажите группу')
  }
  const group = await loadGroup(toObjectId(groupId))
  const players = await (await getDb()).players.find({ _id: { $in: group.members } }).toArray()
  return players.map(toPublicPlayer)
})
