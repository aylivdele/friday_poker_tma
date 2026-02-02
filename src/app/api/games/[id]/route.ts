import type { NextRequest } from 'next/server'
import type { Game } from '@/types/db'
import { ObjectId } from 'mongodb'
import { NextResponse } from 'next/server'
import { getDb } from '@/core/db'
import { deserealizeBody } from '../../helpers'

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  const games = await (await getDb()).games.findOne({ _id: new ObjectId(params.id) })
  return NextResponse.json(games, { status: 200 })
}

export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  const id = new ObjectId(params.id)
  const updatedGame = await deserealizeBody<Partial<Game>>(req, 'game')
  const result = await (await getDb()).games.updateOne({ _id: id }, { $set: updatedGame })
  if (result.matchedCount === 0) {
    return NextResponse.json({ error: 'Game not found' }, { status: 404 })
  }
  return NextResponse.json(updatedGame)
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  const id = new ObjectId(params.id)
  const result = await (await getDb()).games.deleteOne({ _id: id })
  if (result.deletedCount === 0) {
    return NextResponse.json({ error: 'Game not found' }, { status: 404 })
  }
  return NextResponse.json({ message: 'Game deleted successfully' })
}
