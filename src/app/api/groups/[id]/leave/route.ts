import type { NextRequest } from 'next/dist/server/web/spec-extension/request'
import { ObjectId } from 'mongodb'
import { NextResponse } from 'next/server'
import { getDb } from '@/core/db'
import { getTelegramId } from '@/lib/serverHelpers'

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  let telegramId
  try {
    telegramId = getTelegramId(request)
  }
  catch (error) {
    return NextResponse.json({ error }, { status: 403 })
  }

  const db = await getDb()
  const group = await db.groups.findOne({ _id: new ObjectId(id) })
  if (!group) {
    return NextResponse.json({ error: 'Group not found' }, { status: 404 })
  }
  const player = await db.players.findOne({ telegramId })
  if (!player) {
    return NextResponse.json({ error: 'Player not found' }, { status: 404 })
  }
  if (!group.members.includes(player._id!)) {
    return NextResponse.json({ error: 'Player is not a member of the group' }, { status: 400 })
  }
  await db.groups.updateOne(
    { _id: new ObjectId(id) },
    { $pull: { members: player._id! } },
  )
  return NextResponse.json({ message: 'Player left the group successfully' })
}
