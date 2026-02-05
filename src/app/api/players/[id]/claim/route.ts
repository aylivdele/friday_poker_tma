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
  const prevId = caller._id
  const { id } = await params
  caller._id = new ObjectId(id)
  const result = await db.players.updateOne(
    { _id: new ObjectId(id) },
    { $set: caller },
  )
  if (result.matchedCount === 0) {
    return NextResponse.json({ error: 'Player not found' }, { status: 404 })
  }
  else {
    await db.games.deleteOne({ _id: prevId })
  }
  return NextResponse.json(caller)
}
