import type { BalanceGame } from './balances'
import type { SeasonTable } from '@/types/api'
import { calcGameBalances, calcSeasonEntryShares, getGameWinners } from './balances'

export interface TableGame extends BalanceGame {
  _id: { toString: () => string }
  title: string
  createdAt: number
}

// Игры в один день упорядочиваем по _id: ObjectId растёт со временем создания
export function compareGames(a: Pick<TableGame, '_id' | 'createdAt'>, b: Pick<TableGame, '_id' | 'createdAt'>) {
  return a.createdAt - b.createdAt || a._id.toString().localeCompare(b._id.toString())
}

export function buildSeasonTable(finishedGames: TableGame[]): SeasonTable {
  const games = [...finishedGames].sort(compareGames)
  const cells: Record<string, Record<string, number>> = {}

  for (const game of games) {
    const gameId = game._id.toString()
    for (const [playerId, balance] of Object.entries(calcGameBalances(game))) {
      cells[playerId] ??= {}
      cells[playerId][gameId] = balance
    }
  }

  const totals: Record<string, number> = {}
  for (const playerId in cells) {
    totals[playerId] = Object.values(cells[playerId]).reduce((a, b) => a + b, 0)
  }

  const finalGame = games.find(g => g.settings.isFinal)
  const seasonPlaces: Record<string, 1 | 2 | 3> = {}
  Object.entries(totals)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3)
    .forEach(([playerId], index) => {
      seasonPlaces[playerId] = (index + 1) as 1 | 2 | 3
    })

  return {
    seasonEntries: calcSeasonEntryShares(games),
    finalWinners: finalGame ? getGameWinners(finalGame) : [],
    cells,
    totals,
    seasonPlaces,
    games: games.map(g => ({ _id: g._id.toString(), title: g.title, isFinal: g.settings.isFinal })),
    updatedAt: Date.now(),
  }
}
