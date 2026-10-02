import type { TableGame } from './seasonTable'
import { describe, expect, it } from 'vitest'
import { buildSeasonTable } from './seasonTable'

const settings = { isFinal: false, firstEntryCost: 100, reEntryCost: 100, maxReEntries: 5 }

function game(id: string, createdAt: number, players: string[], winner: string, isFinal = false): TableGame {
  return {
    _id: id,
    title: `Игра ${id}`,
    createdAt,
    players: players.map(playerId => ({ playerId, entries: 0 })),
    results: [{ playerId: winner, score: players.length }],
    settings: { ...settings, isFinal },
  }
}

describe('buildSeasonTable', () => {
  it('игры одного дня упорядочены по _id', () => {
    const table = buildSeasonTable([
      game('000000000000000000000002', 1000, ['a', 'b'], 'a'),
      game('000000000000000000000001', 1000, ['a', 'b'], 'b'),
    ])
    expect(table.games.map(g => g._id)).toEqual(['000000000000000000000001', '000000000000000000000002'])
  })

  it('считает итоги, места и победителя финала', () => {
    const table = buildSeasonTable([
      game('1', 1, ['a', 'b', 'c'], 'a'),
      game('2', 2, ['a', 'b', 'c'], 'b', true),
    ])
    expect(table.totals).toEqual({ a: 100, b: 100, c: -200 })
    expect(table.finalWinners).toEqual(['b'])
    expect(table.seasonPlaces.c).toBe(3)
  })
})
