import type { NextRequest } from 'next/server'
import type { SeasonTableResponse } from '@/types/api'
import { ObjectId } from 'mongodb'
import { NextResponse } from 'next/server'
import { getDb } from '@/core/db'

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }): Promise<NextResponse<SeasonTableResponse>> {
  const { id } = await params
  const db = await getDb()
  const games = await db.games.find({
    seasonId: new ObjectId(id),
    isFinished: true,
  }).toArray()

  const playersMap = new Map()
  const cells: Record<string, Record<string, number>> = {}

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

  const players = (await db.players.find({ _id: { $in: Object.keys(totals).map(id => new ObjectId(id)) } }).toArray()).map(p => ({ ...p, _id: p._id.toString() }))

  return NextResponse.json({
    finalWinners,
    cells,
    totals,
    seasonPlaces,
    players,
    games: games.map(g => ({ _id: g._id.toString(), title: g.title, isFinal: g.settings.isFinal })),
  })
}
