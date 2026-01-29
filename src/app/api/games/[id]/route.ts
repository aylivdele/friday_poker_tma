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
  const game = await (await getDb()).games.findOne({ _id: id })
  if (!game) {
    return NextResponse.json({ error: 'Game not found' }, { status: 404 })
  }
  const updatedGame = { ...game, ...await deserealizeBody<Partial<Game>>(req, 'game'), _id: id }
  await (await getDb()).games.updateOne({ _id: id }, { $set: updatedGame })
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
