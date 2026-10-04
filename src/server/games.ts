import type { ClientSession, ObjectId, WithId } from 'mongodb'
import type { GameListItem } from '@/types/api'
import type { Game, GamePlayer, GameResult, GameSettings, Group } from '@/types/db'
import { getDb } from '@/core/db'
import { calcEntryCaps, totalStacks } from '@/domain/balances'
import { buildSeasonTable } from '@/domain/seasonTable'
import { recalculateAchievments } from '@/lib/achievments'
import { toPublicGame } from './dto'
import { badRequest } from './http'

export async function loadSeasonTable(seasonId: ObjectId) {
  const games = await (await getDb()).games.find({ seasonId, isFinished: true }).toArray()
  return buildSeasonTable(games)
}

// Возвращает функцию «настройки → лимиты входов»: сыгранные игры сезона загружаются один раз
export async function makeCapsFor(game: WithId<Game>, group: Group): Promise<(settings: GameSettings) => Record<string, number>> {
  const playerIds = [...new Set([...group.members, ...game.players.map(p => p.playerId)].map(id => id.toString()))]
  const seasonGames = game.seasonId
    ? await (await getDb()).games.find({ seasonId: game.seasonId, isFinished: true, _id: { $ne: game._id } }).toArray()
    : []
  return settings => calcEntryCaps({ settings }, playerIds, seasonGames)
}

export async function loadGameCaps(game: WithId<Game>, group: Group): Promise<Record<string, number>> {
  return (await makeCapsFor(game, group))(game.settings)
}

export function validateResults(players: GamePlayer[], results: GameResult[]): GameResult[] {
  const inGame = new Set(players.map(p => p.playerId.toString()))
  const seen = new Set<string>()
  for (const r of results) {
    const id = r.playerId.toString()
    if (!inGame.has(id)) {
      throw badRequest('В результатах есть игрок, которого нет в игре')
    }
    if (seen.has(id)) {
      throw badRequest('Игрок указан в результатах дважды')
    }
    seen.add(id)
  }
  const distributed = results.reduce((acc, r) => acc + r.score, 0)
  const total = totalStacks({ players })
  if (distributed !== total) {
    throw badRequest(`Распределено ${distributed} из ${total} стеков — распределите все стеки`)
  }
  return results.filter(r => r.score > 0)
}

function collectPlayers(games: Pick<Game, 'players'>[]) {
  const ids = new Map<string, ObjectId>()
  for (const game of games) {
    for (const p of game.players) {
      ids.set(p.playerId.toString(), p.playerId)
    }
  }
  return [...ids.values()]
}

async function inTransaction(work: (session: ClientSession) => Promise<void>) {
  const db = await getDb()
  const session = db.client.client.startSession()
  try {
    await session.withTransaction(() => work(session))
  }
  finally {
    await session.endSession()
  }
}

export async function deleteGame(game: WithId<Game>) {
  const db = await getDb()
  await inTransaction(async (session) => {
    if (game.seasonId) {
      await db.seasons.updateOne({ _id: game.seasonId }, { $pull: { gameIds: game._id } }, { session })
    }
    await db.games.deleteOne({ _id: game._id }, { session })
  })
  await recalculateAchievments(collectPlayers([game]))
}

export async function deleteSeasonCascade(seasonId: ObjectId) {
  const db = await getDb()
  const games = await db.games.find({ seasonId }, { projection: { players: 1 } }).toArray()
  await inTransaction(async (session) => {
    await db.games.deleteMany({ seasonId }, { session })
    await db.seasons.deleteOne({ _id: seasonId }, { session })
  })
  await recalculateAchievments(collectPlayers(games))
  return games.length
}

export async function deleteGroupCascade(group: WithId<Group>) {
  const db = await getDb()
  const games = await db.games.find({ groupId: group._id }, { projection: { players: 1 } }).toArray()
  // Виртуальных игроков, которые больше нигде не состоят, удаляем вместе с группой
  const virtualPlayers = await db.players.find({ _id: { $in: group.members }, telegramId: { $exists: false } }, { projection: { _id: 1 } }).toArray()
  const orphanIds: ObjectId[] = []
  for (const p of virtualPlayers) {
    const otherGroup = await db.groups.findOne({ _id: { $ne: group._id }, members: p._id }, { projection: { _id: 1 } })
    if (!otherGroup) {
      orphanIds.push(p._id)
    }
  }

  await inTransaction(async (session) => {
    await db.games.deleteMany({ groupId: group._id }, { session })
    await db.seasons.deleteMany({ groupId: group._id }, { session })
    await db.groups.deleteOne({ _id: group._id }, { session })
    if (orphanIds.length) {
      await db.players.deleteMany({ _id: { $in: orphanIds } }, { session })
    }
  })
  await recalculateAchievments(collectPlayers(games).filter(id => !orphanIds.some(o => o.equals(id))))
  return games.length
}

export async function countGames(filter: { seasonId?: ObjectId, groupId?: ObjectId }) {
  return (await getDb()).games.countDocuments(filter)
}

// Добавляет к играм названия группы и сезона — для общих списков
export async function withGameContext(games: WithId<Game>[]): Promise<GameListItem[]> {
  const db = await getDb()
  const groups = await db.groups.find({ _id: { $in: [...new Set(games.map(g => g.groupId))] } }, { projection: { title: 1 } }).toArray()
  const seasonIds = games.map(g => g.seasonId).filter((id): id is ObjectId => !!id)
  const seasons = await db.seasons.find({ _id: { $in: seasonIds } }, { projection: { title: 1 } }).toArray()
  const groupTitles = new Map(groups.map(g => [g._id.toString(), g.title]))
  const seasonTitles = new Map(seasons.map(s => [s._id.toString(), s.title]))
  return games.map(g => ({
    ...toPublicGame(g),
    groupTitle: groupTitles.get(g.groupId.toString()),
    seasonTitle: g.seasonId ? seasonTitles.get(g.seasonId.toString()) : undefined,
  }))
}
