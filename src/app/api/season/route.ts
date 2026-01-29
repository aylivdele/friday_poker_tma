import type { NextRequest } from 'next/server'
import type { Season } from '@/types/db'
import { NextResponse } from 'next/server'
import { getDb } from '@/core/db'
import { deserealizeBody } from '../helpers'

export async function GET() {
  const seasons = await (await getDb()).seasons.find({}).toArray()
  return NextResponse.json(seasons, { status: 200 })
}

export async function POST(request: NextRequest) {
  const body = await deserealizeBody<Partial<Season>>(request, 'season')
  if (!body.groupId) {
    return NextResponse.json({ error: 'groupId is required' }, { status: 400 })
  }
  if (!body.title) {
    body.title = `Сезон ${new Date().toLocaleDateString()}`
  }
  if (!body.gameIds) {
    body.gameIds = []
  }
  // @ts-expect-error group id is not undefined
  const season = await (await getDb()).seasons.insertOne(body)
  return NextResponse.json(season, { status: 200 })
}
