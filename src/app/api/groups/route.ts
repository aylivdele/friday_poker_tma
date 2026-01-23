import type { NextRequest } from 'next/server'
import { NextResponse } from 'next/server'
import { getDb } from '@/core/db'

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams
  const searchString = searchParams.get('search')

  if (searchString) {
    const groups = (await getDb()).groups.find({ name: { $regex: searchString, $options: 'i' } })
    return NextResponse.json(groups)
  }

  const groups = (await getDb()).groups.find({}).limit(5)
  return NextResponse.json(groups)
}

export async function POST(request: NextRequest) {
  const { name, ownerId } = await request.json()
  const newGroup = {
    name,
    ownerId,
    members: [ownerId],
    createdAt: new Date(),
  }

  const result = await (await getDb()).groups.insertOne(newGroup)
  return NextResponse.json({ ...newGroup, _id: result.insertedId })
}
