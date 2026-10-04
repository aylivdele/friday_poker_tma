import type { Filter } from 'mongodb'
import type { FinishedGamesPage } from '@/types/api'
import type { Game } from '@/types/db'
import { z } from 'zod'
import { getDb } from '@/core/db'
import { requireAuth } from '@/server/auth'
import { toPublicGame } from '@/server/dto'
import { collectedPrizeFund, withGameContext } from '@/server/games'
import { badRequest, parseBody, route, toObjectId } from '@/server/http'
import { loadGroup, loadSeason, requireMember } from '@/server/permissions'
import { gameDateSchema, gameSettingsSchema, titleSchema, zObjectId } from '@/server/schemas'

const PAGE_SIZE = 20

export const GET = route(async (req) => {
  const { player } = await requireAuth(req)
  const params = req.nextUrl.searchParams
  const db = await getDb()
  const scope = params.get('scope')

  // Идущие игры во всех моих группах — даже если я в них не играю
  if (scope === 'live') {
    const groups = await db.groups.find({ members: player._id }, { projection: { _id: 1 } }).toArray()
    const games = await db.games.find({ groupId: { $in: groups.map(g => g._id) }, isFinished: false }).sort({ createdAt: -1, _id: -1 }).toArray()
    return withGameContext(games)
  }

  // Мои сыгранные игры постранично; курсор — «дата_id» последней игры страницы
  if (scope === 'finished') {
    const filter: Filter<Game> = { 'players.playerId': player._id, 'isFinished': true }
    const cursor = params.get('cursor')?.split('_')
    if (cursor?.length === 2) {
      const createdAt = Number(cursor[0])
      const id = toObjectId(cursor[1])
      Object.assign(filter, { $or: [{ createdAt: { $lt: createdAt } }, { createdAt, _id: { $lt: id } }] })
    }
    const games = await db.games.find(filter).sort({ createdAt: -1, _id: -1 }).limit(PAGE_SIZE + 1).toArray()
    const page = games.slice(0, PAGE_SIZE)
    const last = page.at(-1)
    const result: FinishedGamesPage = {
      items: await withGameContext(page),
      nextCursor: games.length > PAGE_SIZE && last ? `${last.createdAt}_${last._id}` : null,
    }
    return result
  }

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

  const settings = { ...body.settings }
  // Финал без указанного фонда (например, со старого клиента) разыгрывает собранное за сезон
  if (settings.isFinal && settings.prizeFund === undefined) {
    settings.prizeFund = await collectedPrizeFund(season._id)
  }

  const game: Game = {
    groupId: group._id,
    seasonId: season._id,
    title: body.title,
    createdAt: body.createdAt,
    settings,
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
