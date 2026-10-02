import { requireAuth } from '@/server/auth'
import { toPublicGroup } from '@/server/dto'
import { deleteGroupCascade } from '@/server/games'
import { route, toObjectId } from '@/server/http'
import { loadGroup, requireOwner } from '@/server/permissions'

export const GET = route<{ id: string }>(async (req, { id }) => {
  const { player } = await requireAuth(req)
  return toPublicGroup(await loadGroup(toObjectId(id)), player._id)
})

export const DELETE = route<{ id: string }>(async (req, { id }) => {
  const { player } = await requireAuth(req)
  const group = await loadGroup(toObjectId(id))
  requireOwner(group, player._id)
  const deletedGames = await deleteGroupCascade(group)
  return { ok: true, deletedGames }
})
