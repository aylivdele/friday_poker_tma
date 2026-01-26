import type { NextRequest } from 'next/server'
import type { Player } from '@/types/types'
import { ObjectId } from 'mongodb'
import { NextResponse } from 'next/server'
import { deserealizeBody } from '@/app/api/helpers'
import { getDb } from '@/core/db'

export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  const player = await deserealizeBody<Partial<Player>>(req, 'player')
  const prevId = player._id
  player._id = new ObjectId(params.id)
  const result = await (await getDb()).players.updateOne(
    { _id: new ObjectId(params.id) },
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
