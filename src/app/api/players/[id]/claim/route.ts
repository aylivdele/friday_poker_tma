import type { NextRequest } from 'next/server'
import { ObjectId } from 'mongodb'
import { NextResponse } from 'next/server'
import { getDb } from '@/core/db'
import { getTelegramId } from '@/lib/serverHelpers'

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  let tgId
  try {
    tgId = getTelegramId(req)
  }
  catch (error) {
    return NextResponse.json({ error }, { status: 403 })
  }
  const db = await getDb()
  const caller = await db.players.findOne({ telegramId: tgId })
  if (!caller) {
    return NextResponse.json({ error: 'You are not registered' }, { status: 401 })
  }
  const { id: claimedId } = await params
  const result = await db.players.deleteOne(
    { _id: new ObjectId(claimedId) },
  )
  if (result.deletedCount === 0) {
    return NextResponse.json({ error: 'Player not found' }, { status: 404 })
  }
  else {
    await db.games.updateMany(
      {
        $or: [
          { 'players.playerId': claimedId },
          { 'results.playerId': claimedId },
        ],
      },
      {
        $set: {
          'players.$[p].playerId': caller._id,
          'results.$[r].playerId': caller._id,
        },
      },
      {
        arrayFilters: [
          { 'p.playerId': claimedId },
          { 'r.playerId': claimedId },
        ],
      },
    )
  }
  return NextResponse.json(caller)
}
