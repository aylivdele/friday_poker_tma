import type { NextRequest } from 'next/server'
import type { Player, Season } from '@/types/db'
import { ObjectId } from 'mongodb'
import { NextResponse } from 'next/server'
import { getDb } from '@/core/db'
import { deserealizeBody } from '../../helpers'

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  const season = await (await getDb()).seasons.findOne({ _id: new ObjectId(params.id) })
  return season ? NextResponse.json(season) : NextResponse.json({ error: 'Season not found' }, { status: 404 })
}

export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  const newSeasonData = await deserealizeBody<Partial<Season>>(request, 'season')
  newSeasonData._id = new ObjectId(params.id)
  const result = await (await getDb()).seasons.updateOne(
    { _id: new ObjectId(params.id) },
    { $set: newSeasonData },
  )
  if (result.matchedCount === 0) {
    return NextResponse.json({ error: 'Season not found' }, { status: 404 })
  }
  return NextResponse.json({ message: 'Season updated successfully' })
}
