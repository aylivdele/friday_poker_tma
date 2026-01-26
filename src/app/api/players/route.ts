import type { NextRequest } from 'next/server'
import type { Player } from '@/types/types'
import { ObjectId } from 'mongodb'
import { NextResponse } from 'next/server'
import { deserealizeBody, getTelegramId } from '@/app/api/helpers'
import { getDb } from '@/core/db'

export async function POST(req: NextRequest) {
  let telegramId
  try {
    telegramId = getTelegramId(req)
  }
  catch (error) {
    return NextResponse.json({ error }, { status: 403 })
  }

  let player: Player | null = await (
    await getDb()
  ).players.findOne({ telegramId })
  if (!player) {
    player = {
      ...await deserealizeBody<Partial<Player>>(req, 'player'),
      telegramId,
      createdAt: Date.now(),
    }

    const result = await (await getDb()).players.insertOne(player)
    player._id = result.insertedId
  }

  return NextResponse.json(player)
}

export async function GET(req: NextRequest) {
  const searchParams = req.nextUrl.searchParams
  const searchString = searchParams.get('search')
  const groupId = searchParams.get('groupId')
  const tgId = searchParams.get('telegramId')

  if (tgId) {
    let telegramId
    try {
      telegramId = getTelegramId(req)
    }
    catch (error) {
      return NextResponse.json({ error }, { status: 403 })
    }
    const player = await (await getDb()).players.findOne({ telegramId })
    return NextResponse.json(player)
  }

  let players: Player[]
  if (searchString) {
    players = await (await getDb()).players.find({
      $or: [
        { firstName: { $regex: searchString, $options: 'i' } },
        { username: { $regex: searchString, $options: 'i' } },
      ],
    }).toArray()
  }
  else if (groupId) {
    players = await (await getDb()).groups.findOne({ _id: new ObjectId(groupId) }).then(async group =>
      (await getDb()).players.find({ _id: { $in: group?.members } }).toArray(),
    )
  }
  else {
    players = await (await getDb()).players.find({}).toArray()
  }

  return NextResponse.json(players)
}
