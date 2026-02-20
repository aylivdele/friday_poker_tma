import type { NextRequest } from 'next/server'
import type { Game } from '@/types/db'
import { ObjectId } from 'mongodb'
import { NextResponse } from 'next/server'
import { getDb } from '@/core/db'
import { nonNull } from '@/lib/helpers'
import { deserealizeBody } from '../../../../lib/serverHelpers'
import { calculateSeasonResults } from '../../seasons/[id]/results/results'

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const games = await (await getDb()).games.findOne({ _id: new ObjectId(id) })
  return NextResponse.json(games, { status: 200 })
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id: sid } = await params

  const db = await getDb()
  const id = new ObjectId(sid)
  const updatedGame = await deserealizeBody<Partial<Game>>(req, 'game')
  const result = await db.games.updateOne({ _id: id }, { $set: updatedGame })
  if (result.matchedCount === 0) {
    return NextResponse.json({ error: 'Game not found' }, { status: 404 })
  }
  if (updatedGame.isFinished && nonNull(updatedGame.seasonId)) {
    const seasonTable = await calculateSeasonResults(updatedGame.seasonId.toString())
    await db.seasons.updateOne({ _id: id }, { $set: { table: seasonTable } })
  }
  return NextResponse.json(updatedGame)
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const id = new ObjectId((await params).id)
  const db = await getDb()

  const game = await db.games.findOne({ _id: id })

  if (!game) {
    return NextResponse.json({ error: 'Game not found' }, { status: 404 })
  }
  const session = db.client.client.startSession()

  try {
    session.startTransaction()

    await db.seasons.updateOne({ _id: game.seasonId }, { $pull: { gameIds: id } }, { session })
    await db.games.deleteOne({ _id: id }, { session })

    await session.commitTransaction()
    return NextResponse.json({ message: 'Game deleted successfully' })
  }
  catch (e) {
    await session.abortTransaction()
    throw e
  }
  finally {
    await session.endSession()
  }
}
