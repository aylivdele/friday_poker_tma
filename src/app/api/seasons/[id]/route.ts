import { requireAuth } from '@/server/auth'
import { toPublicSeason } from '@/server/dto'
import { deleteSeasonCascade } from '@/server/games'
import { route, toObjectId } from '@/server/http'
import { loadGroup, loadSeason, requireOwner } from '@/server/permissions'

export const GET = route<{ id: string }>(async (req, { id }) => {
  const { player } = await requireAuth(req)
  const season = await loadSeason(toObjectId(id))
  const group = await loadGroup(season.groupId)
  return toPublicSeason(season, group, player._id)
})

export const DELETE = route<{ id: string }>(async (req, { id }) => {
  const { player } = await requireAuth(req)
  const season = await loadSeason(toObjectId(id))
  const group = await loadGroup(season.groupId)
  requireOwner(group, player._id)
  const deletedGames = await deleteSeasonCascade(season._id)
  return { ok: true, deletedGames }
})
