import type { NextRequest } from 'next/server'
import type { Player } from '@/types/types'
import { ObjectId } from 'mongodb'
import { NextResponse } from 'next/server'
import { getDb } from '@/core/db'
import { deserealizeBody } from '../../helpers'

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  const player = await (await getDb()).players.findOne({ _id: new ObjectId(params.id) })
  return player ? NextResponse.json(player) : NextResponse.json({ error: 'Player not found' }, { status: 404 })
}

export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  const newPlayerData = await deserealizeBody<Partial<Player>>(request, 'player')
  newPlayerData._id = new ObjectId(params.id)
  const result = await (await getDb()).players.updateOne(
    { _id: new ObjectId(params.id) },
    { $set: newPlayerData },
  )
  if (result.matchedCount === 0) {
    return NextResponse.json({ error: 'Player not found' }, { status: 404 })
  }
  return NextResponse.json({ message: 'Player updated successfully' })
}
