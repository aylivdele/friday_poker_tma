import type { NextRequest } from 'next/server'
import type { Season } from '@/types/db'
import { ObjectId } from 'mongodb'
import { NextResponse } from 'next/server'
import { getDb } from '@/core/db'
import { deserealizeBody } from '../../../../lib/serverHelpers'

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
