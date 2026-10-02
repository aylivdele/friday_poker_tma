import type { Game } from '@/types/db'
import { z } from 'zod'
import { getDb } from '@/core/db'
import { requireAuth } from '@/server/auth'
import { toPublicGame } from '@/server/dto'
import { badRequest, parseBody, route, toObjectId } from '@/server/http'
import { loadGroup, loadSeason, requireMember } from '@/server/permissions'
import { gameDateSchema, gameSettingsSchema, titleSchema, zObjectId } from '@/server/schemas'

export const GET = route(async (req) => {
  const { player } = await requireAuth(req)
  const params = req.nextUrl.searchParams
  const db = await getDb()

  // useInitData — старое название параметра, оставлено для совместимости
  if (params.get('mine') === '1' || params.get('useInitData') === 'true') {
    const games = await db.games.find({ 'players.playerId': player._id }).sort({ createdAt: -1, _id: -1 }).toArray()
    return games.map(toPublicGame)
  }

  const seasonId = params.get('seasonId')
  if (!seasonId) {
    throw badRequest('Укажите сезон')
  }
  const games = await db.games.find({ seasonId: toObjectId(seasonId) }).sort({ createdAt: -1, _id: -1 }).toArray()
  return games.map(toPublicGame)
})

const newGameSchema = z.object({
  seasonId: zObjectId,
  title: titleSchema,
  createdAt: gameDateSchema,
  settings: gameSettingsSchema,
})

export const POST = route(async (req) => {
  const { player } = await requireAuth(req)
  const body = await parseBody(req, newGameSchema)
  const season = await loadSeason(body.seasonId)
  const group = await loadGroup(season.groupId)
  requireMember(group, player._id)

  const game: Game = {
    groupId: group._id,
    seasonId: season._id,
    title: body.title,
    createdAt: body.createdAt,
    settings: body.settings,
    isFinished: false,
    players: [],
    creater: player._id,
    rev: 0,
  }
  const db = await getDb()
  const { insertedId } = await db.games.insertOne(game)
  await db.seasons.updateOne({ _id: season._id }, { $addToSet: { gameIds: insertedId } })
  return insertedId.toString()
})
