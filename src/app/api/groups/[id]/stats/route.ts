import type { GroupStats } from '@/types/api'
import { getDb } from '@/core/db'
import { calcGameBalances, getGameWinners } from '@/domain/balances'
import { requireAuth } from '@/server/auth'
import { route, toObjectId } from '@/server/http'
import { loadGroup } from '@/server/permissions'

// Сводка по игрокам группы за все сезоны: сыграно игр, баланс, победы в финалах
export const GET = route<{ id: string }>(async (req, { id }): Promise<GroupStats> => {
  await requireAuth(req)
  const group = await loadGroup(toObjectId(id))
  const games = await (await getDb()).games.find({ groupId: group._id, isFinished: true }).toArray()

  const players: GroupStats['players'] = {}
  for (const game of games) {
    const winners = game.settings.isFinal ? new Set(getGameWinners(game)) : new Set<string>()
    for (const [playerId, balance] of Object.entries(calcGameBalances(game))) {
      const stats = players[playerId] ??= { games: 0, balance: 0, finalWins: 0 }
      stats.games++
      stats.balance += balance
      if (winners.has(playerId)) {
        stats.finalWins++
      }
    }
  }
  return { games: games.length, players }
})
