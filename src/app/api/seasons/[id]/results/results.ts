import type { SeasonTable } from '@/types/api'
import { ObjectId, WithId } from 'mongodb'
import { getDb } from '@/core/db'
import { Game } from '@/types/db'

export async function calculateSeasonResults(seasonId: string): Promise<SeasonTable> {
  const db = await getDb()
  const games = await db.games.find({
    seasonId: new ObjectId(seasonId),
    isFinished: true,
  }).toArray() as Array<WithId<Game>>
  games.sort((a, b) => a.createdAt - b.createdAt)

  const playersMap = new Map()
  const cells: Record<string, Record<string, number>> = {}
  const seasonEntries: Record<string, number> = {}
  let maxSeasonEntries = 0

  for (const game of games) {
    const gameId = game._id.toString()

    for (const p of game.players) {
      const playerId = p.playerId.toString()
      playersMap.set(playerId, true)

      const cost
      = game.settings.firstEntryCost + (p.entries * game.settings.reEntryCost)

      cells[playerId] ??= {}
      cells[playerId][gameId]
      = (cells[playerId][gameId] || 0) - cost
    }

    for (const r of game.results || []) {
      const playerId = r.playerId.toString()

      cells[playerId] ??= {}
      if (!game.settings.isFinal) {
        cells[playerId][gameId]
      = (cells[playerId][gameId] || 0) + (r.score * game.settings.reEntryCost)
      }
      else {
        const entries = game.players.length
        const reEntries = r.score - entries
        cells[playerId][gameId]
      = (cells[playerId][gameId] || 0) + (entries * game.settings.firstEntryCost) + (reEntries * game.settings.reEntryCost)
      }
    }

    if (!game.settings.isFinal) {
      maxSeasonEntries += game.settings.maxReEntries + 1
      for (const p of game.players) {
        const playerId = p.playerId.toString()
        let entries = 1 + p.entries
        if (game.results?.some(r => r.playerId.equals(p.playerId))) {
          entries = game.settings.maxReEntries + 1
        }
        seasonEntries[playerId] = (seasonEntries[playerId] ?? 0) + entries
      }
    }
  }
  const totals: Record<string, number> = {}

  for (const playerId in cells) {
    totals[playerId] = Object.values(cells[playerId]).reduce(
      (a, b) => a + b,
      0,
    )
  }

  const finalGame = games.find(g => g.settings.isFinal)

  let finalWinners: string[] = []

  if (finalGame) {
    let max = -Infinity

    for (const playerId in cells) {
      const value = cells[playerId]?.[finalGame._id.toString()] ?? -Infinity

      if (value > max) {
        max = value
        finalWinners = [playerId]
      }
      else if (value === max) {
        finalWinners.push(playerId)
      }
    }
  }

  const sorted = Object.entries(totals)
    .sort((a, b) => b[1] - a[1])

  const seasonPlaces: Record<string, 1 | 2 | 3> = {}

  sorted.slice(0, 3).forEach(([playerId], index) => {
    seasonPlaces[playerId] = (index + 1) as 1 | 2 | 3
  })

  return {
    seasonEntries: Object.fromEntries(Object.entries(seasonEntries).map(([playerId, entries]) => ([playerId, entries / maxSeasonEntries]))),
    finalWinners,
    cells,
    totals,
    seasonPlaces,
    games: games.map(g => ({ _id: g._id.toString(), title: g.title, isFinal: g.settings.isFinal })),
    updatedAt: Date.now(),
  }
}
