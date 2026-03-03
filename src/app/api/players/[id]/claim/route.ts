import type { NextRequest } from 'next/server'
import { ObjectId } from 'mongodb'
import { NextResponse } from 'next/server'
import { getDb } from '@/core/db'
import { updateAchievments } from '@/lib/achievments'
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
  const session = db.client.client.startSession()
  try {
    session.startTransaction()

    const caller = await db.players.findOne({ telegramId: tgId })
    if (!caller) {
      return NextResponse.json({ error: 'You are not registered' }, { status: 401 })
    }
    const { id } = await params
    const claimedId = new ObjectId(id)

    const result = await db.players.deleteOne(
      { _id: claimedId },
      { session },
    )
    if (result.deletedCount === 0) {
      await session.abortTransaction()
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
          session,
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
          session,
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
          session,
        },
      )
      // recalc achievments
      const games = await db.games.find({ 'players.playerId': caller._id }).toArray()
      games.sort((a, b) => a.createdAt - b.createdAt)
      for (const game of games) {
        await updateAchievments(game._id, caller._id)
      }
    }
    await session.commitTransaction()
  }
  catch (e) {
    await session.abortTransaction()
    throw e
  }
  finally {
    await session.endSession()
  }
  return NextResponse.json({ message: 'Success' })
}
