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
  const { id } = await params
  const claimedId = new ObjectId(id)
  const result = await db.players.deleteOne(
    { _id: claimedId },
  )
  if (result.deletedCount === 0) {
    return NextResponse.json({ error: 'Player not found' }, { status: 404 })
  }
  else {
    await db.games.updateMany(
      { 'players.playerId': claimedId },
      {
        $set: {
          'players.$[p].playerId': caller._id,
        },
      },
      {
        arrayFilters: [{ 'p.playerId': claimedId }],
      },
    )

    await db.games.updateMany(
      { 'results.playerId': claimedId },
      {
        $set: {
          'results.$[r].playerId': caller._id,
        },
      },
      {
        arrayFilters: [{ 'r.playerId': claimedId }],
      },
    )

    await db.groups.updateMany(
      { members: claimedId },
      {
        $set: {
          'members.$[m]': caller._id,
        },
      },
      {
        arrayFilters: [{ m: claimedId }],
      },
    )
  }
  return NextResponse.json(caller)
}
