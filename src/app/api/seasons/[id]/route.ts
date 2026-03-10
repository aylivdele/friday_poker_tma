import type { NextRequest } from 'next/server'
import type { Season } from '@/types/db'
import { ObjectId } from 'mongodb'
import { NextResponse } from 'next/server'
import { getDb } from '@/core/db'
import { nonNull } from '@/lib/helpers'
import { deserealizeBody, getTelegramId } from '../../../../lib/serverHelpers'

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const season = await (await getDb()).seasons.findOne({ _id: new ObjectId((await params).id) })
  return season ? NextResponse.json(season) : NextResponse.json({ error: 'Season not found' }, { status: 404 })
}

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const newSeasonData = await deserealizeBody<Partial<Season>>(request, 'season')
  const { id } = await params
  newSeasonData._id = new ObjectId(id)
  const result = await (await getDb()).seasons.updateOne(
    { _id: new ObjectId(id) },
    { $set: newSeasonData },
  )
  if (result.matchedCount === 0) {
    return NextResponse.json({ error: 'Season not found' }, { status: 404 })
  }
  return NextResponse.json({ message: 'Season updated successfully' })
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  let telegramId
  try {
    telegramId = getTelegramId(request)
  }
  catch (error) {
    return NextResponse.json({ error }, { status: 403 })
  }
  const db = await getDb()
  const user = await db.players.findOne({ telegramId })
  if (!user) {
    return NextResponse.json({ error: 'User not found' }, { status: 401 })
  }
  const season = await db.seasons.findOne({ _id: new ObjectId(id) })
  if (!season) {
    return NextResponse.json({ error: 'Season not found' }, { status: 404 })
  }
  if (nonNull(season.groupId)) {
    const group = await db.groups.findOne({ _id: season.groupId })
    if (!group) {
      return NextResponse.json({ error: 'Group not found' }, { status: 500 })
    }
    if (!group.ownerId.equals(user._id)) {
      return NextResponse.json({ error: 'Anauthorized' }, { status: 403 })
    }
  }
  await db.seasons.deleteOne({ _id: season._id })
  return NextResponse.json({ message: 'Group deleted successfully' })
}
