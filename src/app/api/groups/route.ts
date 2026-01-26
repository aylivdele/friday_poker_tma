import type { NextRequest } from 'next/server'
import type { Group } from '@/types/types'
import { ObjectId } from 'mongodb'
import { NextResponse } from 'next/server'
import { getDb } from '@/core/db'
import { deserealizeBody, nonNull } from '../helpers'

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams
  const searchString = searchParams.get('search')
  const playerId = searchParams.get('playerId')

  if (playerId) {
    const groups = await (await getDb()).groups.find({ members: new ObjectId(playerId) }).toArray()
    return NextResponse.json(groups)
  }

  if (searchString) {
    const groups = await (await getDb()).groups.find({ name: { $regex: searchString, $options: 'i' } }).toArray()
    return NextResponse.json(groups)
  }

  const groups = await (await getDb()).groups.find({}).toArray()
  return NextResponse.json(groups)
}

export async function POST(request: NextRequest) {
  const { name, ownerId } = await deserealizeBody<Partial<Group>>(request, 'group')
  if (!ownerId) {
    return NextResponse.json({ error: 'ownerId is required' }, { status: 400 })
  }
  const newGroup = {
    name: name ?? 'New Group',
    ownerId,
    members: [ownerId],
    createdAt: Date.now(),
  }

  const result = await (await getDb()).groups.insertOne(newGroup)
  return NextResponse.json({ ...newGroup, _id: result.insertedId })
}
