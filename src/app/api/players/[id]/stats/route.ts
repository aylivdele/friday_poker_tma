import type { PlayerStats } from '@/types/api'
import { getDb } from '@/core/db'
import { calcGameBalances, getGameWinners } from '@/domain/balances'
import { requireAuth } from '@/server/auth'
import { withGameContext } from '@/server/games'
import { notFound, route, toObjectId } from '@/server/http'

const RECENT = 5

// Сводка игрока по всем сыгранным играм
export const GET = route<{ id: string }>(async (req, { id }): Promise<PlayerStats> => {
  await requireAuth(req)
  const db = await getDb()
  const playerId = toObjectId(id)
  if (!await db.players.findOne({ _id: playerId }, { projection: { _id: 1 } })) {
    throw notFound('Игрок не найден')
  }

  const games = await db.games.find({ 'players.playerId': playerId, 'isFinished': true }).sort({ createdAt: -1, _id: -1 }).toArray()
  const groups = new Map<string, { games: number, balance: number }>()
  let balance = 0
  let gamesInPlus = 0
  let finalWins = 0
  let best: { game: typeof games[number], balance: number } | null = null

  for (const game of games) {
    const value = calcGameBalances(game)[id] ?? 0
    balance += value
    if (value > 0) {
      gamesInPlus++
    }
    if (game.settings.isFinal && getGameWinners(game).includes(id)) {
      finalWins++
    }
    if (value > 0 && (!best || value > best.balance)) {
      best = { game, balance: value }
    }
    const group = groups.get(game.groupId.toString()) ?? { games: 0, balance: 0 }
    group.games++
    group.balance += value
    groups.set(game.groupId.toString(), group)
  }

  const groupDocs = await db.groups.find({ _id: { $in: [...groups.keys()].map(groupId => toObjectId(groupId)) } }, { projection: { title: 1 } }).toArray()
  const [bestGame] = best ? await withGameContext([best.game]) : []

  return {
    games: games.length,
    gamesInPlus,
    finalWins,
    balance,
    best: bestGame && best ? { game: bestGame, balance: best.balance } : null,
    groups: groupDocs
      .map(g => ({ groupId: g._id.toString(), title: g.title, ...groups.get(g._id.toString())! }))
      .sort((a, b) => b.games - a.games),
    recent: await withGameContext(games.slice(0, RECENT)),
  }
})
