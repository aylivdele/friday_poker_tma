import type { SeasonTableResponse } from '@/types/api'
import { getDb } from '@/core/db'
import { requireAuth } from '@/server/auth'
import { toPublicPlayer } from '@/server/dto'
import { loadSeasonTable } from '@/server/games'
import { route, toObjectId } from '@/server/http'
import { loadSeason } from '@/server/permissions'

export const GET = route<{ id: string }>(async (req, { id }): Promise<SeasonTableResponse> => {
  await requireAuth(req)
  const season = await loadSeason(toObjectId(id))
  const table = await loadSeasonTable(season._id)

  const playerIds = Object.keys(table.totals).map(playerId => toObjectId(playerId))
  const players = (await (await getDb()).players.find({ _id: { $in: playerIds } }).toArray())
    .map(toPublicPlayer)
    .sort((a, b) => (table.totals[b._id] ?? 0) - (table.totals[a._id] ?? 0))

  return { ...table, players }
})
