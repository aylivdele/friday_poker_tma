import { getDb } from '@/core/db'
import { requireAuth } from '@/server/auth'
import { badRequest, route, toObjectId } from '@/server/http'
import { isMember, isOwner, loadGroup } from '@/server/permissions'

export const PUT = route<{ id: string }>(async (req, { id }) => {
  const { player } = await requireAuth(req)
  const group = await loadGroup(toObjectId(id))
  if (!isMember(group, player._id)) {
    throw badRequest('Вы не состоите в этой группе')
  }
  if (isOwner(group, player._id)) {
    throw badRequest('Владелец не может покинуть группу — её можно только удалить')
  }
  await (await getDb()).groups.updateOne({ _id: group._id }, { $pull: { members: player._id } })
  return { ok: true }
})
