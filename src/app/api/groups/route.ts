import type { NextRequest } from 'next/server'
import type { Group } from '@/types/db'
import { ObjectId } from 'mongodb'
import { NextResponse } from 'next/server'
import { getDb } from '@/core/db'
import { deserealizeBody, getInitData, isNull } from '../helpers'

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams
  const searchString = searchParams.get('search')
  const playerId = searchParams.get('playerId')
  const useInitData = searchParams.get('useInitData') === 'true'

  if (useInitData) {
    let initData
    try {
      initData = getInitData(request)
      if (isNull(initData.user?.id)) {
        throw new Error('User id not found')
      }
    }
    catch (error) {
      return NextResponse.json({ error }, { status: 403 })
    }
    const player = await (await getDb()).players.findOne({ telegramId: initData.user.id })
    if (player) {
      const groups = await (await getDb()).groups.find({ members: player._id }).toArray()
      return NextResponse.json(groups)
    }
    return NextResponse.json({ error: 'Player not found' }, { status: 404 })
  }

  if (playerId) {
    const groups = await (await getDb()).groups.find({ members: new ObjectId(playerId) }).toArray()
    return NextResponse.json(groups)
  }

  if (searchString) {
    const groups = await (await getDb()).groups.find({ title: { $regex: searchString, $options: 'i' } }).toArray()
    return NextResponse.json(groups)
  }

  const groups = await (await getDb()).groups.find({}).toArray()
  return NextResponse.json(groups)
}

export async function POST(request: NextRequest) {
  let initData
  try {
    initData = getInitData(request)
    if (isNull(initData.user?.id)) {
      throw new Error(`Telegram user id not provided`)
    }
  }
  catch (error) {
    return NextResponse.json({ error }, { status: 401 })
  }
  const db = await getDb()
  const caller = await db.players.findOne({ telegramId: initData.user.id })
  const { title, ownerId } = await deserealizeBody<Partial<Group>>(request, 'group')
  const creater = ownerId ?? caller?._id

  if (isNull(creater)) {
    return NextResponse.json({ error: 'creater info is required' }, { status: 400 })
  }

  const newGroup = {
    title: title ?? 'New Group',
    ownerId: creater,
    members: [creater],
    createdAt: Date.now(),
  }

  const result = await db.groups.insertOne(newGroup)
  return NextResponse.json({ ...newGroup, _id: result.insertedId })
}
