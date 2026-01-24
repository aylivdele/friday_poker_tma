import { NextResponse } from 'next/server'
import { getDb } from '@/core/db'

export async function GET() {
  const seasons = await (await getDb()).seasons.find({}).toArray()
  return NextResponse.json(seasons, { status: 200 })
}

export async function POST(request: Request) {
  const body = await request.json()
  const season = await (await getDb()).seasons.insertOne(body)
  return NextResponse.json(season, { status: 200 })
}
