import type { NextRequest } from 'next/server'
import type { Player } from '@/types/db'
import { ObjectId } from 'mongodb'
import { NextResponse } from 'next/server'
import { getDb } from '@/core/db'
import { deserealizeBody } from '@/lib/serverHelpers'

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const player = await deserealizeBody<Partial<Player>>(req, 'player')
  const prevId = player._id
  const { id } = await params
  player._id = new ObjectId(id)
  const result = await (await getDb()).players.updateOne(
    { _id: new ObjectId(id) },
    { $set: player },
  )
  if (result.matchedCount === 0) {
    return NextResponse.json({ error: 'Player not found' }, { status: 404 })
  }
  else {
    await (await getDb()).games.deleteOne({ _id: prevId })
  }
  return NextResponse.json(player)
}
