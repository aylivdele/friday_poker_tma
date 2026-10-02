// Показывает, как изменятся итоги сезонов после перехода на пропорциональное деление банка.
// Только читает базу. Запуск: pnpm tsx --env-file=.env scripts/compare-balances.ts
import type { Game } from '@/types/db'
import process from 'node:process'
import { getDb } from '@/core/db'
import { buildSeasonTable } from '@/domain/seasonTable'

// Формула, которая действовала до перехода
function oldBalances(game: Game): Record<string, number> {
  const balances: Record<string, number> = {}
  for (const p of game.players) {
    const id = p.playerId.toString()
    balances[id] = (balances[id] ?? 0) - (game.settings.firstEntryCost + p.entries * game.settings.reEntryCost)
  }
  for (const r of game.results ?? []) {
    const id = r.playerId.toString()
    const payout = game.settings.isFinal
      ? game.players.length * game.settings.firstEntryCost + (r.score - game.players.length) * game.settings.reEntryCost
      : r.score * game.settings.reEntryCost
    balances[id] = (balances[id] ?? 0) + payout
  }
  return balances
}

async function main() {
  const db = await getDb()
  const seasons = await db.seasons.find({}).toArray()
  const players = new Map((await db.players.find({}, { projection: { firstName: 1, lastName: 1 } }).toArray())
    .map(p => [p._id.toString(), [p.firstName, p.lastName].filter(Boolean).join(' ')]))
  let changedSeasons = 0

  for (const season of seasons) {
    const games = await db.games.find({ seasonId: season._id, isFinished: true }).toArray()
    const newTotals = buildSeasonTable(games).totals
    const oldTotals: Record<string, number> = {}
    for (const game of games) {
      for (const [id, value] of Object.entries(oldBalances(game))) {
        oldTotals[id] = (oldTotals[id] ?? 0) + value
      }
    }

    const changes = Object.keys({ ...oldTotals, ...newTotals })
      .map(id => ({ id, before: Math.round(oldTotals[id] ?? 0), after: Math.round(newTotals[id] ?? 0) }))
      .filter(c => c.before !== c.after)
    if (changes.length === 0) {
      continue
    }

    changedSeasons++
    const group = await db.groups.findOne({ _id: season.groupId }, { projection: { title: 1 } })
    console.log(`\n${group?.title ?? '?'} / ${season.title}`)
    for (const c of changes) {
      console.log(`  ${players.get(c.id) ?? c.id}: ${c.before} → ${c.after}`)
    }
  }

  console.log(changedSeasons ? `\nИзменится сезонов: ${changedSeasons} из ${seasons.length}` : `\nНи один из ${seasons.length} сезонов не изменится`)
  process.exit(0)
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
